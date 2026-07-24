import { supabase } from '../lib/supabase'
import type { Document, Folder } from '../lib/types'
import { cryptoSession } from '../lib/crypto-session'
import { KeyService } from './key.service'

type DocumentWithFile = {
  id: string
  organization_id: string
  folder_id: string | null
  owner_id: string
  title: string
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
    teamId: undefined,
    ownerId: r.owner_id,
    name: r.files?.name ?? r.title,
    type: r.files?.type ?? '',
    size: r.files?.size ?? 0,
    createdAt: new Date().toISOString(),
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

  async getByTeam(teamId: string): Promise<Document[]> {
    const { data: folderRows } = await supabase
      .from('folders')
      .select('id')
      .eq('team_id', teamId)

    const folderIds = (folderRows ?? []).map((f: { id: string }) => f.id)
    if (!folderIds.length) return []

    const { data } = await supabase
      .from('documents')
      .select('*, files(name, type, size, storage_path)')
      .in('folder_id', folderIds)
      .order('created_at', { ascending: false })

    return ((data ?? []) as unknown as DocumentWithFile[]).map(rowToDocument)
  },

  async listFolders(orgId: string): Promise<Folder[]> {
    const { data } = await supabase
      .from('folders')
      .select('id, organization_id, parent_id, team_id, name, created_at')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: true })
    return (data ?? []).map(r => ({
      id: r.id,
      organizationId: r.organization_id,
      parentId: r.parent_id ?? null,
      teamId: r.team_id ?? null,
      name: r.name,
      createdAt: r.created_at,
    }))
  },

  async createFolder(orgId: string, name: string): Promise<{ folder: Folder | null; error: string | null }> {
    const { data, error } = await supabase
      .from('folders')
      .insert({ organization_id: orgId, name, parent_id: null, team_id: null })
      .select('id, organization_id, parent_id, team_id, name, created_at')
      .single()
    if (error || !data) return { folder: null, error: error?.message ?? 'Erreur création dossier.' }
    return {
      folder: {
        id: data.id,
        organizationId: data.organization_id,
        parentId: data.parent_id ?? null,
        teamId: data.team_id ?? null,
        name: data.name,
        createdAt: data.created_at,
      },
      error: null,
    }
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
        if (fileKey.key) {
          const iv = crypto.getRandomValues(new Uint8Array(12)) as Uint8Array<ArrayBuffer>
          const cipherBuf = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, tagLength: 128 }, fileKey.key, buf)
          const out = new Uint8Array(12 + cipherBuf.byteLength)
          out.set(iv, 0)
          out.set(new Uint8Array(cipherBuf), 12)
          uploadBlob = new Blob([out], { type: 'application/octet-stream' })
        }
      } catch {
        // Fall back to plaintext on crypto failure
      }
    }

    const { error: uploadErr } = await supabase.storage
      .from('attachments')
      .upload(storagePath, uploadBlob, { contentType: uploadBlob.type })

    if (uploadErr) return { document: null, error: uploadErr.message }

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

    if (fileErr || !fileRecord) return { document: null, error: fileErr?.message ?? 'Erreur fichier.' }

    const { data: docRecord, error: docErr } = await supabase
      .from('documents')
      .insert({
        organization_id: orgId,
        owner_id: userId,
        title: file.name,
        file_id: fileRecord.id,
        folder_id: folderId ?? null,
      })
      .select('*, files(name, type, size, storage_path)')
      .single()

    if (docErr || !docRecord) return { document: null, error: docErr?.message ?? 'Erreur document.' }

    return { document: rowToDocument(docRecord as unknown as DocumentWithFile), error: null }
  },

  // Download a document and decrypt it if the file key is available.
  async downloadDocument(documentId: string, orgId: string): Promise<{ error: string | null }> {
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

    const blob = new Blob([plainBuf])
    const blobUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = blobUrl
    a.download = fileInfo.name
    a.click()
    setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000)

    return { error: null }
  },
}
