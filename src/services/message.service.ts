import { supabase } from '../lib/supabase'
import { serviceError, friendlyError } from '../lib/errors'
import type { Channel, Message, ChannelType } from '../lib/types'
import { CryptoService } from './crypto.service'
import { KeyService } from './key.service'
import { cryptoSession } from '../lib/crypto-session'

type MessageRow = {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  content_encrypted: boolean
  status: string
  reply_to_id: string | null
  edited_at: string | null
  files: string[] | null
  created_at: string
}

function rowToMessage(r: MessageRow): Message {
  return {
    id: r.id,
    channelId: r.conversation_id,
    senderId: r.sender_id,
    content: r.content,
    status: r.status as Message['status'],
    replyToId: r.reply_to_id ?? undefined,
    editedAt: r.edited_at ?? undefined,
    files: r.files ?? undefined,
    createdAt: r.created_at,
  }
}

// Decrypt a single row; falls back gracefully on any error.
async function decryptRow(row: MessageRow, orgId: string): Promise<Message> {
  if (!row.content_encrypted) return rowToMessage(row)
  try {
    const convKey = await KeyService.getOrLoadConversationKey(row.conversation_id, orgId)
    if (!convKey) return rowToMessage(row)
    const plaintext = await CryptoService.decryptMessage(row.content, convKey)
    return rowToMessage({ ...row, content: plaintext })
  } catch {
    return rowToMessage({ ...row, content: '[Impossible de déchiffrer]' })
  }
}

// Ensure conversation keys exist; initialises them on first use.
async function ensureConvKey(conversationId: string, orgId: string): Promise<CryptoKey | null> {
  let convKey = await KeyService.getOrLoadConversationKey(conversationId, orgId)
  if (convKey) return convKey

  const { data: members } = await supabase
    .from('conversation_members')
    .select('user_id')
    .eq('conversation_id', conversationId)
  const ids = (members ?? []).map(m => m.user_id)
  await KeyService.initConversationKeys(conversationId, orgId, ids)
  return KeyService.getOrLoadConversationKey(conversationId, orgId)
}

export const MessageService = {

  async markConversationRead(conversationId: string, userId: string): Promise<void> {
    await supabase.rpc('mark_conversation_read', {
      p_conversation_id: conversationId,
      p_user_id: userId,
    })
  },

  async getConversations(orgId: string, userId: string): Promise<Channel[]> {
    const { data: memberships } = await supabase
      .from('conversation_members')
      .select('conversation_id')
      .eq('user_id', userId)

    if (!memberships?.length) return []
    const convIds = memberships.map(m => m.conversation_id)

    const { data: convs } = await supabase
      .from('conversations')
      .select('*, conversation_members(user_id)')
      .eq('organization_id', orgId)
      .in('id', convIds)

    if (!convs?.length) return []

    const allMemberIds = [...new Set(
      convs.flatMap(c => (c as unknown as { conversation_members: { user_id: string }[] }).conversation_members.map(m => m.user_id))
    )]

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, firstname, lastname, email')
      .in('id', allMemberIds)

    const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]))

    const teamRefIds = convs
      .filter(c => c.type === 'team' && c.reference_id)
      .map(c => c.reference_id!)

    const teamNameMap: Record<string, string> = {}
    if (teamRefIds.length > 0) {
      const { data: teams } = await supabase
        .from('teams')
        .select('id, name')
        .in('id', teamRefIds)
      ;(teams ?? []).forEach(t => { teamNameMap[t.id] = t.name })
    }

    // Unread counts via RPC (single query, uses last_read_at from conversation_members)
    const { data: unreadRows } = await supabase.rpc('get_unread_counts', {
      p_user_id: userId,
      p_org_id: orgId,
    })
    const unreadMap: Record<string, number> = {}
    ;(unreadRows ?? []).forEach((r: { conversation_id: string; unread_count: number }) => {
      unreadMap[r.conversation_id] = Number(r.unread_count)
    })

    return convs.map(c => {
      const members = (c as unknown as { conversation_members: { user_id: string }[] })
        .conversation_members.map(m => m.user_id)

      let name = ''
      if (c.type === 'direct') {
        const otherId = members.find(id => id !== userId) ?? ''
        const p = profileMap[otherId]
        name = p ? `${p.firstname ?? ''} ${p.lastname ?? ''}`.trim() || p.email : 'Direct'
      } else if (c.type === 'team' && c.reference_id) {
        name = teamNameMap[c.reference_id] ?? 'Équipe'
      } else {
        name = members
          .filter(id => id !== userId)
          .slice(0, 2)
          .map(id => profileMap[id]?.firstname ?? '')
          .filter(Boolean)
          .join(', ') || 'Groupe'
      }

      return {
        id: c.id,
        organizationId: c.organization_id,
        name,
        type: c.type as ChannelType,
        teamId: c.type === 'team' ? c.reference_id ?? undefined : undefined,
        members,
        unreadCount: unreadMap[c.id] ?? 0,
      } satisfies Channel
    })
  },

  async countConversations(orgId: string): Promise<number> {
    const { count } = await supabase
      .from('conversations')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId)
    return count ?? 0
  },

  // Returns the most recent `limit` messages (or messages before `before` timestamp).
  // hasMore=true means older messages exist and can be fetched with a new `before` call.
  async getMessages(
    conversationId: string,
    orgId: string,
    limit = 100,
    before?: string,
  ): Promise<{ messages: Message[]; hasMore: boolean }> {
    let q = supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(limit + 1) // fetch one extra to detect whether more exist

    if (before) q = q.lt('created_at', before)

    const { data } = await q
    if (!data?.length) return { messages: [], hasMore: false }

    const hasMore = data.length > limit
    const slice = (hasMore ? data.slice(0, limit) : data) as unknown as MessageRow[]
    const decrypted = await Promise.all(slice.map(r => decryptRow(r, orgId)))
    return { messages: decrypted.reverse(), hasMore } // reverse to chronological order
  },

  // Phase 4: encrypts content when a conversation key is available.
  // Returns an error if the crypto session is loaded but encryption fails —
  // never silently falls back to plaintext when E2E is expected.
  async send(
    conversationId: string,
    senderId: string,
    content: string,
    orgId: string,
    files?: string[],
    convType?: string,
    replyToId?: string,
  ): Promise<{ message: Message | null; error: string | null }> {
    let finalContent = content
    let encrypted = false

    if (cryptoSession.isLoaded) {
      const convKey = await ensureConvKey(conversationId, orgId)
      if (!convKey) {
        return { message: null, error: 'Clé de chiffrement indisponible pour cette conversation. Rechargez la page.' }
      }
      try {
        finalContent = await CryptoService.encryptMessage(content, convKey)
        encrypted = true
      } catch {
        return { message: null, error: 'Erreur de chiffrement. Le message n\'a pas été envoyé.' }
      }
    }

    const { data } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        content: finalContent,
        content_encrypted: encrypted,
        status: 'sent',
        ...(files?.length ? { files } : {}),
        ...(replyToId ? { reply_to_id: replyToId } : {}),
      })
      .select()
      .single()

    if (!data) return { message: null, error: null }

    // Notify all other participants for all conversation types (fire-and-forget)
    supabase
      .from('conversation_members')
      .select('user_id')
      .eq('conversation_id', conversationId)
      .neq('user_id', senderId)
      .then(({ data: others }) => {
        if (others?.length) {
          const isFile = content.startsWith('📎')
          const preview = isFile ? content : content.slice(0, 80)
          supabase.rpc('notify_users', {
            p_user_ids: others.map(o => o.user_id),
            p_type: 'new_message',
            p_payload: { text: preview, conversationId, convType: convType ?? 'group' },
          })
        }
      })

    // Return the plaintext version for immediate local display
    return { message: rowToMessage({ ...(data as unknown as MessageRow), content, content_encrypted: false }), error: null }
  },

  async createDirectConversation(orgId: string, userId1: string, userId2: string): Promise<{ id: string | null; error: string | null }> {
    const { data, error } = await supabase.rpc('create_direct_conversation', {
      p_org_id: orgId,
      p_user1: userId1,
      p_user2: userId2,
    })
    if (error) return { id: null, error: friendlyError(error.message) }
    return { id: data as string, error: null }
  },

  async createGroupConversation(orgId: string, memberIds: string[]): Promise<{ id: string | null; error: string | null }> {
    const { data, error } = await supabase.rpc('create_group_conversation', {
      p_org_id: orgId,
      p_members: memberIds,
    })
    if (error) return { id: null, error: friendlyError(error.message) }
    return { id: data as string, error: null }
  },

  // Phase 4: Realtime — decrypts message before passing to callback.
  subscribe(conversationId: string, orgId: string, onMessage: (msg: Message) => void): () => void {
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        payload => {
          decryptRow(payload.new as MessageRow, orgId)
            .then(onMessage)
            .catch(() => onMessage(rowToMessage(payload.new as MessageRow)))
        },
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  },

  // Phase 5: encrypts file using the conversation key before upload.
  async uploadAttachment(
    orgId: string,
    conversationId: string,
    file: File,
  ): Promise<{ path: string | null; url: string | null; error: string | null }> {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const path = `${orgId}/${conversationId}/${Date.now()}_${safeName}`

    // Validate file type (allowlist — prevents XSS via HTML uploads)
    const ALLOWED_TYPES = [
      'image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain', 'text/csv',
      'application/zip', 'application/x-zip-compressed',
    ]
    if (!ALLOWED_TYPES.includes(file.type)) {
      return { path: null, url: null, error: 'Type de fichier non autorisé.' }
    }
    const MAX_SIZE = 50 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      return { path: null, url: null, error: 'Fichier trop volumineux (max 50 Mo).' }
    }

    let uploadBlob: Blob = file

    if (cryptoSession.isLoaded) {
      const convKey = await ensureConvKey(conversationId, orgId)
      if (!convKey) {
        return { path: null, url: null, error: 'Clé de chiffrement indisponible. Rechargez la page.' }
      }
      try {
        const buf = await file.arrayBuffer()
        const iv = crypto.getRandomValues(new Uint8Array(12)) as Uint8Array<ArrayBuffer>
        const cipherBuf = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, tagLength: 128 }, convKey, buf)
        const out = new Uint8Array(12 + cipherBuf.byteLength)
        out.set(iv, 0)
        out.set(new Uint8Array(cipherBuf), 12)
        uploadBlob = new Blob([out], { type: 'application/octet-stream' })
      } catch {
        return { path: null, url: null, error: 'Erreur de chiffrement du fichier. L\'envoi a été annulé.' }
      }
    }

    const { error } = await supabase.storage
      .from('attachments')
      .upload(path, uploadBlob, { contentType: uploadBlob.type })

    if (error) return { path: null, url: null, error: friendlyError(error.message) }

    // Bucket is private — always use signed URLs (1 h)
    const { data: signed, error: signErr } = await supabase.storage
      .from('attachments')
      .createSignedUrl(path, 3600)

    return signErr
      ? { path: null, url: null, error: signErr.message }
      : { path, url: signed.signedUrl, error: null }
  },

  // Phase 5: download + decrypt an encrypted attachment (conv key used).
  async downloadAndDecrypt(
    storagePath: string,
    conversationId: string,
    orgId: string,
    fileName: string,
  ): Promise<{ error: string | null }> {
    try {
      const { data: signed, error: signErr } = await supabase.storage
        .from('attachments')
        .createSignedUrl(storagePath, 300)
      if (signErr || !signed) return { error: signErr?.message ?? 'URL introuvable.' }

      const response = await fetch(signed.signedUrl)
      if (!response.ok) return { error: 'Téléchargement échoué.' }
      const encBuf = await response.arrayBuffer()

      let plainBuf: ArrayBuffer = encBuf

      if (cryptoSession.isLoaded) {
        const convKey = await KeyService.getOrLoadConversationKey(conversationId, orgId)
        if (convKey && encBuf.byteLength > 12) {
          try {
            const iv = new Uint8Array(encBuf, 0, 12) as Uint8Array<ArrayBuffer>
            const cipher = new Uint8Array(encBuf, 12) as Uint8Array<ArrayBuffer>
            plainBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv, tagLength: 128 }, convKey, cipher)
          } catch { /* not encrypted or wrong key — serve raw */ }
        }
      }

      const blob = new Blob([plainBuf])
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = fileName
      a.click()
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000)
      return { error: null }
    } catch (e) {
      return { error: (e as Error).message }
    }
  },

  async getSignedUrl(path: string): Promise<string | null> {
    const { data, error } = await supabase.storage
      .from('attachments')
      .createSignedUrl(path, 60 * 60 * 24 * 7)
    return error ? null : data.signedUrl
  },

  // Download, decrypt, return raw Blob — used for forwarding files to another conversation.
  async getDecryptedBlob(
    storagePath: string,
    conversationId: string,
    orgId: string,
  ): Promise<Blob | null> {
    try {
      const { data: signed, error: signErr } = await supabase.storage
        .from('attachments')
        .createSignedUrl(storagePath, 300)
      if (signErr || !signed) return null

      const response = await fetch(signed.signedUrl)
      if (!response.ok) return null
      const encBuf = await response.arrayBuffer()

      let plainBuf: ArrayBuffer = encBuf

      if (cryptoSession.isLoaded && encBuf.byteLength > 12) {
        const convKey = await KeyService.getOrLoadConversationKey(conversationId, orgId)
        if (convKey) {
          try {
            const iv = new Uint8Array(encBuf, 0, 12) as Uint8Array<ArrayBuffer>
            const cipher = new Uint8Array(encBuf, 12) as Uint8Array<ArrayBuffer>
            plainBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv, tagLength: 128 }, convKey, cipher)
          } catch { /* serve raw if decryption fails */ }
        }
      }

      return new Blob([plainBuf])
    } catch {
      return null
    }
  },

  // Download, decrypt, and return a blob URL ready for <img src>. Caller must revoke when done.
  async getDecryptedImageUrl(
    storagePath: string,
    conversationId: string,
    orgId: string,
  ): Promise<string | null> {
    try {
      const { data: signed, error: signErr } = await supabase.storage
        .from('attachments')
        .createSignedUrl(storagePath, 3600)
      if (signErr || !signed) return null

      const response = await fetch(signed.signedUrl)
      if (!response.ok) return null
      const encBuf = await response.arrayBuffer()

      let plainBuf: ArrayBuffer = encBuf

      if (cryptoSession.isLoaded && encBuf.byteLength > 12) {
        const convKey = await KeyService.getOrLoadConversationKey(conversationId, orgId)
        if (convKey) {
          try {
            const iv = new Uint8Array(encBuf, 0, 12) as Uint8Array<ArrayBuffer>
            const cipher = new Uint8Array(encBuf, 12) as Uint8Array<ArrayBuffer>
            plainBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv, tagLength: 128 }, convKey, cipher)
          } catch { /* not encrypted or wrong key — serve raw */ }
        }
      }

      return URL.createObjectURL(new Blob([plainBuf]))
    } catch {
      return null
    }
  },

  async leaveConversation(conversationId: string, userId: string): Promise<{ error: string | null }> {
    const { error } = await supabase
      .from('conversation_members')
      .delete()
      .eq('conversation_id', conversationId)
      .eq('user_id', userId)
    return { error: serviceError(error) }
  },

  // Returns last_read_at per user_id for all members of the conversation
  async getReadStatus(conversationId: string): Promise<Record<string, string>> {
    const { data } = await supabase
      .from('conversation_members')
      .select('user_id, last_read_at')
      .eq('conversation_id', conversationId)
    if (!data) return {}
    return Object.fromEntries(data.filter(r => r.last_read_at).map(r => [r.user_id, r.last_read_at as string]))
  },

  async getReactions(conversationId: string): Promise<Record<string, { emoji: string; userId: string }[]>> {
    const { data: msgs } = await supabase
      .from('messages')
      .select('id')
      .eq('conversation_id', conversationId)
    if (!msgs?.length) return {}
    const msgIds = msgs.map(m => m.id)
    const { data } = await supabase
      .from('message_reactions')
      .select('message_id, emoji, user_id')
      .in('message_id', msgIds)
    if (!data) return {}
    const map: Record<string, { emoji: string; userId: string }[]> = {}
    for (const r of data) {
      if (!map[r.message_id]) map[r.message_id] = []
      map[r.message_id].push({ emoji: r.emoji, userId: r.user_id })
    }
    return map
  },

  async addReaction(messageId: string, userId: string, emoji: string): Promise<void> {
    await supabase.from('message_reactions').upsert(
      { message_id: messageId, user_id: userId, emoji },
      { onConflict: 'message_id,user_id,emoji' }
    )
  },

  async removeReaction(messageId: string, userId: string, emoji: string): Promise<void> {
    await supabase.from('message_reactions')
      .delete()
      .eq('message_id', messageId)
      .eq('user_id', userId)
      .eq('emoji', emoji)
  },

  async deleteMessage(messageId: string, senderId: string): Promise<{ error: string | null }> {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId)
      .eq('sender_id', senderId)
    return { error: serviceError(error) }
  },
}
