import type { Channel, Message } from '../lib/types'
import { mockChannels, mockMessages } from '../lib/mock'

export const MessageService = {
  /** Return all channels accessible to a user in an org. */
  getChannels(orgId: string, userId: string): Channel[] {
    // TODO Phase 3: supabase.from('channels').select('*, channel_members!inner()')
    //               .eq('organization_id', orgId).eq('channel_members.user_id', userId)
    return mockChannels.filter(c => c.organizationId === orgId && c.members.includes(userId))
  },

  /** Return all messages in a channel. */
  getMessages(channelId: string): Message[] {
    // TODO Phase 3: supabase.from('messages').select('*').eq('channel_id', channelId).order('created_at')
    return mockMessages.filter(m => m.channelId === channelId)
  },

  /** Send a new message. Returns the created message. */
  send(channelId: string, senderId: string, content: string): Message {
    // TODO Phase 3: supabase.from('messages').insert({ channel_id, sender_id, content })
    const msg: Message = {
      id: `m${Date.now()}`,
      channelId,
      senderId,
      content,
      status: 'sent',
      createdAt: new Date().toISOString(),
    }
    return msg
  },
}
