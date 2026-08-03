import { supabase } from '../lib/supabase'
import { serviceError, friendlyError } from '../lib/errors'
import i18n from '../i18n'
import type { OrganizationRow, OrganizationMemberRow } from '../lib/database.types'
import { TRIAL_DAYS, PRICING } from '../config/pricing'
import type { SupportedCurrency } from '../config/pricing'

export interface CreateOrganizationParams {
  name: string
  email: string
  phone?: string
  website?: string
  country: string
  city?: string
  currency: SupportedCurrency
  language: string
  sector?: string
  size?: string
  adminUserId: string
}

export interface OrganizationResult {
  organizationId: string | null
  error: string | null
}

export const OrganizationService = {
  // Atomic creation via SECURITY DEFINER RPC — org + admin member + trial subscription
  // in a single transaction. No RLS dependency between steps.
  async create(params: CreateOrganizationParams): Promise<OrganizationResult> {
    type RpcFn = (fn: string, args: object) => Promise<{ data: unknown; error: { message: string } | null }>
    const { data, error } = await (supabase.rpc as unknown as RpcFn)('create_organization_with_admin', {
      p_name:     params.name,
      p_email:    params.email,
      p_phone:    params.phone    ?? null,
      p_website:  params.website  ?? null,
      p_country:  params.country,
      p_city:     params.city ?? null,
      p_currency: params.currency,
      p_language: params.language,
      p_sector:   params.sector   ?? null,
      p_admin_id: params.adminUserId,
      p_plan:     'free',
    })

    if (error) return { organizationId: null, error: friendlyError(error.message) }
    return { organizationId: data as string, error: null }
  },

  async startTrial(organizationId: string, currency: SupportedCurrency): Promise<void> {
    const trialEndsAt = new Date()
    trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_DAYS)

    const prices = PRICING[currency]

    await supabase.from('subscriptions').insert({
      organization_id: organizationId,
      plan: 'free',
      status: 'trial',
      currency,
      amount: prices.free.monthly,
      trial_ends_at: trialEndsAt.toISOString(),
      discount_percent: prices.free.discountPercent,
    })
  },

  async getById(id: string): Promise<OrganizationRow | null> {
    const { data } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', id)
      .single()
    return data ?? null
  },

  async getForUser(userId: string): Promise<OrganizationRow | null> {
    const { data } = await supabase
      .from('organization_members')
      .select('organization_id, organizations(*)')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle()

    if (!data) return null
    const org = (data as unknown as { organizations: OrganizationRow }).organizations
    return org ?? null
  },

  async update(id: string, updates: Partial<Pick<OrganizationRow, 'name' | 'email' | 'phone' | 'website' | 'logo_url' | 'country' | 'currency' | 'language' | 'sector' | 'size' | 'city' | 'primary_color'>>): Promise<{ error: string | null }> {
    const { error } = await supabase
      .from('organizations')
      .update(updates)
      .eq('id', id)
    return { error: serviceError(error) }
  },

  async getMembers(organizationId: string): Promise<OrganizationMemberRow[]> {
    const { data } = await supabase
      .from('organization_members')
      .select('*')
      .eq('organization_id', organizationId)
    return data ?? []
  },

  async getSubscription(organizationId: string) {
    const { data } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('organization_id', organizationId)
      .maybeSingle()
    return data ?? null
  },

  async uploadLogo(orgId: string, file: File): Promise<{ logoUrl: string | null; error: string | null }> {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'png'
    const path = `${orgId}/${orgId}.${ext}`
    const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml']
    if (!ALLOWED_TYPES.includes(file.type)) {
      return { logoUrl: null, error: i18n.t('errors.logoFormatNotAllowed') }
    }
    if (file.size > 5 * 1024 * 1024) {
      return { logoUrl: null, error: i18n.t('errors.logoTooLarge') }
    }
    const { error: uploadErr } = await supabase.storage
      .from('logos')
      .upload(path, file, { upsert: true, contentType: file.type })
    if (uploadErr) return { logoUrl: null, error: uploadErr.message }
    // Public bucket — permanent URL, no expiry
    const { data: pub } = supabase.storage.from('logos').getPublicUrl(path)
    const logoUrl = `${pub.publicUrl}?v=${Date.now()}`
    const { error: dbErr } = await supabase.from('organizations').update({ logo_url: logoUrl }).eq('id', orgId)
    if (dbErr) return { logoUrl: null, error: dbErr.message }
    return { logoUrl, error: null }
  },

  async getStorageUsed(organizationId: string): Promise<number> {
    const { data } = await supabase
      .from('files')
      .select('size')
      .eq('organization_id', organizationId)
    return (data ?? []).reduce((sum, f) => sum + f.size, 0)
  },

  async getSecuritySettings(organizationId: string): Promise<{ inviteExpiryDays: number | null; sessionDurationDays: number }> {
    const { data } = await supabase
      .from('org_security_settings')
      .select('invite_expiry_days, session_duration_days')
      .eq('organization_id', organizationId)
      .maybeSingle()
    return {
      inviteExpiryDays: data?.invite_expiry_days ?? 7,
      sessionDurationDays: data?.session_duration_days ?? 30,
    }
  },

  async saveSecuritySettings(organizationId: string, settings: { inviteExpiryDays: number | null; sessionDurationDays: number }): Promise<{ error: string | null }> {
    const { error } = await supabase
      .from('org_security_settings')
      .upsert({
        organization_id: organizationId,
        invite_expiry_days: settings.inviteExpiryDays,
        session_duration_days: settings.sessionDurationDays,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'organization_id' })
    return { error: serviceError(error) }
  },
}
