import { supabase } from '../lib/supabase'
import { serviceError, friendlyError } from '../lib/errors'
import i18n from '../i18n'
import { CryptoService } from './crypto.service'
import { KeyService } from './key.service'
import { cryptoSession } from '../lib/crypto-session'
import { OrganizationService } from './organization.service'

export const RecoveryService = {

  // ── OTP (used by both admin and collaborator recovery) ─────────────────────

  async sendRecoveryOtp(email: string): Promise<{ error: string | null }> {
    // Server-side rate limit: max 5 OTP requests per email per 2 minutes
    type RpcFn = (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>
    const { data: limitErr } = await (supabase.rpc as unknown as RpcFn)('check_otp_rate_limit', { p_email: email })
    if (limitErr) return { error: limitErr as string }

    const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } })
    return { error: serviceError(error) }
  },

  async verifyOtp(email: string, token: string): Promise<{ userId: string | null; error: string | null }> {
    const { data, error } = await supabase.auth.verifyOtp({ email, token, type: 'email' })
    if (error || !data.user) return { userId: null, error: friendlyError(error?.message) ?? i18n.t('errors.invalidOrExpiredCode') }
    return { userId: data.user.id, error: null }
  },

  // ── Admin breakglass recovery ──────────────────────────────────────────────
  //
  // Flow: OTP verified → admin authenticated → enter breakglass phrase + new password
  // 1. Fetch any org_recovery_keys row with bg_encrypted_key for this org
  // 2. Unwrap org_recovery_priv using the breakglass phrase (PBKDF2 → AES-GCM)
  // 3. Generate new user key pair for the admin (loads into CryptoSession)
  // 4. Re-encrypt all conversation keys (via conversation_recovery_keys) for new admin pub
  // 5. Upsert admin row in org_recovery_keys with new ECIES wrap
  // 6. Update Supabase auth password
  // 7. Audit log

  // Log recovery initiation after OTP verification (before breakglass phrase is entered).
  async logRecoveryInitiated(userId: string, orgId: string): Promise<void> {
    try {
      await supabase.from('audit_logs').insert({
        organization_id: orgId,
        user_id: userId,
        action: 'recovery_initiated',
        target_id: userId,
        target_type: 'user',
        detail: i18n.t('audit.recoveryInitiated'),
      })
    } catch { /* non-blocking */ }
  },

  async adminBreakglassRecovery(
    orgId: string,
    userId: string,
    breakglassPhrase: string,
    newPassword: string,
    deviceInfo?: string,
  ): Promise<{ error: string | null }> {
    // Log the breakglass attempt immediately — before phrase verification so that
    // failed attempts (wrong phrase) are also captured in the audit trail.
    supabase.from('audit_logs').insert({
      organization_id: orgId,
      user_id: userId,
      action: 'breakglass_used',
      target_id: userId,
      target_type: 'user',
      detail: deviceInfo ? i18n.t('audit.breakglassUsedWith', { device: deviceInfo }) : i18n.t('audit.breakglassUsed'),
    })

    try {
      // 1. Fetch breakglass-protected row (any row with bg_encrypted_key in this org)
      const { data: bgRow, error: bgErr } = await supabase
        .from('org_recovery_keys')
        .select('recovery_public_key, bg_encrypted_key, bg_kdf_salt, bg_iv')
        .eq('organization_id', orgId)
        .not('bg_encrypted_key', 'is', null)
        .limit(1)
        .single()

      if (bgErr || !bgRow?.bg_encrypted_key || !bgRow.bg_kdf_salt || !bgRow.bg_iv) {
        return { error: i18n.t('errors.breakglassKeyNotFound') }
      }

      // 2. Unwrap org_recovery_priv using breakglass phrase
      const orgRecoveryPriv = await CryptoService.unwrapPrivateKeyWithPassphrase(
        bgRow.bg_encrypted_key, bgRow.bg_iv, bgRow.bg_kdf_salt, breakglassPhrase,
      )

      // 3. Generate new user key pair (also loads into CryptoSession)
      const { error: keyErr } = await KeyService.generateAndStoreUserKeys(userId, newPassword)
      if (keyErr) return { error: keyErr }

      const newAdminPub = cryptoSession.userPub
      if (!newAdminPub) return { error: i18n.t('errors.cryptoSessionError') }

      // 4. Re-encrypt conversation keys for admin — team conversations only.
      // Direct messages and private group conversations are intentionally excluded:
      // the admin never participates in them and must not gain access through recovery.
      const { data: teamConvIds } = await supabase
        .from('conversations')
        .select('id')
        .eq('organization_id', orgId)
        .eq('type', 'team')

      const teamIds = (teamConvIds ?? []).map(c => c.id)

      const { data: recoveryKeys } = teamIds.length > 0
        ? await supabase
            .from('conversation_recovery_keys')
            .select('conversation_id, encrypted_key, eph_public_key, ecies_iv')
            .eq('organization_id', orgId)
            .in('conversation_id', teamIds)
        : { data: [] }

      if (recoveryKeys?.length) {
        const keyRows: Array<{ conversation_id: string; user_id: string; encrypted_key: string; eph_public_key: string; ecies_iv: string }> = []
        for (const rk of recoveryKeys) {
          try {
            const convKey = await CryptoService.eciesUnwrapSymmetricKey(
              rk.eph_public_key, rk.ecies_iv, rk.encrypted_key, orgRecoveryPriv, orgId,
            )
            const wrap = await CryptoService.eciesWrapKey(convKey, newAdminPub, orgId)
            keyRows.push({
              conversation_id: rk.conversation_id,
              user_id: userId,
              encrypted_key: wrap.ciphertext,
              eph_public_key: wrap.ephPub,
              ecies_iv: wrap.iv,
            })
          } catch {
            // Skip undecryptable conv keys — continue with others
          }
        }
        if (keyRows.length > 0) {
          await supabase.from('conversation_keys')
            .upsert(keyRows, { onConflict: 'conversation_id,user_id' })
        }
      }

      // 5. Upsert admin's org_recovery_keys row with new ECIES wrap
      const newWrap = await CryptoService.eciesWrapKey(orgRecoveryPriv, newAdminPub, orgId, 'pkcs8')
      await supabase.from('org_recovery_keys').upsert({
        organization_id: orgId,
        admin_user_id: userId,
        recovery_public_key: bgRow.recovery_public_key,
        encrypted_recovery_private_key: newWrap.ciphertext,
        eph_public_key: newWrap.ephPub,
        ecies_iv: newWrap.iv,
        bg_encrypted_key: bgRow.bg_encrypted_key,
        bg_kdf_salt: bgRow.bg_kdf_salt,
        bg_iv: bgRow.bg_iv,
      }, { onConflict: 'organization_id,admin_user_id' })

      // 6. Update Supabase auth password
      const { error: pwErr } = await supabase.auth.updateUser({ password: newPassword })
      if (pwErr) return { error: pwErr.message }

      // 7. Audit log
      await supabase.from('audit_logs').insert({
        organization_id: orgId,
        user_id: userId,
        action: 'recovery_completed',
        target_id: userId,
        target_type: 'user',
        detail: deviceInfo
          ? i18n.t('audit.adminRecoveryCompletedWith', { device: deviceInfo })
          : i18n.t('audit.adminRecoveryCompleted'),
      })

      return { error: null }
    } catch (e) {
      if ((e as Error).message?.includes('unwrap') || (e as Error).name === 'OperationError') {
        return { error: i18n.t('errors.wrongRecoveryPhrase') }
      }
      return { error: (e as Error).message }
    }
  },

  // ── Collaborator PIN reset ─────────────────────────────────────────────────
  //
  // Simplified v1: generates a new key pair with the new PIN.
  // Historical encrypted messages are no longer decryptable (acceptable trade-off).
  // For full recovery with history, an admin must manually re-encrypt conv keys.

  async collaboratorResetPin(
    userId: string,
    orgId: string,
    newPin: string,
  ): Promise<{ error: string | null }> {
    try {
      // Generate new key pair wrapped with new PIN
      const { error: keyErr } = await KeyService.generateAndStoreUserKeys(userId, newPin)
      if (keyErr) return { error: keyErr }

      // Update Supabase auth password (PIN = password for collaborators)
      const { error: pwErr } = await supabase.auth.updateUser({ password: newPin })
      if (pwErr) return { error: pwErr.message }

      // Audit log (best-effort)
      try {
        await supabase.from('audit_logs').insert({
          organization_id: orgId,
          user_id: userId,
          action: 'recovery_completed',
          target_id: userId,
          target_type: 'user',
          detail: i18n.t('audit.pinReset'),
        })
      } catch { /* non-blocking */ }

      return { error: null }
    } catch (e) {
      return { error: (e as Error).message }
    }
  },

  // Lookup org for a user (needed after OTP verification to find orgId)
  async getOrgIdForUser(userId: string): Promise<string | null> {
    const orgRow = await OrganizationService.getForUser(userId)
    return orgRow?.id ?? null
  },
}
