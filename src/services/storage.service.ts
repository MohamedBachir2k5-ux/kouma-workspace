import { supabase } from '../lib/supabase'
import type { FileRow } from '../lib/database.types'

// Two buckets: 'documents' (permanent) and 'attachments' (conversation-scoped)
const DOCUMENT_BUCKET = 'documents'
const ATTACHMENT_BUCKET = 'attachments'

export interface UploadParams {
  file: File
  organizationId: string
  ownerId: string
  category: 'document' | 'attachment'
  teamId?: string
}

export interface UploadResult {
  fileId: string | null
  publicUrl: string | null
  error: string | null
}

export const StorageService = {
  async upload(params: UploadParams): Promise<UploadResult> {
    const bucket = params.category === 'document' ? DOCUMENT_BUCKET : ATTACHMENT_BUCKET
    const ext = params.file.name.split('.').pop() ?? 'bin'
    const path = `${params.organizationId}/${Date.now()}-${crypto.randomUUID()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, params.file, { upsert: false })

    if (uploadError) return { fileId: null, publicUrl: null, error: uploadError.message }

    const { data: fileRecord, error: dbError } = await supabase
      .from('files')
      .insert({
        owner_id: params.ownerId,
        organization_id: params.organizationId,
        storage_path: `${bucket}/${path}`,
        name: params.file.name,
        type: ext,
        size: params.file.size,
        category: params.category,
      })
      .select()
      .single()

    if (dbError) return { fileId: null, publicUrl: null, error: dbError.message }

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path)
    return { fileId: fileRecord.id, publicUrl: urlData.publicUrl, error: null }
  },

  async getSignedUrl(storagePath: string, expiresInSeconds = 3600): Promise<string | null> {
    const [bucket, ...rest] = storagePath.split('/')
    const path = rest.join('/')
    const { data } = await supabase.storage.from(bucket).createSignedUrl(path, expiresInSeconds)
    return data?.signedUrl ?? null
  },

  async delete(fileId: string): Promise<{ error: string | null }> {
    const { data: file } = await supabase.from('files').select('storage_path').eq('id', fileId).single()
    if (!file) return { error: 'Fichier introuvable.' }

    const [bucket, ...rest] = file.storage_path.split('/')
    await supabase.storage.from(bucket).remove([rest.join('/')])
    const { error } = await supabase.from('files').delete().eq('id', fileId)
    return { error: error?.message ?? null }
  },

  async getOrganizationFiles(organizationId: string, category?: 'document' | 'attachment'): Promise<FileRow[]> {
    let query = supabase.from('files').select('*').eq('organization_id', organizationId)
    if (category) query = query.eq('category', category)
    const { data } = await query
    return data ?? []
  },

  async getStorageUsed(organizationId: string): Promise<number> {
    const { data } = await supabase
      .from('files')
      .select('size')
      .eq('organization_id', organizationId)
    return (data ?? []).reduce((sum, f) => sum + f.size, 0)
  },

  formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} o`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} Go`
  },
}
