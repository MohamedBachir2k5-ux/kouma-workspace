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
  isCurrent?: boolean
}

const FINGERPRINT_KEY = 'kouma_device_fp'

function getOrCreateFingerprint(): string {
  let fp = localStorage.getItem(FINGERPRINT_KEY)
  if (!fp) {
    fp = crypto.randomUUID()
    localStorage.setItem(FINGERPRINT_KEY, fp)
  }
  return fp
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
    const fingerprint = getOrCreateFingerprint()

    // UPSERT: same device always maps to the same row — prevents duplicate sessions on every page reload
    const { data } = await supabase
      .from('user_sessions')
      .upsert(
        { user_id: userId, device_fingerprint: fingerprint, device_name: deviceName, browser, platform, last_seen_at: new Date().toISOString() },
        { onConflict: 'user_id,device_fingerprint', ignoreDuplicates: false }
      )
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
    const currentFp = localStorage.getItem(FINGERPRINT_KEY)
    return data.map(r => ({
      id: r.id,
      userId: r.user_id,
      deviceName: r.device_name,
      browser: r.browser,
      platform: r.platform,
      createdAt: r.created_at,
      lastSeenAt: r.last_seen_at,
      revoked: r.revoked,
      isCurrent: r.device_fingerprint === currentFp,
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

  async listByOrg(orgId: string): Promise<(SessionRecord & { userEmail?: string; userName?: string })[]> {
    const { data: members } = await supabase
      .from('organization_members')
      .select('user_id, profiles!organization_members_user_id_fkey(email, firstname, lastname)')
      .eq('organization_id', orgId)
      .neq('status', 'deleted')
    if (!members) return []

    const userIds = members.map(m => m.user_id)
    const { data } = await supabase
      .from('user_sessions')
      .select('*')
      .in('user_id', userIds)
      .eq('revoked', false)
      .order('last_seen_at', { ascending: false })
    if (!data) return []

    const currentFp = localStorage.getItem(FINGERPRINT_KEY)
    return data.map(r => {
      const member = members.find(m => m.user_id === r.user_id)
      const profile = member?.profiles as { email?: string; firstname?: string; lastname?: string } | null
      return {
        id: r.id,
        userId: r.user_id,
        deviceName: r.device_name,
        browser: r.browser,
        platform: r.platform,
        createdAt: r.created_at,
        lastSeenAt: r.last_seen_at,
        revoked: r.revoked,
        isCurrent: r.device_fingerprint === currentFp,
        userEmail: profile?.email,
        userName: profile ? `${profile.firstname ?? ''} ${profile.lastname ?? ''}`.trim() : undefined,
      }
    })
  },
}
