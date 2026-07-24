// All cryptographic primitives for E2E encryption.
// Pure Web Crypto API — zero external dependencies.
//
// Key algorithms:
//   Asymmetric : ECDH P-256
//   Symmetric  : AES-256-GCM (AEAD)
//   KDF (PIN)  : PBKDF2-SHA256, 600 000 iterations
//   KDF (ECIES): HKDF-SHA256
//   Random     : crypto.getRandomValues()

const KDF_ITERATIONS = 600_000
const ECIES_HKDF_SALT = 'kouma-org-recovery-v1'

// ── Base64url helpers ─────────────────────────────────────────────────────────

export function b64Encode(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf)
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

export function b64Decode(s: string): Uint8Array<ArrayBuffer> {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/')
  const pad = (4 - (b64.length % 4)) % 4
  const str = atob(b64 + '='.repeat(pad))
  const arr = new Uint8Array(str.length)
  for (let i = 0; i < str.length; i++) arr[i] = str.charCodeAt(i)
  return arr as Uint8Array<ArrayBuffer>
}

function textEncode(s: string): Uint8Array<ArrayBuffer> {
  const arr = new TextEncoder().encode(s)
  return new Uint8Array(arr.buffer, arr.byteOffset, arr.byteLength) as Uint8Array<ArrayBuffer>
}

// ── Core service ──────────────────────────────────────────────────────────────

export const CryptoService = {

  // ── User key pair (ECDH P-256) ────────────────────────────────────────────

  async generateUserKeyPair(): Promise<CryptoKeyPair> {
    return crypto.subtle.generateKey(
      { name: 'ECDH', namedCurve: 'P-256' },
      true,  // extractable — needed for wrapKey()
      ['deriveKey', 'deriveBits'],
    )
  },

  // Export public key as Base64url SPKI
  async exportPublicKey(pub: CryptoKey): Promise<string> {
    const spki = await crypto.subtle.exportKey('spki', pub)
    return b64Encode(spki)
  },

  // Import a Base64url SPKI public key
  async importPublicKey(spki: string): Promise<CryptoKey> {
    return crypto.subtle.importKey(
      'spki', b64Decode(spki),
      { name: 'ECDH', namedCurve: 'P-256' },
      true, [],
    )
  },

  // ── KWK — PIN-based key wrapping ─────────────────────────────────────────

  generateSalt(): string {
    return b64Encode(crypto.getRandomValues(new Uint8Array(16)))
  },

  async deriveKWK(secret: string, saltB64: string): Promise<CryptoKey> {
    const raw = await crypto.subtle.importKey(
      'raw', textEncode(secret), 'PBKDF2', false, ['deriveKey'],
    )
    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: b64Decode(saltB64),
        iterations: KDF_ITERATIONS,
        hash: 'SHA-256',
      },
      raw,
      { name: 'AES-GCM', length: 256 },
      false,
      ['wrapKey', 'unwrapKey'],
    )
  },

  // Wrap user's private key with KWK (PBKDF2 of PIN)
  async wrapPrivateKey(
    priv: CryptoKey,
    kwk: CryptoKey,
  ): Promise<{ iv: string; ciphertext: string }> {
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const ciphertext = await crypto.subtle.wrapKey(
      'pkcs8', priv, kwk, { name: 'AES-GCM', iv, tagLength: 128 },
    )
    return { iv: b64Encode(iv), ciphertext: b64Encode(ciphertext) }
  },

  // Unwrap user's private key using KWK derived from PIN
  async unwrapPrivateKey(
    ciphertextB64: string,
    ivB64: string,
    kwk: CryptoKey,
  ): Promise<CryptoKey> {
    return crypto.subtle.unwrapKey(
      'pkcs8',
      b64Decode(ciphertextB64),
      kwk,
      { name: 'AES-GCM', iv: b64Decode(ivB64), tagLength: 128 },
      { name: 'ECDH', namedCurve: 'P-256' },
      true,
      ['deriveKey', 'deriveBits'],
    )
  },

  // ── ECIES — asymmetric key wrapping ──────────────────────────────────────
  //
  // Used to encrypt a CryptoKey (symmetric or ECDH private) for a recipient's
  // public key.  Implements: ECDH(eph, recipient_pub) → HKDF → AES-GCM wrap.

  async eciesWrapKey(
    keyToWrap: CryptoKey,
    recipientPub: CryptoKey,
    orgId: string,
    format: 'raw' | 'pkcs8' = 'raw',
  ): Promise<{ ephPub: string; iv: string; ciphertext: string }> {
    // 1. Ephemeral ECDH pair
    const eph = await crypto.subtle.generateKey(
      { name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveKey', 'deriveBits'],
    )

    // 2. Shared secret
    const rawShared = await crypto.subtle.deriveBits(
      { name: 'ECDH', public: recipientPub }, eph.privateKey, 256,
    )

    // 3. HKDF → wrapping key
    const hkdfKey = await crypto.subtle.importKey('raw', rawShared, 'HKDF', false, ['deriveKey'])
    const wrappingKey = await crypto.subtle.deriveKey(
      {
        name: 'HKDF',
        salt: textEncode(ECIES_HKDF_SALT),
        info: textEncode(orgId),
        hash: 'SHA-256',
      },
      hkdfKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['wrapKey'],
    )

    // 4. Wrap the key
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const ciphertext = await crypto.subtle.wrapKey(
      format, keyToWrap, wrappingKey, { name: 'AES-GCM', iv, tagLength: 128 },
    )

    // 5. Export ephemeral public key (raw — 65 bytes for P-256 uncompressed)
    const ephPubRaw = await crypto.subtle.exportKey('raw', eph.publicKey)

    return {
      ephPub: b64Encode(ephPubRaw),
      iv: b64Encode(iv),
      ciphertext: b64Encode(ciphertext),
    }
  },

  async eciesUnwrapSymmetricKey(
    ephPubB64: string,
    ivB64: string,
    ciphertextB64: string,
    recipientPriv: CryptoKey,
    orgId: string,
  ): Promise<CryptoKey> {
    const wrappingKey = await this._eciesWrapingKey(ephPubB64, recipientPriv, orgId, 'unwrapKey')
    return crypto.subtle.unwrapKey(
      'raw',
      b64Decode(ciphertextB64),
      wrappingKey,
      { name: 'AES-GCM', iv: b64Decode(ivB64), tagLength: 128 },
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt'],
    )
  },

  async eciesUnwrapPrivateKey(
    ephPubB64: string,
    ivB64: string,
    ciphertextB64: string,
    recipientPriv: CryptoKey,
    orgId: string,
  ): Promise<CryptoKey> {
    const wrappingKey = await this._eciesWrapingKey(ephPubB64, recipientPriv, orgId, 'unwrapKey')
    return crypto.subtle.unwrapKey(
      'pkcs8',
      b64Decode(ciphertextB64),
      wrappingKey,
      { name: 'AES-GCM', iv: b64Decode(ivB64), tagLength: 128 },
      { name: 'ECDH', namedCurve: 'P-256' },
      true,
      ['deriveKey', 'deriveBits'],
    )
  },

  // Internal helper: derive ECIES wrapping key from ephemeral public key + recipient private
  async _eciesWrapingKey(
    ephPubB64: string,
    recipientPriv: CryptoKey,
    orgId: string,
    usage: 'wrapKey' | 'unwrapKey',
  ): Promise<CryptoKey> {
    const ephPub = await crypto.subtle.importKey(
      'raw', b64Decode(ephPubB64),
      { name: 'ECDH', namedCurve: 'P-256' },
      false, [],
    )
    const rawShared = await crypto.subtle.deriveBits(
      { name: 'ECDH', public: ephPub }, recipientPriv, 256,
    )
    const hkdfKey = await crypto.subtle.importKey('raw', rawShared, 'HKDF', false, ['deriveKey'])
    return crypto.subtle.deriveKey(
      {
        name: 'HKDF',
        salt: textEncode(ECIES_HKDF_SALT),
        info: textEncode(orgId),
        hash: 'SHA-256',
      },
      hkdfKey,
      { name: 'AES-GCM', length: 256 },
      false,
      [usage],
    )
  },

  // ── Breakglass — passphrase-based wrap of org_recovery_priv ──────────────

  // Generate a breakglass phrase (128-bit entropy, hex groups)
  generateBreakglassPhrase(): { phrase: string; rawBytes: Uint8Array } {
    const bytes = crypto.getRandomValues(new Uint8Array(16))
    const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
    const phrase = [
      hex.slice(0, 8),
      hex.slice(8, 16),
      hex.slice(16, 24),
      hex.slice(24, 32),
    ].join('-')
    return { phrase, rawBytes: bytes }
  },

  async wrapKeyWithPassphrase(
    key: CryptoKey,
    phrase: string,
    format: 'raw' | 'pkcs8' = 'pkcs8',
  ): Promise<{ salt: string; iv: string; ciphertext: string }> {
    const salt = b64Encode(crypto.getRandomValues(new Uint8Array(16)))
    const kwk = await this.deriveKWK(phrase, salt)
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const ciphertext = await crypto.subtle.wrapKey(
      format, key, kwk, { name: 'AES-GCM', iv, tagLength: 128 },
    )
    return { salt, iv: b64Encode(iv), ciphertext: b64Encode(ciphertext) }
  },

  async unwrapPrivateKeyWithPassphrase(
    ciphertextB64: string,
    ivB64: string,
    saltB64: string,
    phrase: string,
  ): Promise<CryptoKey> {
    const kwk = await this.deriveKWK(phrase, saltB64)
    return crypto.subtle.unwrapKey(
      'pkcs8',
      b64Decode(ciphertextB64),
      kwk,
      { name: 'AES-GCM', iv: b64Decode(ivB64), tagLength: 128 },
      { name: 'ECDH', namedCurve: 'P-256' },
      true,
      ['deriveKey', 'deriveBits'],
    )
  },

  // ── Symmetric key (AES-256-GCM) ───────────────────────────────────────────

  async generateSymmetricKey(): Promise<CryptoKey> {
    return crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt'],
    )
  },

  // ── Message encrypt / decrypt ─────────────────────────────────────────────

  async encryptMessage(plaintext: string, convKey: CryptoKey): Promise<string> {
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const data = textEncode(plaintext)
    const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, tagLength: 128 }, convKey, data)
    const blob = new Uint8Array(12 + cipher.byteLength)
    blob.set(iv, 0)
    blob.set(new Uint8Array(cipher), 12)
    return b64Encode(blob)
  },

  async decryptMessage(ciphertextB64: string, convKey: CryptoKey): Promise<string> {
    const blob = b64Decode(ciphertextB64)
    const iv = blob.slice(0, 12)
    const cipher = blob.slice(12)
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv, tagLength: 128 }, convKey, cipher)
    return new TextDecoder().decode(plain)
  },
}
