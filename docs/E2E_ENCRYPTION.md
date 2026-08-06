# Syli taa — Chiffrement E2E

## Principes

- **Zero-knowledge** : le serveur ne voit jamais les clés privées en clair.
- **Web Crypto API** uniquement — aucune bibliothèque crypto tierce.
- **Chiffrement opportuniste** : si la session crypto n'est pas chargée, le contenu est stocké en clair avec `content_encrypted = false`. Le déchiffrement tente transparaitement ; si la clé manque, le texte brut est affiché.
- **Escrow organisationnel** : chaque message et fichier est aussi chiffré pour la clé de récupération de l'organisation.

## Algorithmes

| Usage | Algorithme | Paramètres |
|-------|-----------|------------|
| Dérivation KWK | PBKDF2-SHA256 | 600 000 itérations |
| Paires de clés | ECDH P-256 | SPKI (public) / PKCS8 (privé) |
| Enveloppe clé privée | AES-256-GCM | IV 96 bits |
| Chiffrement symétrique messages/fichiers | AES-256-GCM | IV 96 bits, tag 128 bits |
| ECIES (distribution de clés) | ECDH éphémère + HKDF-SHA256 → AES-256-GCM | info = orgId |
| Breakglass KWK | PBKDF2-SHA256 | 600 000 itérations, phrase aléatoire 32 octets hex |

## Hiérarchie des clés

```
Mot de passe / PIN
       │
    PBKDF2 (600k)
       │
      KWK (AES-256-GCM)
       │
    wrap/unwrap
       │
  UserPrivKey (ECDH P-256)   ←──────────────── auth.users
  UserPubKey  (ECDH P-256)

  OrgRecoveryPrivKey (ECDH P-256)   ←── generé à la création de l'org
  OrgRecoveryPubKey  (ECDH P-256)
       │
       ├── ECIES(adminPub) → org_recovery_keys.encrypted_recovery_private_key
       └── PBKDF2(phrase) → org_recovery_keys.bg_encrypted_key (breakglass)

  ConvSymKey (AES-256-GCM)   ←── generé à la 1re utilisation
       ├── ECIES(userPub) → conversation_keys (par participant)
       └── ECIES(orgRecoveryPub) → conversation_recovery_keys

  FileSymKey (AES-256-GCM)   ←── generé par upload
       ├── ECIES(userPub) → file_keys
       └── ECIES(orgRecoveryPub) → file_recovery_keys
```

## CryptoSession (in-memory)

`src/lib/crypto-session.ts` — singleton jamais persisté.

```typescript
class CryptoSession {
  _userPriv: CryptoKey | null   // clé privée ECDH déchiffrée
  _userPub:  CryptoKey | null   // clé publique ECDH
  _orgId:    string | null
  _convKeys: Map<string, CryptoKey>  // cache des clés conv
}
```

**Chargement** : `KeyService.loadUserKeys(userId, pin, orgId)` après login.
**Vidage** : `AuthService.signOut()` → `cryptoSession.clear()`.

## Flux message chiffré

```
Sender
  1. Vérifier cryptoSession.isLoaded
  2. KeyService.getOrLoadConversationKey(convId, orgId)
     └── Si absente : KeyService.initConversationKeys(convId, orgId, participants)
  3. CryptoService.encryptMessage(plaintext, convKey) → base64url
  4. INSERT messages(content=ciphertext, content_encrypted=true)

Receiver (Realtime)
  1. payload.new déclenche le callback subscribe()
  2. decryptRow(row, orgId)
     └── KeyService.getOrLoadConversationKey(convId, orgId)
     └── CryptoService.decryptMessage(ciphertext, convKey) → plaintext
  3. Affichage du plaintext
```

## Flux fichier chiffré

```
Upload
  1. file.arrayBuffer() → plainBuf
  2. KeyService.initFileKey(storagePath, orgId) → fileKey
  3. IV (12 octets) || AES-GCM(plainBuf, fileKey, IV) → cipherBuf
  4. Storage upload : {orgId}/docs/{userId}/{ts}_{name}.enc

Download
  1. DocumentService.downloadDocument(docId, orgId)
  2. Signed URL → fetch → rawBuf
  3. Si storagePath.endsWith('.enc') && cryptoSession.isLoaded :
     └── KeyService.getOrLoadFileKey(storagePath, orgId) → fileKey
     └── AES-GCM decrypt(rawBuf[12:], fileKey, rawBuf[0:12]) → plainBuf
  4. Blob URL → <a download>
```

## Récupération de compte (breakglass)

1. L'admin saisit la phrase breakglass (4 groupes 8 hex).
2. `RecoveryService` dérive le KWK via PBKDF2 depuis la phrase.
3. Déchiffre `org_recovery_keys.bg_encrypted_key` → `orgRecoveryPriv`.
4. Avec `orgRecoveryPriv` : déchiffre n'importe quelle conversation ou fichier org.
5. Opération enregistrée dans `audit_logs` action `breakglass_used`.

## Changement de mot de passe

`KeyService.rewrapPrivateKey(userId, newSecret)` :
1. Récupère `cryptoSession.userPriv` (doit être chargé).
2. Génère nouveau sel + nouvel IV.
3. Dérive nouveau KWK avec `newSecret`.
4. Re-wrap `userPriv` → `user_key_pairs` mis à jour.

**Important** : Sans re-wrap, la clé privée reste wrappée avec l'ancien mot de passe et le login suivant échouera.

## Rotation des clés

Non implémentée en v1. Prévu en Phase 8 (post-launch).
La rotation nécessiterait de re-chiffrer toutes les `conversation_keys` et `file_keys`.
