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
  async create(params: CreateOrganizationParams): Promise<OrganizationResult> {
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: params.name,
        email: params.email,
        phone: params.phone ?? null,
        website: params.website ?? null,
        country: params.country,
        currency: params.currency,
        language: params.language,
        sector: params.sector ?? null,
        size: params.size ?? null,
        plan: 'starter',
        logo_url: null,
      })
      .select()
      .single()

    if (orgError) return { organizationId: null, error: orgError.message }

    // Add admin as organization owner
    const { error: memberError } = await supabase.from('organization_members').insert({
      organization_id: org.id,
      user_id: params.adminUserId,
      role: 'admin',
      status: 'active',
    })

    if (memberError) return { organizationId: null, error: memberError.message }

    // Activate 15-day trial subscription
    await this.startTrial(org.id, params.currency)

    // Create audit log entry
    await supabase.from('audit_logs').insert({
      organization_id: org.id,
      user_id: params.adminUserId,
      action: 'organization_created',
      target_name: params.name,
    })

    return { organizationId: org.id, error: null }
  },

  async startTrial(organizationId: string, currency: SupportedCurrency): Promise<void> {
    const trialEndsAt = new Date()
    trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_DAYS)

    const prices = PRICING[currency]

    await supabase.from('subscriptions').insert({
      organization_id: organizationId,
      plan: 'starter',
      status: 'trial',
      currency,
      amount: prices.starter.monthly,
      trial_ends_at: trialEndsAt.toISOString(),
      discount_percent: prices.starter.discountPercent,
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
      .single()

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
      .single()
    return data ?? null
  },

  async uploadLogo(orgId: string, file: File): Promise<{ logoUrl: string | null; error: string | null }> {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'png'
    // Path must be org-scoped so storage RLS policy allows it
    const path = `${orgId}/logos/${orgId}.${ext}`
    const { error: uploadErr } = await supabase.storage
      .from('attachments')
      .upload(path, file, { upsert: true, contentType: file.type })
    if (uploadErr) return { logoUrl: null, error: uploadErr.message }
    const { data } = supabase.storage.from('attachments').getPublicUrl(path)
    const logoUrl = data.publicUrl
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
