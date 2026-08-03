// Key lifecycle management: generate, store, load, distribute.
// All crypto operations delegate to CryptoService.
// All Supabase I/O is contained here — components never touch key tables directly.

import { supabase } from '../lib/supabase'
import { serviceError, friendlyError } from '../lib/errors'
import { CryptoService } from './crypto.service'
import { cryptoSession } from '../lib/crypto-session'
import i18n from '../i18n'

export interface OrgRecoverySetup {
  breakglassPhrase: string  // 4 groups of 8 hex chars — admin must write this down
}

export const KeyService = {

  // ── User key pair ─────────────────────────────────────────────────────────

  // Called immediately after signUp with the plaintext secret (PIN or password).
  // Generates an ECDH P-256 key pair, wraps the private key with KWK derived
  // from secret, stores in user_key_pairs.
  async generateAndStoreUserKeys(userId: string, secret: string): Promise<{ error: string | null }> {
    if (!crypto?.subtle) {
      return { error: i18n.t('errors.cryptoApiUnavailable') }
    }
    try {
      const pair = await CryptoService.generateUserKeyPair()
      const salt = CryptoService.generateSalt()
      const kwk = await CryptoService.deriveKWK(secret, salt)
      const { iv, ciphertext } = await CryptoService.wrapPrivateKey(pair.privateKey, kwk)
      const publicKeyB64 = await CryptoService.exportPublicKey(pair.publicKey)

      const { error } = await supabase.from('user_key_pairs').upsert({
        user_id: userId,
        public_key: publicKeyB64,
        encrypted_private_key: ciphertext,
        kdf_salt: salt,
        kdf_iv: iv,
        kdf_iterations: 600000,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })

      if (error) return { error: friendlyError(error.message) }

      // Cache in session immediately
      cryptoSession.load(pair.privateKey, pair.publicKey, '')
      return { error: null }
    } catch (e) {
      return { error: (e as Error).message }
    }
  },

  // Called after signIn. Loads the encrypted private key, derives KWK from
  // secret (PIN or password), unwraps private key, caches in CryptoSession.
  // Returns false if the secret is wrong (decryption fails).
  async loadUserKeys(userId: string, secret: string, orgId: string): Promise<{ ok: boolean; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('user_key_pairs')
        .select('public_key, encrypted_private_key, kdf_salt, kdf_iv')
        .eq('user_id', userId)
        .single()

      if (error || !data) return { ok: false, error: i18n.t('errors.keysNotFound') }

      const kwk = await CryptoService.deriveKWK(secret, data.kdf_salt)
      const priv = await CryptoService.unwrapPrivateKey(data.encrypted_private_key, data.kdf_iv, kwk)
      const pub = await CryptoService.importPublicKey(data.public_key)

      cryptoSession.load(priv, pub, orgId)
      return { ok: true, error: null }
    } catch {
      // Decryption failure = wrong PIN/password
      return { ok: false, error: i18n.t('errors.wrongPinOrPassword') }
    }
  },

  // Re-wrap the private key after a PIN/password change.
  // Does NOT change the key pair — only re-encrypts with the new KWK.
  async rewrapPrivateKey(userId: string, newSecret: string): Promise<{ error: string | null }> {
    const priv = cryptoSession.userPriv
    if (!priv) return { error: i18n.t('errors.sessionNotLoaded') }
    try {
      const salt = CryptoService.generateSalt()
      const kwk = await CryptoService.deriveKWK(newSecret, salt)
      const { iv, ciphertext } = await CryptoService.wrapPrivateKey(priv, kwk)

      const { error } = await supabase
        .from('user_key_pairs')
        .update({ encrypted_private_key: ciphertext, kdf_salt: salt, kdf_iv: iv, updated_at: new Date().toISOString() })
        .eq('user_id', userId)

      return { error: serviceError(error) }
    } catch (e) {
      return { error: (e as Error).message }
    }
  },

  // Load a peer's public key from Supabase.
  async getUserPublicKey(userId: string): Promise<CryptoKey | null> {
    const { data } = await supabase
      .from('user_key_pairs')
      .select('public_key')
      .eq('user_id', userId)
      .maybeSingle()
    if (!data) return null
    try { return CryptoService.importPublicKey(data.public_key) } catch { return null }
  },

  // ── Org recovery key pair ─────────────────────────────────────────────────

  // Called once at org creation (founding admin flow).
  // Generates the org recovery key pair, encrypts it:
  //   1. For the admin (ECIES using admin's public key)
  //   2. For breakglass (PBKDF2 of a generated phrase + AES-GCM)
  // Returns the breakglass phrase — shown once, never stored in plaintext.
  async generateOrgRecoveryKeys(
    orgId: string,
    adminUserId: string,
  ): Promise<{ breakglassPhrase: string; error: string | null }> {
    const priv = cryptoSession.userPriv
    const pub = cryptoSession.userPub
    if (!priv || !pub) return { breakglassPhrase: '', error: i18n.t('errors.sessionNotLoaded') }

    try {
      // 1. Generate org recovery key pair
      const recoveryPair = await CryptoService.generateUserKeyPair()
      const recoveryPubB64 = await CryptoService.exportPublicKey(recoveryPair.publicKey)

      // 2. ECIES-wrap recovery private key for the admin
      const adminWrap = await CryptoService.eciesWrapKey(recoveryPair.privateKey, pub, orgId, 'pkcs8')

      // 3. Breakglass: generate phrase, derive KWK, wrap recovery private key
      const { phrase } = CryptoService.generateBreakglassPhrase()
      const bgWrap = await CryptoService.wrapKeyWithPassphrase(recoveryPair.privateKey, phrase, 'pkcs8')

      // 4. Store in Supabase
      const { error } = await supabase.from('org_recovery_keys').insert({
        organization_id: orgId,
        admin_user_id: adminUserId,
        recovery_public_key: recoveryPubB64,
        encrypted_recovery_private_key: adminWrap.ciphertext,
        eph_public_key: adminWrap.ephPub,
        ecies_iv: adminWrap.iv,
        bg_encrypted_key: bgWrap.ciphertext,
        bg_kdf_salt: bgWrap.salt,
        bg_iv: bgWrap.iv,
      })

      if (error) return { breakglassPhrase: '', error: friendlyError(error.message) }
      return { breakglassPhrase: phrase, error: null }
    } catch (e) {
      return { breakglassPhrase: '', error: (e as Error).message }
    }
  },

  // Called when promoting a user to admin.
  // Existing admin A decrypts org_recovery_priv, re-encrypts it for the new admin U.
  async distributeRecoveryKeyToAdmin(
    orgId: string,
    newAdminUserId: string,
  ): Promise<{ error: string | null }> {
    const actorPriv = cryptoSession.userPriv
    if (!actorPriv) return { error: i18n.t('errors.sessionNotLoaded') }

    try {
      const actorId = (await supabase.auth.getUser()).data.user?.id
      if (!actorId) return { error: i18n.t('errors.userNotAuthenticated') }

      // Load actor's encrypted recovery key
      const { data: row, error: fetchError } = await supabase
        .from('org_recovery_keys')
        .select('recovery_public_key, encrypted_recovery_private_key, eph_public_key, ecies_iv')
        .eq('organization_id', orgId)
        .eq('admin_user_id', actorId)
        .single()

      if (fetchError || !row) return { error: i18n.t('errors.recoveryKeysNotFound') }

      // Decrypt org_recovery_priv
      const recoveryPriv = await CryptoService.eciesUnwrapPrivateKey(
        row.eph_public_key, row.ecies_iv, row.encrypted_recovery_private_key, actorPriv, orgId,
      )

      // Load new admin's public key
      const newAdminPub = await this.getUserPublicKey(newAdminUserId)
      if (!newAdminPub) return { error: i18n.t('errors.newAdminPublicKeyNotFound') }

      // ECIES-wrap for new admin
      const newWrap = await CryptoService.eciesWrapKey(recoveryPriv, newAdminPub, orgId, 'pkcs8')

      // Also fetch the breakglass fields (from any row that has them) to copy to new admin row
      const { data: bgRow } = await supabase
        .from('org_recovery_keys')
        .select('bg_encrypted_key, bg_kdf_salt, bg_iv')
        .eq('organization_id', orgId)
        .not('bg_encrypted_key', 'is', null)
        .limit(1)
        .single()

      const { error } = await supabase.from('org_recovery_keys').upsert({
        organization_id: orgId,
        admin_user_id: newAdminUserId,
        recovery_public_key: row.recovery_public_key,
        encrypted_recovery_private_key: newWrap.ciphertext,
        eph_public_key: newWrap.ephPub,
        ecies_iv: newWrap.iv,
        ...(bgRow ? { bg_encrypted_key: bgRow.bg_encrypted_key, bg_kdf_salt: bgRow.bg_kdf_salt, bg_iv: bgRow.bg_iv } : {}),
      }, { onConflict: 'organization_id,admin_user_id' })

      return { error: serviceError(error) }
    } catch (e) {
      return { error: (e as Error).message }
    }
  },

  // ── Conversation key distribution ─────────────────────────────────────────

  // Generate a new conversation symmetric key and distribute it to all
  // participants + the org recovery key.
  async initConversationKeys(
    conversationId: string,
    orgId: string,
    participantIds: string[],
  ): Promise<{ error: string | null }> {
    try {
      const convKey = await CryptoService.generateSymmetricKey()

      // Load org recovery public key
      const { data: recoveryRow } = await supabase
        .from('org_recovery_keys')
        .select('recovery_public_key')
        .eq('organization_id', orgId)
        .limit(1)
        .maybeSingle()

      // Encrypt for each participant
      const keyRows: Array<{ conversation_id: string; user_id: string; encrypted_key: string; eph_public_key: string; ecies_iv: string }> = []

      for (const uid of participantIds) {
        const pub = uid === (await supabase.auth.getUser()).data.user?.id
          ? cryptoSession.userPub
          : await this.getUserPublicKey(uid)
        if (!pub) continue
        const wrap = await CryptoService.eciesWrapKey(convKey, pub, orgId)
        keyRows.push({ conversation_id: conversationId, user_id: uid, encrypted_key: wrap.ciphertext, eph_public_key: wrap.ephPub, ecies_iv: wrap.iv })
      }

      if (keyRows.length > 0) {
        const { error: rpcErr } = await supabase.rpc('init_conversation_keys', {
          p_conversation_id: conversationId,
          p_key_rows: keyRows,
        })
        if (rpcErr) return { error: rpcErr.message }
      }

      // Encrypt for org recovery only for team (organizational) conversations.
      // Direct and group conversations are private — excluded from org recovery by design.
      const { data: convRow } = await supabase
        .from('conversations')
        .select('type')
        .eq('id', conversationId)
        .maybeSingle()

      if (convRow?.type === 'team' && recoveryRow?.recovery_public_key) {
        const recoveryPub = await CryptoService.importPublicKey(recoveryRow.recovery_public_key)
        const recoveryWrap = await CryptoService.eciesWrapKey(convKey, recoveryPub, orgId)
        await supabase.from('conversation_recovery_keys').upsert({
          conversation_id: conversationId,
          organization_id: orgId,
          encrypted_key: recoveryWrap.ciphertext,
          eph_public_key: recoveryWrap.ephPub,
          ecies_iv: recoveryWrap.iv,
        }, { onConflict: 'conversation_id,organization_id' })
      }

      // Only cache locally after successful DB persist
      cryptoSession.setConvKey(conversationId, convKey)
      return { error: null }
    } catch (e) {
      return { error: (e as Error).message }
    }
  },

  // Re-wrap our existing conversation key for members who are missing theirs.
  // Called after every message send to catch late-joiners.
  async distributeKeyToMissingMembers(
    conversationId: string,
    orgId: string,
    ownKey: CryptoKey,
  ): Promise<void> {
    try {
      // Find members who have no conversation_keys row
      const { data: allMembers } = await supabase
        .from('conversation_members')
        .select('user_id')
        .eq('conversation_id', conversationId)
      if (!allMembers?.length) return

      const { data: existingKeys } = await supabase
        .from('conversation_keys')
        .select('user_id')
        .eq('conversation_id', conversationId)
      const haveKey = new Set((existingKeys ?? []).map(k => k.user_id))

      const missing = allMembers.filter(m => !haveKey.has(m.user_id))
      if (!missing.length) return

      for (const { user_id } of missing) {
        const pub = await this.getUserPublicKey(user_id)
        if (!pub) continue
        const wrap = await CryptoService.eciesWrapKey(ownKey, pub, orgId)
        await supabase.rpc('add_user_conversation_key', {
          p_conversation_id: conversationId,
          p_user_id: user_id,
          p_encrypted_key: wrap.ciphertext,
          p_eph_public_key: wrap.ephPub,
          p_ecies_iv: wrap.iv,
        })
      }
    } catch {
      // Non-fatal: next message send will retry
    }
  },

  // Load (and cache) the symmetric key for a conversation.
  async getOrLoadConversationKey(conversationId: string, orgId: string): Promise<CryptoKey | null> {
    const cached = cryptoSession.getConvKey(conversationId)
    if (cached) return cached

    const priv = cryptoSession.userPriv
    if (!priv) return null

    const userId = (await supabase.auth.getUser()).data.user?.id
    if (!userId) return null

    const { data } = await supabase
      .from('conversation_keys')
      .select('encrypted_key, eph_public_key, ecies_iv')
      .eq('conversation_id', conversationId)
      .eq('user_id', userId)
      .maybeSingle()

    if (!data) return null

    try {
      const key = await CryptoService.eciesUnwrapSymmetricKey(
        data.eph_public_key, data.ecies_iv, data.encrypted_key, priv, orgId,
      )
      cryptoSession.setConvKey(conversationId, key)
      return key
    } catch {
      return null
    }
  },

  // ── Per-file symmetric key (Documents E2E) ────────────────────────────────

  // Generate an AES-256-GCM key for a file, ECIES-wrap it for the uploading
  // user and for the org recovery key, then store both in Supabase.
  async initFileKey(
    storagePath: string,
    orgId: string,
  ): Promise<{ key: CryptoKey | null; error: string | null }> {
    const pub = cryptoSession.userPub
    if (!pub) return { key: null, error: i18n.t('errors.sessionNotLoaded') }

    try {
      const userId = (await supabase.auth.getUser()).data.user?.id
      if (!userId) return { key: null, error: i18n.t('errors.notAuthenticated') }

      const fileKey = await CryptoService.generateSymmetricKey()

      // Wrap for the uploading user
      const userWrap = await CryptoService.eciesWrapKey(fileKey, pub, orgId)
      const { error: keyStoreErr } = await supabase.from('file_keys').upsert({
        storage_path: storagePath,
        user_id: userId,
        encrypted_key: userWrap.ciphertext,
        eph_public_key: userWrap.ephPub,
        ecies_iv: userWrap.iv,
      }, { onConflict: 'storage_path,user_id' })
      if (keyStoreErr) return { key: null, error: i18n.t('errors.fileKeyStoreFailed') }

      // Wrap for org recovery (best-effort — no recovery key = still ok)
      const { data: recoveryRow } = await supabase
        .from('org_recovery_keys')
        .select('recovery_public_key')
        .eq('organization_id', orgId)
        .limit(1)
        .maybeSingle()

      if (recoveryRow?.recovery_public_key) {
        const recoveryPub = await CryptoService.importPublicKey(recoveryRow.recovery_public_key)
        const recoveryWrap = await CryptoService.eciesWrapKey(fileKey, recoveryPub, orgId)
        await supabase.from('file_recovery_keys').upsert({
          storage_path: storagePath,
          organization_id: orgId,
          encrypted_key: recoveryWrap.ciphertext,
          eph_public_key: recoveryWrap.ephPub,
          ecies_iv: recoveryWrap.iv,
        }, { onConflict: 'storage_path,organization_id' })
      }

      return { key: fileKey, error: null }
    } catch (e) {
      return { key: null, error: (e as Error).message }
    }
  },

  // Load and ECIES-unwrap the symmetric key for a file from Supabase.
  async getOrLoadFileKey(storagePath: string, orgId: string): Promise<CryptoKey | null> {
    const priv = cryptoSession.userPriv
    if (!priv) return null

    const userId = (await supabase.auth.getUser()).data.user?.id
    if (!userId) return null

    const { data } = await supabase
      .from('file_keys')
      .select('encrypted_key, eph_public_key, ecies_iv')
      .eq('storage_path', storagePath)
      .eq('user_id', userId)
      .maybeSingle()

    if (!data) return null

    try {
      return await CryptoService.eciesUnwrapSymmetricKey(
        data.eph_public_key, data.ecies_iv, data.encrypted_key, priv, orgId,
      )
    } catch {
      return null
    }
  },
}
