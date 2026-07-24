import { supabase } from '../lib/supabase'

export interface SessionRecord {
  id: string
  userId: string
  deviceName: string | null
  browser: string | null
  platform: string | null
  createdAt: string
  lastSeenAt: string
  revoked: boolean
}

function parseUserAgent(): { deviceName: string; browser: string; platform: string } {
  const ua = navigator.userAgent
  let browser = 'Navigateur inconnu'
  let platform = 'Inconnu'
  let deviceName = 'Appareil inconnu'

  if (/Edg\//i.test(ua)) browser = 'Microsoft Edge'
  else if (/Firefox/i.test(ua)) browser = 'Firefox'
  else if (/Chrome/i.test(ua)) browser = 'Chrome'
  else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = 'Safari'
  else if (/OPR|Opera/i.test(ua)) browser = 'Opera'

  if (/iPhone/i.test(ua)) { platform = 'iOS'; deviceName = 'iPhone' }
  else if (/iPad/i.test(ua)) { platform = 'iPadOS'; deviceName = 'iPad' }
  else if (/Android/i.test(ua)) { platform = 'Android'; deviceName = 'Appareil Android' }
  else if (/Mac/i.test(ua)) { platform = 'macOS'; deviceName = 'Mac' }
  else if (/Win/i.test(ua)) { platform = 'Windows'; deviceName = 'PC Windows' }
  else if (/Linux/i.test(ua)) { platform = 'Linux'; deviceName = 'PC Linux' }

  return { deviceName, browser, platform }
}

export const SessionService = {
  async register(userId: string): Promise<string | null> {
    const { deviceName, browser, platform } = parseUserAgent()
    const { data } = await supabase
      .from('user_sessions')
      .insert({ user_id: userId, device_name: deviceName, browser, platform })
      .select('id')
      .single()
    return data?.id ?? null
  },

  async heartbeat(sessionId: string): Promise<void> {
    await supabase
      .from('user_sessions')
      .update({ last_seen_at: new Date().toISOString() })
      .eq('id', sessionId)
  },

  async list(userId: string): Promise<SessionRecord[]> {
    const { data } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('revoked', false)
      .order('last_seen_at', { ascending: false })
    if (!data) return []
    return data.map(r => ({
      id: r.id,
      userId: r.user_id,
      deviceName: r.device_name,
      browser: r.browser,
      platform: r.platform,
      createdAt: r.created_at,
      lastSeenAt: r.last_seen_at,
      revoked: r.revoked,
    }))
  },

  async revoke(sessionId: string): Promise<{ error: string | null }> {
    const { error } = await supabase
      .from('user_sessions')
      .update({ revoked: true })
      .eq('id', sessionId)
    return { error: error?.message ?? null }
  },

  async revokeAll(userId: string, exceptSessionId?: string): Promise<void> {
    let q = supabase.from('user_sessions').update({ revoked: true }).eq('user_id', userId)
    if (exceptSessionId) q = q.neq('id', exceptSessionId)
    await q
  },

  async deleteSession(sessionId: string): Promise<void> {
    await supabase.from('user_sessions').delete().eq('id', sessionId)
  },
}
