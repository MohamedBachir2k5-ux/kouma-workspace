# Syli taa — Préparation à l'audit de sécurité

## Surface d'attaque à tester

### 1. Authentification

| Vecteur | Mécanisme de défense |
|---------|---------------------|
| Brute-force PIN | Supabase Auth rate limiting |
| Credential stuffing | Email + PIN (pas réutilisable cross-org) |
| Session hijacking | JWT Supabase + révocation par user_sessions |
| Déconnexion forcée | SessionService.revoke() → supprime session + Supabase signOut |

### 2. Isolation multi-tenant

- **RLS PostgreSQL** sur toutes les tables : `is_org_member(org_id)` vérifié côté DB.
- **Test critique** : tentative de lecture de données org B depuis un JWT org A → doit retourner 0 lignes.
- Les clés E2E sont wrappées avec le contexte `orgId` (HKDF info) — une clé d'une org ne peut déchiffrer dans une autre org.

### 3. Chiffrement E2E

- ECDH P-256 + AES-256-GCM — algorithmes NIST recommandés.
- PBKDF2 600k itérations — conforme OWASP 2024.
- IV généré aléatoirement à chaque chiffrement.
- Pas de réutilisation de IV (vérifier).
- Test : déchiffrement avec mauvaise clé doit lever DOMException.

### 4. Storage

- Bucket `attachments` privé — jamais public.
- RLS Storage : premier segment de chemin = org_id.
- Signed URLs expirables (300s pour documents, 7 jours pour PJ messages).
- Test : accès à une signed URL d'une autre org → 403.

### 5. RLS Supabase

Politiques à vérifier :

| Table | Politique | Test |
|-------|-----------|------|
| profiles | Own profile + Org members see each other | User A ne voit pas user C hors de son org |
| messages | Message senders and receivers | User hors conv → 0 messages |
| documents | Org members | User org B → 0 docs org A |
| org_recovery_keys | Admins only | Member role → 0 lignes |
| conversation_keys | Own keys only | User B ne voit pas les clés conv de User A |
| file_keys | Own keys only | User B ne voit pas les clés fichiers de User A |

### 6. Secrets et exposition

- `VITE_SUPABASE_ANON_KEY` : clé anonyme Supabase — publique par design, protégée par RLS.
- Clés privées : jamais stockées, jamais dans les logs, jamais dans le localStorage.
- `cryptoSession` : mémoire uniquement, vidé au logout.
- Pas de secret côté frontend exposé en dehors de la clé anon Supabase.

### 7. Injection

- Toutes les requêtes Supabase utilisent des paramètres bindés (SDK Supabase).
- Aucune concaténation SQL manuelle.
- XSS : React échappe automatiquement les contenus rendus.

### 8. Points de vigilance

1. **`file_keys` RLS INSERT** : `WITH CHECK (true)` — permissif pour permettre la distribution des clés. À surveiller.
2. **`org_recovery_keys` SELECT** : deux policies empilées (ALL + SELECT admin). Vérifier qu'un non-admin ne peut pas lire.
3. **Bucket attachments** : politiques UPDATE ajoutées en 010. Vérifier qu'un user ne peut pas écraser le fichier d'un autre.
4. **Changement de mot de passe** : si le re-wrap clé échoue, l'utilisateur sera verrouillé au prochain login.
5. **Réinitialisation mot de passe** : chemin `/reset-password` avertit de l'inaccessibilité E2E — correct par design.

## Tests de sécurité existants

`src/services/__tests__/crypto.service.test.ts` — 15 tests :

- Base64url encode/decode
- Dérivation KWK PBKDF2
- Wrap/unwrap clé privée
- Rejet avec mauvaise clé
- Génération et import clé publique ECDH
- ECIES wrap/unwrap (symétrique)
- Chiffrement/déchiffrement message AES-GCM
- HKDF dérivation
- Génération phrase breakglass
- Wrap/unwrap avec passphrase

## Commande de test

```bash
npm test
# Attendu : 15/15 passed
```

## Vecteurs hors scope v1

- Rotation de clés (prévu Phase 8)
- 2FA / TOTP
- Audit trail côté chiffrement (qui a accédé à quelle clé)
- Hardware security modules
