# Kouma — Architecture Security Report v1.0

**Date :** 2026-07-29
**Périmètre :** Application complète — frontend, backend Supabase, chiffrement E2E, gestion des clés
**Environnement évalué :** Local (Supabase CLI) + codebase production (`main`)
**Statut :** Référence officielle projet

---

## Table des matières

1. [Architecture globale](#1-architecture-globale)
2. [Score de maturité sécurité](#2-score-de-maturité-sécurité)
3. [Risques restants](#3-risques-restants)
4. [Recommandations V2](#4-recommandations-v2)
5. [Dépendances externes](#5-dépendances-externes)
6. [Hypothèses de sécurité](#6-hypothèses-de-sécurité)

---

## 1. Architecture globale

### 1.1 Vue d'ensemble

```
┌─────────────────────────────────────────────────────────────┐
│                        NAVIGATEUR                           │
│                                                             │
│  React 19 + Vite                                            │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────┐   │
│  │  Auth Layer │  │Crypto Layer │  │   UI / Pages     │   │
│  │ AuthContext │  │CryptoSession│  │ admin/ + app/    │   │
│  │ SessionSvc  │  │CryptoService│  │ auth/            │   │
│  └──────┬──────┘  └──────┬──────┘  └────────┬─────────┘   │
│         │                │                   │             │
│  ┌──────▼────────────────▼───────────────────▼─────────┐   │
│  │                  Service Layer                       │   │
│  │  MessageSvc · DocumentSvc · StorageSvc · UserSvc    │   │
│  │  KeySvc · RecoverySvc · OrganizationSvc · AuditSvc  │   │
│  └──────────────────────────┬──────────────────────────┘   │
└─────────────────────────────┼───────────────────────────────┘
                              │  HTTPS / WSS
                              │  JWT (Supabase Auth)
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     SUPABASE (BaaS)                         │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │  Auth Server │  │  PostgREST   │  │  Realtime (WS)  │  │
│  │  (JWT RS256) │  │  + RLS       │  │  Broadcast      │  │
│  └──────┬───────┘  └──────┬───────┘  └────────┬────────┘  │
│         │                 │                    │            │
│  ┌──────▼─────────────────▼────────────────────▼────────┐  │
│  │              PostgreSQL 15                            │  │
│  │  39 tables · 99 RLS policies · 22 SECURITY DEFINER   │  │
│  │  RPCs · 46 migrations                                 │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Storage (bucket: attachments — PRIVÉ)               │   │
│  │  Signed URLs uniquement · paths org-scopés           │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                      Vercel CDN (frontend)
                      Headers HTTP sécurité
                      CSP · HSTS · nosniff
```

### 1.2 Flux d'authentification

```
ADMIN                           COLLABORATEUR
  │                                   │
  │ email + password                  │ email + PIN (6 chiffres)
  ▼                                   ▼
Supabase Auth                   Supabase Auth
  │ JWT RS256                         │ JWT RS256
  │                                   │ + PBKDF2(PIN, salt, 600k) → KWK
  │                                   │ + AES-GCM(KWK) → unwrap ECDH priv
  ▼                                   ▼
user_sessions (device_fingerprint)   user_sessions
AuthContext (React)                  AuthContext + CryptoSession (mémoire)
```

### 1.3 Flux de chiffrement E2E

```
EXPÉDITEUR                          DESTINATAIRE
     │                                    │
     │ convKey = AES-256 (in memory)      │
     │                                    │
     │ ciphertext = AES-GCM(convKey, IV)  │
     │   IV = 96 bits aléatoires          │
     │                                    │
     ▼                                    │
 messages.content (ciphertext)            │
 messages.content_encrypted = true        │
                                          │
                              ECDH(eph_priv, dest_pub) → HKDF → AES-GCM
                              conversation_keys.encrypted_key (wrapping)
                                          │
                              CryptoSession → unwrap convKey
                              AES-GCM-decrypt(content) → plaintext
```

### 1.4 Modèle de clés

```
PIN / Password
     │
     ▼ PBKDF2-SHA256 (600 000 itérations, salt 128 bits)
 KWK (Key-Wrapping Key)
     │
     ▼ AES-256-GCM unwrap
 ECDH P-256 Private Key  ← stocké dans user_key_pairs.private_key_encrypted
     │                      (jamais en clair côté serveur)
     │
     ├── ECIES(eph_priv, dest_pub) → wraps convKey   → conversation_keys
     ├── ECIES(eph_priv, dest_pub) → wraps fileKey   → file_keys
     └── ECIES(eph_priv, org_pub)  → org recovery    → org_recovery_keys
```

### 1.5 Séparation des rôles

| Surface | Admin | Membre |
|---|---|---|
| Messages directs / groupes | ✗ Aucun accès | ✓ Participants uniquement |
| Clés de conversation | ✗ Aucun accès | ✓ Propre ligne uniquement |
| Contenu des fichiers | ✗ (sans breakglass) | ✓ Propre clé |
| Métadonnées membres | ✓ Lecture | ✓ Lecture (même org) |
| Journal d'audit | ✓ Lecture + écriture | Écriture uniquement |
| Paramètres sécurité | ✓ CRUD | ✗ |
| Clé de récupération | ✓ (phrase breakglass requise) | ✗ |
| Sessions autres membres | ✓ Révocation | ✗ |

---

## 2. Score de maturité sécurité

Évaluation sur 10 domaines, score pondéré global.

### 2.1 Tableau de scores

| # | Domaine | Poids | Score | Justification |
|---|---|---|---|---|
| 1 | **Authentification** | 15 % | 8 / 10 | PIN + OTP recovery solides ; rate limiting côté client ; lockout 5 tentatives/15 min. Manque : 2FA TOTP optionnel. |
| 2 | **Gestion des sessions** | 10 % | 9 / 10 | `user_sessions` avec révocation immédiate, fingerprint appareil, redirect forcé sur SIGNED_OUT. Manque : rotation automatique des JWTs. |
| 3 | **Chiffrement E2E** | 20 % | 9 / 10 | ECDH P-256 + AES-256-GCM + PBKDF2 600k — suite NIST. Zéro fallback en clair. CryptoSession mémoire uniquement. Manque : vérification fingerprint clés publiques hors-bande. |
| 4 | **Gestion des clés** | 15 % | 8 / 10 | Clés privées jamais en clair serveur. Breakglass documenté. Rotation PIN opérationnelle. Manque : log d'expiration des URLs signées avatars (1 an). |
| 5 | **Contrôle d'accès (RLS)** | 15 % | 10 / 10 | 39/39 tables avec RLS, 99 politiques, 0 catch-all, 22 SECURITY DEFINER RPCs. Admin ne peut pas lire les messages privés — vérifié par test DB. |
| 6 | **Sécurité des fichiers** | 8 % | 9 / 10 | MIME allowlist stricte, max 50 Mo, URLs signées uniquement, chiffrement AES-GCM avant upload, zéro fallback plaintext. |
| 7 | **Prévention des injections** | 7 % | 9 / 10 | Zéro `dangerouslySetInnerHTML`, validation URL schemes, primaryColor validé regex, queries paramétrées. CSP `script-src 'self'`. |
| 8 | **En-têtes HTTP** | 5 % | 10 / 10 | CSP, HSTS preload, X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy. |
| 9 | **Journalisation / Audit** | 3 % | 8 / 10 | Toutes les actions sensibles loguées. Manque : alertes automatiques sur breakglass_used, SIEM export. |
| 10 | **Paiement / Webhooks** | 2 % | 4 / 10 | Paiement géré côté client (PaymentService). Edge Function manquante. Risque de spoofing. |

### 2.2 Score global

```
Score pondéré = Σ(score_i × poids_i)

= (8×0.15) + (9×0.10) + (9×0.20) + (8×0.15) + (10×0.15)
+ (9×0.08) + (9×0.07) + (10×0.05) + (8×0.03) + (4×0.02)

= 1.20 + 0.90 + 1.80 + 1.20 + 1.50
+ 0.72 + 0.63 + 0.50 + 0.24 + 0.08

= 8.77 / 10
```

### 2.3 Résumé visuel

```
Authentification    ████████░░  8/10
Sessions            █████████░  9/10
Chiffrement E2E     █████████░  9/10
Gestion clés        ████████░░  8/10
RLS / Accès         ██████████ 10/10
Sécurité fichiers   █████████░  9/10
Injections          █████████░  9/10
En-têtes HTTP       ██████████ 10/10
Audit               ████████░░  8/10
Paiement            ████░░░░░░  4/10
────────────────────────────────────
GLOBAL              ████████▊░  8.77/10  (cible V1 : ≥ 8.5 ✓)
```

**Verdict :** Kouma dépasse la cible de maturité V1 (8.5/10). Le seul domaine sous le seuil d'acceptabilité est le paiement, qui doit être traité en V2 avant toute mise en production avec des clients payants.

---

## 3. Risques restants

Classés par priorité : **CRITIQUE > ÉLEVÉ > MOYEN > FAIBLE**.

### 3.1 CRITIQUE

| ID | Risque | Surface | Probabilité | Impact |
|---|---|---|---|---|
| R-01 | **Webhook paiement côté client** — un attaquant peut forger un callback de paiement sans passer par le prestataire | `PaymentService.handleCallback()` | Faible (requiert connaissance de l'API interne) | Très élevé (activation de plan frauduleuse) |

**Mitigation immédiate :** Bloquer `PaymentService.handleCallback()` avec un guard de vérification signature côté serveur jusqu'au déploiement de l'Edge Function.

---

### 3.2 ÉLEVÉ

| ID | Risque | Surface | Probabilité | Impact |
|---|---|---|---|---|
| R-02 | **Pas de cleanup automatique des sessions expirées** — `cleanup_expired_sessions()` existe mais n'est pas appelée automatiquement (pas de cron) | `user_sessions` | Élevée (pas de cron configuré) | Moyen (sessions zombies actives au-delà de la durée configurée) |
| R-03 | **Rate limiting OTP uniquement côté client** — un attaquant qui bypass le JS peut soumettre des OTP à la vitesse de l'API | `RecoveryService.sendRecoveryOtp()` | Faible (nécessite de contourner le frontend) | Élevé (brute-force OTP) |
| R-04 | **CryptoSession perdue après refresh** — après un rechargement, `cryptoSession.isLoaded = false` et les messages historiques ne sont plus déchiffrables jusqu'à reconnexion explicite avec PIN | `CryptoSession` | Certaine (comportement nominal) | Moyen (UX dégradée, confusion utilisateur) |

---

### 3.3 MOYEN

| ID | Risque | Surface | Probabilité | Impact |
|---|---|---|---|---|
| R-05 | **Pas de vérification fingerprint clé publique** — Supabase pourrait théoriquement substituer une clé publique malveillante | `user_key_pairs.public_key` | Très faible (nécessite compromission Supabase) | Élevé (man-in-the-middle sur chiffrement E2E) |
| R-06 | **URLs signées avatars valables 1 an** — si un token signé fuite, l'accès à l'avatar est valable 1 an sans révocation possible | `UserService.uploadAvatar()` | Très faible | Faible (avatar = donnée non critique) |
| R-07 | **Breakglass phrase non vérifiée côté serveur** — la validation de la phrase se fait côté client (tentative de déchiffrement échoue). Un attaquant avec accès au réseau peut tenter des phrases à volonté | `RecoveryService.adminBreakglass()` | Très faible (nécessite session admin active) | Élevé si réussi |
| R-08 | **Pas d'alerte automatique sur `breakglass_used`** — l'événement est loggé mais aucun email / notification envoyé aux autres admins | `audit_logs` | N/A | Moyen (détection tardive d'un accès anormal) |

---

### 3.4 FAIBLE

| ID | Risque | Surface | Probabilité | Impact |
|---|---|---|---|---|
| R-09 | **Clock skew JWT en dev** — `JWT issued at future` observé dans les logs (environnement local uniquement) | Dev environment | Certaine en local | Nul en production (Supabase cloud NTP) |
| R-10 | **Absence de Content-Security-Policy report-uri** — les violations CSP ne sont pas remontées | `vercel.json` | N/A | Faible (observabilité seulement) |
| R-11 | **`style-src 'unsafe-inline'` dans le CSP** — nécessaire pour Tailwind CSS. Empêche une protection XSS via styles inline | `vercel.json` | Faible (React escape par défaut) | Faible |

---

## 4. Recommandations V2

Priorisées par valeur sécurité / effort d'implémentation.

### Priorité 1 — Avant mise en production clients payants

#### V2-01 : Edge Function `payment-webhook`
**Risque corrigé :** R-01
```
supabase/functions/payment-webhook/index.ts
  → Vérifier HMAC-SHA256 signature du provider
  → Mettre à jour subscriptions uniquement si signature valide
  → Logger dans audit_logs
```
**Effort :** 2 jours · **Impact :** Critique

#### V2-02 : Cron `session-cleanup`
**Risque corrigé :** R-02
```
supabase/functions/session-cleanup/index.ts
  → Appelé quotidiennement via Supabase Scheduled Functions
  → Appelle cleanup_expired_sessions() pour chaque org active
```
**Effort :** 1 jour · **Impact :** Élevé

---

### Priorité 2 — Dans les 30 jours post-launch

#### V2-03 : Rate limiting OTP côté serveur
**Risque corrigé :** R-03

Option A — Supabase Edge Function entre frontend et `sendOtp()` :
```
POST /functions/v1/send-recovery-otp
  → Vérifie rate limit en mémoire Redis / KV store
  → Délègue à Supabase Auth OTP
  → Retourne 429 si limite dépassée
```
Option B (plus simple) — activer le rate limiting natif Supabase Auth dans `supabase/config.toml`.

**Effort :** 1 jour · **Impact :** Élevé

#### V2-04 : Alerte automatique `breakglass_used`
**Risque corrigé :** R-08
```typescript
// Dans RecoveryService.adminBreakglass() après succès :
await supabase.rpc('notify_users', {
  p_user_ids: [tous les admins de l'org sauf l'acteur],
  p_type: 'security_alert',
  p_payload: { text: 'Accès breakglass utilisé. Vérifiez le journal de sécurité.' }
})
// + email via Supabase Edge Function (Resend / SendGrid)
```
**Effort :** 0.5 jour · **Impact :** Moyen

#### V2-05 : Réduction TTL URLs signées avatars
**Risque corrigé :** R-06

Réduire de 1 an à 7 jours. Implémenter un refresh automatique à l'affichage (`<Avatar>` component vérifie expiry et re-génère si nécessaire).

**Effort :** 1 jour · **Impact :** Moyen

---

### Priorité 3 — Dans les 90 jours post-launch

#### V2-06 : Vérification fingerprint clé publique
**Risque corrigé :** R-05

Afficher le fingerprint SHA-256 de la clé publique de chaque utilisateur dans son profil. Permettre une vérification hors-bande (QR code, comparaison visuelle).
```typescript
// Dans UserProfile :
const fingerprint = await crypto.subtle.digest('SHA-256', rawPublicKey)
// Afficher comme : "A3:F2:9C:..."
```
**Effort :** 2 jours · **Impact :** Élevé (pour les clients haute sécurité)

#### V2-07 : CSP `report-uri`
**Risque corrigé :** R-10
```json
"Content-Security-Policy": "... report-uri https://your-csp-report-endpoint"
```
Utiliser un service tiers (Report URI, Sentry CSP reports) ou une Edge Function dédiée.
**Effort :** 0.5 jour · **Impact :** Observabilité

#### V2-08 : 2FA TOTP optionnel pour les admins
Activer le TOTP (Google Authenticator, etc.) comme second facteur pour les comptes admin. Supabase Auth supporte nativement le TOTP en MFA.
**Effort :** 2 jours · **Impact :** Élevé

#### V2-09 : Renouvellement CryptoSession transparent
**Risque corrigé :** R-04

Proposer une fenêtre modale PIN non intrusive après refresh (si session Supabase encore valide) pour recharger la CryptoSession sans déconnexion complète.
**Effort :** 3 jours · **Impact :** UX + sécurité

---

## 5. Dépendances externes

### 5.1 Dépendances de production

| Dépendance | Version | Rôle | Risque sécurité | Mitigation |
|---|---|---|---|---|
| `@supabase/supabase-js` | ^2.110.8 | BaaS client (Auth, DB, Storage, Realtime) | **ÉLEVÉ** — toute l'infrastructure de données repose sur Supabase | RLS empêche l'accès non autorisé même si client compromise. Suivre les CVE Supabase. |
| `react` / `react-dom` | ^19.2.7 | UI framework | Faible — React 19 actif, JSX escape natif | Maintenir à jour. |
| `react-router-dom` | ^7.18.1 | Routing | Faible | Mettre à jour si CVE routing. |
| `i18next` / `react-i18next` | ^26.x / ^17.x | Internationalisation | Très faible | Audit des traductions pour injection. |
| `@sentry/react` | ^10.68.0 | Monitoring d'erreurs | **MOYEN** — Sentry peut recevoir des stack traces avec données potentiellement sensibles | Filtrer les données sensibles via `beforeSend`. Ne jamais envoyer de contenu de message à Sentry. |
| `lucide-react` | ^1.25.0 | Icônes SVG | Très faible | Icônes statiques, pas de rendu dynamique. |

### 5.2 Dépendances de build (non embarquées en production)

| Dépendance | Rôle | Risque supply chain |
|---|---|---|
| `vite` | Bundler | Faible — fichiers compilés vérifiables |
| `typescript` | Transpileur | Faible |
| `tailwindcss` | CSS utility | Faible |
| `oxlint` | Linter | Très faible |
| `vitest` | Tests | Très faible |

### 5.3 Services externes

| Service | Usage | Données transmises | Contrat sécurité |
|---|---|---|---|
| **Supabase** | BaaS complet | Toutes les données applicatives (chiffrées E2E pour les messages) | SOC 2 Type II, GDPR compliant |
| **Vercel** | Hébergement frontend | Bundle JS statique uniquement. Aucune donnée utilisateur. | SOC 2 Type II |
| **api.vapid.cloud** | Push notifications (VAPID) | Identifiant de souscription push uniquement. Jamais de contenu. | À auditer avant production |
| **Sentry** (optionnel) | Error tracking | Stack traces, breadcrumbs (sans contenu message) | SOC 2 Type II |

### 5.4 Variables d'environnement exposées côté client

```
VITE_SUPABASE_URL          ← Safe : URL publique
VITE_SUPABASE_ANON_KEY     ← Safe : clé publique, RLS est le contrôle d'accès
VITE_APP_URL               ← Safe : URL de l'app
VITE_APP_ENV               ← Safe : "production" / "development"
VITE_VAPID_PUBLIC_KEY      ← Safe : clé publique VAPID par design
VITE_SENTRY_DSN            ← Safe : DSN public Sentry
```

**Aucun secret côté client.** La `service_role` key Supabase n'est jamais dans le frontend.

---

## 6. Hypothèses de sécurité

Le modèle de sécurité de Kouma est valide **si et seulement si** les hypothèses suivantes sont vraies.

### 6.1 Hypothèses fondamentales

| # | Hypothèse | Si violée → |
|---|---|---|
| H-01 | **Supabase Auth n'est pas compromis.** Les JWT sont signés avec une clé RS256 que seul Supabase détient. | Un attaquant pourrait forger des tokens et bypasser le RLS. |
| H-02 | **Le navigateur de l'utilisateur n'est pas compromis.** La CryptoSession (clé privée ECDH en mémoire) est inaccessible à du code tiers. | Extension malveillante ou XSS résiduel pourrait exfiltrer la clé privée en mémoire. |
| H-03 | **L'API PostgREST de Supabase applique correctement le RLS.** Aucune query ne bypass les politiques. | Des données cross-org ou cross-user pourraient fuiter. |
| H-04 | **Le PIN de l'utilisateur n'est pas devinable.** Un PIN faible (000000, 123456) rend le PBKDF2 inutile si la base est compromise. | Validated by design : PIN faibles rejetés à la saisie. |
| H-05 | **La phrase breakglass est stockée de façon sécurisée par l'admin.** | Perte permanente des conversations team en cas de perte de tous les accès admin. |
| H-06 | **L'infrastructure Supabase (stockage, DB) ne substitue pas de clés publiques.** | Man-in-the-middle sur le chiffrement E2E — mitigé en V2 par fingerprinting hors-bande (V2-06). |
| H-07 | **Le bundle JavaScript servi par Vercel n'est pas altéré.** | CSP + HSTS mitigent les injections réseau. SRI (Subresource Integrity) pourrait renforcer davantage. |

### 6.2 Ce que Kouma NE garantit PAS

| Situation | Garantie |
|---|---|
| Compromission complète du poste utilisateur (malware) | Aucune — la clé privée en mémoire peut être exfiltrée |
| Compromission de Supabase infrastructure | Partielle — les messages restent chiffrés, mais la disponibilité et l'intégrité des clés stockées est compromise |
| Perte de la phrase breakglass avec perte simultanée de tous les accès admin | Les conversations team deviennent irrécupérables |
| Utilisateur partageant volontairement son PIN | Aucune — contrôle organisationnel requis |
| Conformité RGPD complète | Hors périmètre de ce rapport — à traiter séparément (DPA, registre des traitements, droit à l'oubli) |

### 6.3 Garanties confirmées

| Garantie | Mécanisme |
|---|---|
| Un admin ne peut pas lire les messages privés ou de groupe | RLS `conversation_keys` + `messages` — vérifié par test DB |
| Les messages ne transitent jamais en clair sur le réseau | AES-256-GCM côté client avant envoi, zéro fallback plaintext |
| Une clé privée n'est jamais stockée en clair côté serveur | PKCS8 AES-GCM-wrapped uniquement dans `user_key_pairs` |
| La suppression d'un membre révoque immédiatement sa session | `user_sessions.revoked = true` + redirect forcé |
| Les données d'une organisation sont invisibles pour une autre | RLS `is_org_member()` sur toutes les 39 tables |
| Les invitations expirent selon la politique configurée | `org_security_settings.invite_expiry_days` en DB |

---

## Annexe — Métriques techniques

| Métrique | Valeur |
|---|---|
| Tables PostgreSQL | 39 |
| Tables avec RLS activé | 39 (100 %) |
| Politiques RLS | 99 |
| RPCs SECURITY DEFINER | 22 |
| Migrations appliquées | 46 |
| Vecteurs d'attaque audités | 33 |
| Failles corrigées (audit v1) | 13 |
| Failles critiques restantes | 1 (R-01 : webhook paiement) |
| Score maturité global | **8.77 / 10** |

---

*Document généré le 2026-07-29 — à réviser après chaque changement d'architecture majeur ou incident de sécurité.*
*Auteur : équipe Kouma + audit automatisé Claude Code.*
