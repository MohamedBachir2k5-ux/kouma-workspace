import { supabase } from '../lib/supabase'
import type { OrganizationRow, OrganizationMemberRow } from '../lib/database.types'
import { TRIAL_DAYS, PRICING } from '../config/pricing'
import type { SupportedCurrency } from '../config/pricing'

export interface CreateOrganizationParams {
  name: string
  email: string
  phone?: string
  website?: string
  country: string
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
      p_city:     null,
      p_currency: params.currency,
      p_language: params.language,
      p_sector:   params.sector   ?? null,
      p_admin_id: params.adminUserId,
      p_plan:     'free',
    })

    if (error) return { organizationId: null, error: error.message }
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

  async update(id: string, updates: Partial<Pick<OrganizationRow, 'name' | 'email' | 'phone' | 'website' | 'logo_url' | 'country' | 'currency' | 'language' | 'sector' | 'size' | 'city'>>): Promise<{ error: string | null }> {
    const { error } = await supabase
      .from('organizations')
      .update(updates)
      .eq('id', id)
    return { error: error?.message ?? null }
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
    // Path must be org-scoped so storage RLS policy allows it
    const path = `${orgId}/logos/${orgId}.${ext}`
    const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml']
    if (!ALLOWED_TYPES.includes(file.type)) {
      return { logoUrl: null, error: 'Format d\'image non autorisé (PNG, JPG, GIF, WebP, SVG).' }
    }
    if (file.size > 5 * 1024 * 1024) {
      return { logoUrl: null, error: 'Image trop volumineuse (max 5 Mo).' }
    }
    const { error: uploadErr } = await supabase.storage
      .from('attachments')
      .upload(path, file, { upsert: true, contentType: file.type })
    if (uploadErr) return { logoUrl: null, error: uploadErr.message }
    // Bucket is private — signed URL with long expiry stored as logo_url
    const { data: signed, error: signErr } = await supabase.storage
      .from('attachments')
      .createSignedUrl(path, 60 * 60 * 24 * 365)
    if (signErr || !signed) return { logoUrl: null, error: signErr?.message ?? 'URL logo introuvable.' }
    const logoUrl = signed.signedUrl
    await supabase.from('organizations').update({ logo_url: logoUrl }).eq('id', orgId)
    return { logoUrl, error: null }
  },

  async getStorageUsed(organizationId: string): Promise<number> {
    const { data } = await supabase
      .from('files')
      .select('size')
      .eq('organization_id', organizationId)
    return (data ?? []).reduce((sum, f) => sum + f.size, 0)
  },
}
