// Phase 7 — Security tests for E2E crypto primitives.
// Run: npm test

import { describe, it, expect } from 'vitest'
import { CryptoService, b64Encode, b64Decode } from '../crypto.service'

// ── Test 1: Base64url encode / decode round-trip ──────────────────────────────

describe('b64Encode / b64Decode', () => {
  it('round-trips random bytes', () => {
    const original = crypto.getRandomValues(new Uint8Array(32))
    const encoded = b64Encode(original)
    const decoded = b64Decode(encoded)
    expect(decoded).toEqual(original)
  })

  it('produces URL-safe characters only', () => {
    for (let i = 0; i < 20; i++) {
      const bytes = crypto.getRandomValues(new Uint8Array(16 + i))
      const encoded = b64Encode(bytes)
      expect(encoded).not.toMatch(/[+/=]/)
    }
  })
})

// ── Test 2: KWK derivation — same input → same key material ──────────────────

describe('deriveKWK', () => {
  it('produces a CryptoKey for AES-GCM', async () => {
    const salt = CryptoService.generateSalt()
    const kwk = await CryptoService.deriveKWK('123456', salt)
    expect(kwk.type).toBe('secret')
    expect(kwk.algorithm).toMatchObject({ name: 'AES-GCM' })
  })

  it('different salts → different keys (wrap/unwrap cross-check)', async () => {
    const salt1 = CryptoService.generateSalt()
    const salt2 = CryptoService.generateSalt()
    expect(salt1).not.toBe(salt2)

    const pair = await CryptoService.generateUserKeyPair()
    const kwk1 = await CryptoService.deriveKWK('pin', salt1)
    const kwk2 = await CryptoService.deriveKWK('pin', salt2)

    const { iv, ciphertext } = await CryptoService.wrapPrivateKey(pair.privateKey, kwk1)
    // Unwrapping with the wrong KWK must throw
    await expect(CryptoService.unwrapPrivateKey(ciphertext, iv, kwk2)).rejects.toThrow()
  })
})

// ── Test 3: wrap/unwrap private key ──────────────────────────────────────────

describe('wrapPrivateKey / unwrapPrivateKey', () => {
  it('round-trips the private key', async () => {
    const pair = await CryptoService.generateUserKeyPair()
    const salt = CryptoService.generateSalt()
    const kwk = await CryptoService.deriveKWK('testpassword', salt)
    const { iv, ciphertext } = await CryptoService.wrapPrivateKey(pair.privateKey, kwk)
    const recovered = await CryptoService.unwrapPrivateKey(ciphertext, iv, kwk)
    expect(recovered.type).toBe('private')
    expect(recovered.algorithm).toMatchObject({ name: 'ECDH' })
  })

  it('wrong PIN causes unwrap failure', async () => {
    const pair = await CryptoService.generateUserKeyPair()
    const salt = CryptoService.generateSalt()
    const kwk = await CryptoService.deriveKWK('correct', salt)
    const wrongKwk = await CryptoService.deriveKWK('wrong', salt)
    const { iv, ciphertext } = await CryptoService.wrapPrivateKey(pair.privateKey, kwk)
    await expect(CryptoService.unwrapPrivateKey(ciphertext, iv, wrongKwk)).rejects.toThrow()
  })
})

// ── Test 4: ECIES key wrap / unwrap ──────────────────────────────────────────

describe('eciesWrapKey / eciesUnwrapSymmetricKey', () => {
  it('round-trips a symmetric key', async () => {
    const recipientPair = await CryptoService.generateUserKeyPair()
    const convKey = await CryptoService.generateSymmetricKey()
    const orgId = 'test-org-id'

    const { ephPub, iv, ciphertext } = await CryptoService.eciesWrapKey(convKey, recipientPair.publicKey, orgId)
    const recovered = await CryptoService.eciesUnwrapSymmetricKey(ephPub, iv, ciphertext, recipientPair.privateKey, orgId)

    expect(recovered.type).toBe('secret')
    expect(recovered.algorithm).toMatchObject({ name: 'AES-GCM' })
  })

  it('wrong recipient private key causes unwrap failure', async () => {
    const alice = await CryptoService.generateUserKeyPair()
    const bob = await CryptoService.generateUserKeyPair()
    const convKey = await CryptoService.generateSymmetricKey()
    const orgId = 'test-org-id'

    const { ephPub, iv, ciphertext } = await CryptoService.eciesWrapKey(convKey, alice.publicKey, orgId)
    // Bob tries to decrypt Alice's key
    await expect(
      CryptoService.eciesUnwrapSymmetricKey(ephPub, iv, ciphertext, bob.privateKey, orgId)
    ).rejects.toThrow()
  })

  it('wrong orgId causes unwrap failure (HKDF info binding)', async () => {
    const pair = await CryptoService.generateUserKeyPair()
    const convKey = await CryptoService.generateSymmetricKey()

    const { ephPub, iv, ciphertext } = await CryptoService.eciesWrapKey(convKey, pair.publicKey, 'org-A')
    await expect(
      CryptoService.eciesUnwrapSymmetricKey(ephPub, iv, ciphertext, pair.privateKey, 'org-B')
    ).rejects.toThrow()
  })
})

// ── Test 5: encryptMessage / decryptMessage ───────────────────────────────────

describe('encryptMessage / decryptMessage', () => {
  it('round-trips a plaintext message', async () => {
    const key = await CryptoService.generateSymmetricKey()
    const plaintext = 'Bonjour, ceci est un message E2E chiffré !'
    const ciphertext = await CryptoService.encryptMessage(plaintext, key)
    const recovered = await CryptoService.decryptMessage(ciphertext, key)
    expect(recovered).toBe(plaintext)
  })

  it('different messages produce different ciphertexts (IV randomisation)', async () => {
    const key = await CryptoService.generateSymmetricKey()
    const msg = 'même message'
    const c1 = await CryptoService.encryptMessage(msg, key)
    const c2 = await CryptoService.encryptMessage(msg, key)
    // Each encryption uses a fresh IV so ciphertexts must differ
    expect(c1).not.toBe(c2)
  })

  it('tampered ciphertext causes decryption failure (AEAD integrity)', async () => {
    const key = await CryptoService.generateSymmetricKey()
    const ciphertext = await CryptoService.encryptMessage('données sensibles', key)
    // Flip a byte in the middle of the ciphertext
    const bytes = b64Decode(ciphertext)
    bytes[20] ^= 0xff
    const tampered = b64Encode(bytes)
    await expect(CryptoService.decryptMessage(tampered, key)).rejects.toThrow()
  })

  it('wrong key causes decryption failure', async () => {
    const key1 = await CryptoService.generateSymmetricKey()
    const key2 = await CryptoService.generateSymmetricKey()
    const ciphertext = await CryptoService.encryptMessage('secret', key1)
    await expect(CryptoService.decryptMessage(ciphertext, key2)).rejects.toThrow()
  })
})

// ── Test 6: breakglass wrap / unwrap ─────────────────────────────────────────

describe('wrapKeyWithPassphrase / unwrapPrivateKeyWithPassphrase', () => {
  it('round-trips an ECDH private key via breakglass phrase', async () => {
    const pair = await CryptoService.generateUserKeyPair()
    const phrase = 'aabbccdd-eeff0011-22334455-66778899'
    const { salt, iv, ciphertext } = await CryptoService.wrapKeyWithPassphrase(pair.privateKey, phrase, 'pkcs8')
    const recovered = await CryptoService.unwrapPrivateKeyWithPassphrase(ciphertext, iv, salt, phrase)
    expect(recovered.type).toBe('private')
    expect(recovered.algorithm).toMatchObject({ name: 'ECDH' })
  })

  it('wrong passphrase causes unwrap failure', async () => {
    const pair = await CryptoService.generateUserKeyPair()
    const { salt, iv, ciphertext } = await CryptoService.wrapKeyWithPassphrase(pair.privateKey, 'correct-phrase', 'pkcs8')
    await expect(
      CryptoService.unwrapPrivateKeyWithPassphrase(ciphertext, iv, salt, 'wrong-phrase')
    ).rejects.toThrow()
  })
})
