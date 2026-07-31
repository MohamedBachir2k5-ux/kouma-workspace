import { supabase } from '../lib/supabase'
import type { Document, DocumentVisibility, Folder } from '../lib/types'
import { cryptoSession } from '../lib/crypto-session'
import { KeyService } from './key.service'
import { serviceError, friendlyError } from '../lib/errors'
import { downloadBlob } from '../lib/utils'

type DocumentWithFile = {
  id: string
  organization_id: string
  folder_id: string | null
  owner_id: string
  title: string
  visibility: DocumentVisibility
  team_id: string | null
  conversation_id: string | null
  created_at: string
  files: {
    name: string
    type: string
    size: number
    storage_path: string
  } | null
}

function rowToDocument(r: DocumentWithFile): Document {
  return {
    id: r.id,
    organizationId: r.organization_id,
    folderId: r.folder_id ?? undefined,
    teamId: r.team_id ?? undefined,
    conversationId: r.conversation_id ?? undefined,
    ownerId: r.owner_id,
    name: r.files?.name ?? r.title,
    type: r.files?.type ?? '',
    size: r.files?.size ?? 0,
    visibility: r.visibility ?? 'org',
    createdAt: r.created_at ?? new Date().toISOString(),
  }
}

export const DocumentService = {
  async list(orgId: string): Promise<Document[]> {
    const { data } = await supabase
      .from('documents')
      .select('*, files(name, type, size, storage_path)')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })
    return ((data ?? []) as unknown as DocumentWithFile[]).map(rowToDocument)
  },

  async listByVisibility(orgId: string, visibility: DocumentVisibility, scopeId?: string): Promise<Document[]> {
    let q = supabase
      .from('documents')
      .select('*, files(name, type, size, storage_path)')
      .eq('organization_id', orgId)
      .eq('visibility', visibility)
      .order('created_at', { ascending: false })

    if (visibility === 'team' && scopeId) q = q.eq('team_id', scopeId)
    if (visibility === 'group' && scopeId) q = q.eq('conversation_id', scopeId)

    const { data } = await q
    return ((data ?? []) as unknown as DocumentWithFile[]).map(rowToDocument)
  },

  async getByTeam(teamId: string): Promise<Document[]> {
    const { data } = await supabase
      .from('documents')
      .select('*, files(name, type, size, storage_path)')
      .eq('team_id', teamId)
      .eq('visibility', 'team')
      .order('created_at', { ascending: false })
    return ((data ?? []) as unknown as DocumentWithFile[]).map(rowToDocument)
  },

  async listFolders(orgId: string): Promise<Folder[]> {
    const { data } = await supabase
      .from('folders')
      .select('id, organization_id, parent_id, team_id, name, created_at, created_by, visibility')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: true })
    return (data ?? []).map(r => ({
      id: r.id,
      organizationId: r.organization_id,
      parentId: r.parent_id ?? null,
      teamId: r.team_id ?? null,
      name: r.name,
      createdAt: r.created_at,
      createdBy: r.created_by ?? null,
      visibility: (r.visibility ?? 'personal') as 'personal' | 'org',
    }))
  },

  async createFolder(
    orgId: string,
    name: string,
    visibility: 'personal' | 'org' = 'personal',
  ): Promise<{ folder: Folder | null; error: string | null }> {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('folders')
      .insert({ organization_id: orgId, name, parent_id: null, team_id: null, visibility, created_by: user?.id ?? null })
      .select('id, organization_id, parent_id, team_id, name, created_at, created_by, visibility')
      .single()
    if (error || !data) return { folder: null, error: friendlyError(error?.message) ?? 'Erreur création dossier.' }
    return {
      folder: {
        id: data.id,
        organizationId: data.organization_id,
        parentId: data.parent_id ?? null,
        teamId: data.team_id ?? null,
        name: data.name,
        createdAt: data.created_at,
        createdBy: data.created_by ?? null,
        visibility: data.visibility as 'personal' | 'org',
      },
      error: null,
    }
  },

  async deleteFolder(folderId: string): Promise<{ error: string | null }> {
    // Move all documents out before deleting (avoids orphaned docs)
    await supabase.from('documents').update({ folder_id: null }).eq('folder_id', folderId)
    const { error } = await supabase.from('folders').delete().eq('id', folderId)
    return { error: serviceError(error) }
  },

  async totalUsed(orgId: string): Promise<number> {
    const { data } = await supabase
      .from('files')
      .select('size')
      .eq('organization_id', orgId)
    return (data ?? []).reduce((sum, f) => sum + (f.size ?? 0), 0)
  },

  // Upload a document. If the crypto session is loaded, the file is AES-256-GCM
  // encrypted (IV || ciphertext) and the key is stored in file_keys / file_recovery_keys.
  async uploadDocument(
    orgId: string,
    userId: string,
    file: File,
    folderId?: string,
    visibility: DocumentVisibility = 'personal',
    teamId?: string,
    conversationId?: string,
  ): Promise<{ document: Document | null; error: string | null }> {
    const ALLOWED_TYPES = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'image/png', 'image/jpeg', 'image/gif', 'image/webp',
      'text/plain', 'text/csv',
      'application/zip', 'application/x-zip-compressed',
    ]
    if (!ALLOWED_TYPES.includes(file.type)) {
      return { document: null, error: 'Type de fichier non autorisé.' }
    }
    if (file.size > 50 * 1024 * 1024) {
      return { document: null, error: 'Fichier trop volumineux (max 50 Mo).' }
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'bin'
    const encrypted = cryptoSession.isLoaded

    const storagePath = encrypted
      ? `${orgId}/docs/${userId}/${Date.now()}_${safeName}.enc`
      : `${orgId}/docs/${userId}/${Date.now()}_${safeName}`

    let uploadBlob: Blob = file

    if (encrypted) {
      try {
        const buf = await file.arrayBuffer()
        const fileKey = await KeyService.initFileKey(storagePath, orgId)
        if (!fileKey.key) {
          return { document: null, error: 'Clé de chiffrement indisponible. Rechargez la page.' }
        }
        const iv = crypto.getRandomValues(new Uint8Array(12)) as Uint8Array<ArrayBuffer>
        const cipherBuf = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, tagLength: 128 }, fileKey.key, buf)
        const out = new Uint8Array(12 + cipherBuf.byteLength)
        out.set(iv, 0)
        out.set(new Uint8Array(cipherBuf), 12)
        uploadBlob = new Blob([out], { type: 'application/octet-stream' })
      } catch {
        return { document: null, error: 'Erreur de chiffrement. Le document n\'a pas été envoyé.' }
      }
    }

    const { error: uploadErr } = await supabase.storage
      .from('attachments')
      .upload(storagePath, uploadBlob, { contentType: uploadBlob.type })

    if (uploadErr) return { document: null, error: friendlyError(uploadErr.message) ?? 'Erreur upload.' }

    const { data: fileRecord, error: fileErr } = await supabase
      .from('files')
      .insert({
        owner_id: userId,
        organization_id: orgId,
        storage_path: storagePath,
        name: file.name,
        type: ext,
        size: file.size,
        category: 'document',
      })
      .select()
      .single()

    if (fileErr || !fileRecord) return { document: null, error: friendlyError(fileErr?.message) ?? 'Erreur fichier.' }

    const { data: docRecord, error: docErr } = await supabase
      .from('documents')
      .insert({
        organization_id: orgId,
        owner_id: userId,
        title: file.name,
        file_id: fileRecord.id,
        folder_id: folderId ?? null,
        visibility,
        team_id: teamId ?? null,
        conversation_id: conversationId ?? null,
      })
      .select('*, files(name, type, size, storage_path)')
      .single()

    if (docErr || !docRecord) return { document: null, error: friendlyError(docErr?.message) ?? 'Erreur document.' }

    return { document: rowToDocument(docRecord as unknown as DocumentWithFile), error: null }
  },

  // Promote an already-uploaded attachment to a document record.
  async promoteFromPath(
    storagePath: string,
    orgId: string,
    userId: string,
    fileName: string,
    fileExt: string,
    fileSize: number,
    folderId?: string,
  ): Promise<{ document: Document | null; error: string | null }> {
    const { data: fileRecord, error: fileErr } = await supabase
      .from('files')
      .insert({
        owner_id: userId,
        organization_id: orgId,
        storage_path: storagePath,
        name: fileName,
        type: fileExt,
        size: fileSize,
        category: 'document',
      })
      .select()
      .single()

    if (fileErr || !fileRecord) return { document: null, error: friendlyError(fileErr?.message) ?? 'Erreur fichier.' }

    const { data: docRecord, error: docErr } = await supabase
      .from('documents')
      .insert({
        organization_id: orgId,
        owner_id: userId,
        title: fileName,
        file_id: fileRecord.id,
        folder_id: folderId ?? null,
        visibility: 'personal',
      })
      .select('*, files(name, type, size, storage_path)')
      .single()

    if (docErr || !docRecord) return { document: null, error: friendlyError(docErr?.message) ?? 'Erreur document.' }

    await supabase.from('audit_logs').insert({
      organization_id: orgId,
      user_id: userId,
      action: 'document_added',
      target_name: fileName,
    })

    return { document: rowToDocument(docRecord as unknown as DocumentWithFile), error: null }
  },

  async moveToFolder(documentId: string, folderId: string | null): Promise<{ error: string | null }> {
    const { error } = await supabase
      .from('documents')
      .update({ folder_id: folderId })
      .eq('id', documentId)
    return { error: serviceError(error) }
  },

  async deleteDocument(documentId: string): Promise<{ error: string | null }> {
    // Fetch file metadata before deletion for cleanup
    const { data: doc } = await supabase
      .from('documents')
      .select('file_id, files(storage_path)')
      .eq('id', documentId)
      .single()

    const fileId = doc?.file_id as string | null
    const storagePath = (doc?.files as { storage_path: string } | null)?.storage_path

    const { error } = await supabase.from('documents').delete().eq('id', documentId)
    if (error) return { error: serviceError(error) }

    // Clean up storage object and file record (fire-and-forget; non-fatal if they fail)
    if (storagePath) {
      supabase.storage.from('attachments').remove([storagePath]).then(() => {})
      supabase.from('file_keys').delete().eq('storage_path', storagePath).then(() => {})
    }
    if (fileId) {
      supabase.from('files').delete().eq('id', fileId).then(() => {})
    }

    return { error: null }
  },

  // Download a document and decrypt it if the file key is available.
  async downloadDocument(documentId: string, orgId: string, userId?: string): Promise<{ error: string | null }> {
    const { data: doc } = await supabase
      .from('documents')
      .select('title, files(storage_path, name)')
      .eq('id', documentId)
      .single()

    if (!doc) return { error: 'Document introuvable.' }

    const fileInfo = doc.files as { storage_path: string; name: string } | null
    if (!fileInfo?.storage_path) return { error: 'Fichier introuvable.' }

    const { data: signed, error: signErr } = await supabase.storage
      .from('attachments')
      .createSignedUrl(fileInfo.storage_path, 300)

    if (signErr || !signed) return { error: signErr?.message ?? 'Lien de téléchargement indisponible.' }

    const response = await fetch(signed.signedUrl)
    if (!response.ok) return { error: 'Téléchargement échoué.' }

    // Log document access (fire-and-forget)
    supabase.from('document_access_logs').insert({
      document_id: documentId,
      organization_id: orgId,
      user_id: userId ?? null,
      action: 'download',
    }).then(() => {})

    const rawBuf = await response.arrayBuffer()
    let plainBuf: ArrayBuffer = rawBuf

    if (fileInfo.storage_path.endsWith('.enc') && cryptoSession.isLoaded) {
      const fileKey = await KeyService.getOrLoadFileKey(fileInfo.storage_path, orgId)
      if (fileKey && rawBuf.byteLength > 12) {
        try {
          const iv = new Uint8Array(rawBuf, 0, 12) as Uint8Array<ArrayBuffer>
          const cipher = new Uint8Array(rawBuf, 12) as Uint8Array<ArrayBuffer>
          plainBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv, tagLength: 128 }, fileKey, cipher)
        } catch { /* serve raw if decryption fails */ }
      }
    }

    await downloadBlob(new Blob([plainBuf]), fileInfo.name)
    return { error: null }
  },

  // Decrypt and return a blob URL for in-app preview. Caller must revoke the URL when done.
  async getDocumentPreviewUrl(documentId: string, orgId: string): Promise<{ url: string | null; mimeType: string; name: string; error: string | null }> {
    const { data: doc } = await supabase
      .from('documents')
      .select('title, files(storage_path, name)')
      .eq('id', documentId)
      .single()

    if (!doc) return { url: null, mimeType: '', name: '', error: 'Document introuvable.' }
    const fileInfo = doc.files as { storage_path: string; name: string } | null
    if (!fileInfo?.storage_path) return { url: null, mimeType: '', name: doc.title ?? '', error: 'Fichier introuvable.' }

    const { data: signed, error: signErr } = await supabase.storage
      .from('attachments')
      .createSignedUrl(fileInfo.storage_path, 300)
    if (signErr || !signed) return { url: null, mimeType: '', name: fileInfo.name, error: 'Lien indisponible.' }

    const response = await fetch(signed.signedUrl)
    if (!response.ok) return { url: null, mimeType: '', name: fileInfo.name, error: 'Chargement échoué.' }

    const rawBuf = await response.arrayBuffer()
    let plainBuf: ArrayBuffer = rawBuf

    if (fileInfo.storage_path.endsWith('.enc') && cryptoSession.isLoaded) {
      const fileKey = await KeyService.getOrLoadFileKey(fileInfo.storage_path, orgId)
      if (fileKey && rawBuf.byteLength > 12) {
        try {
          const iv = new Uint8Array(rawBuf, 0, 12) as Uint8Array<ArrayBuffer>
          const cipher = new Uint8Array(rawBuf, 12) as Uint8Array<ArrayBuffer>
          plainBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv, tagLength: 128 }, fileKey, cipher)
        } catch { /* serve raw */ }
      }
    }

    const ext = (fileInfo.name.split('.').pop() ?? '').toLowerCase()
    const mimeMap: Record<string, string> = {
      pdf: 'application/pdf', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
      gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml',
    }
    const mimeType = mimeMap[ext] ?? 'application/octet-stream'
    const blob = new Blob([plainBuf], { type: mimeType })
    const url = URL.createObjectURL(blob)

    return { url, mimeType, name: fileInfo.name, error: null }
  },
}
