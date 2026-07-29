# Kouma — Security Reference

This document describes Kouma's security architecture, threat model, cryptographic design, and incident procedures. It is the authoritative reference for auditors, enterprise customers, and new engineers joining the project.

---

## Table of Contents

1. [Authentication](#1-authentication)
2. [Session Management](#2-session-management)
3. [Role Model](#3-role-model)
4. [Row-Level Security (RLS)](#4-row-level-security)
5. [End-to-End Encryption](#5-end-to-end-encryption)
6. [Key Management](#6-key-management)
7. [Organisation Recovery Key & Breakglass](#7-organisation-recovery-key--breakglass)
8. [Data Protection Boundaries](#8-data-protection-boundaries)
9. [File & Attachment Security](#9-file--attachment-security)
10. [Input Validation & Injection Prevention](#10-input-validation--injection-prevention)
11. [Rate Limiting & Abuse Prevention](#11-rate-limiting--abuse-prevention)
12. [HTTP Security Headers](#12-http-security-headers)
13. [Security Settings (per organisation)](#13-security-settings-per-organisation)
14. [Incident Management](#14-incident-management)
15. [Known Limitations](#15-known-limitations)

---

## 1. Authentication

### Admin (organisation owner)
- Supabase Auth email + password.
- Credentials are stored and hashed by Supabase (bcrypt); Kouma never handles the raw password.
- On sign-in a device fingerprint (UUID) is registered in `user_sessions`.

### Collaborator
- Supabase Auth email + **6-digit PIN** (used as the Supabase Auth password and as the key-derivation secret).
- PIN is never stored server-side. It is used client-side to derive the Key-Wrapping Key (KWK) via PBKDF2.
- Weak PINs are rejected at registration and recovery time (all-same-digit, sequential ±1).

### OTP flows (recovery)
- 6-digit OTP sent by Supabase to the user's email.
- Maximum 5 attempts; lockout for 2 minutes after the 5th failure (enforced client-side and Supabase server-side token expiry).

---

## 2. Session Management

### Session table
Every active login creates a row in `user_sessions`:

| Column | Purpose |
|---|---|
| `user_id` | FK to `profiles` |
| `device_fingerprint` | Persistent UUID in `localStorage` |
| `last_seen_at` | Updated on every API call (heartbeat) |
| `revoked` | Set to `true` to terminate the session immediately |

### Session lifetime
- Configurable per organisation via `org_security_settings.session_duration_days` (default 30 days).
- `cleanup_expired_sessions(org_id)` revokes sessions whose `last_seen_at` is older than the configured duration.

### Immediate revocation
- Admin suspending or deleting a collaborator → all that user's sessions are revoked synchronously.
- Admin demoted to member → all sessions revoked (forces re-authentication at new privilege level).

### Forced redirect on sign-out
- `AuthContext` tracks whether a real session was ever established (`wasAuthenticatedRef`).
- A `SIGNED_OUT` Supabase event from a previously authenticated state triggers a hard redirect to `/connexion`.

---

## 3. Role Model

| Role | Scope | Key permissions |
|---|---|---|
| `admin` | Organisation | Manage members, departments, settings, invitations, audit logs, recovery keys |
| `member` | Organisation | Send/receive messages, upload files, view own sessions |

**Critical invariant:** Admins **cannot** read private (`direct`) or group conversations. See [§8](#8-data-protection-boundaries).

### Promotion / demotion rules
- An organisation must always have at least one admin; demotion of the last admin is blocked at service level.
- Promotion/demotion is logged in `audit_logs` and the target user receives an in-app notification.
- Demotion revokes all of the target's sessions and removes their `org_recovery_keys` row.

---

## 4. Row-Level Security

RLS is **enabled on all 39 public tables**. No table is left open.

### Helper functions (called inside policies)
- `is_org_member(org_id uuid)` — returns true if `auth.uid()` is an active non-deleted member of that org.
- `is_org_admin(org_id uuid)` — returns true if the above is true and role = `admin`.

### Critical policy highlights

| Table | Admin access | Member access |
|---|---|---|
| `messages` | None (no SELECT policy for admins) | Own conversation members only |
| `conversation_keys` | None | Own rows only (`user_id = auth.uid()`) |
| `conversation_recovery_keys` | Own recovery keys only (as admin-member) | Participants can insert |
| `user_key_pairs` | Can read **public keys** of org peers | Can read peers' public keys; own full row |
| `audit_logs` | SELECT + INSERT | INSERT only |
| `org_security_settings` | Full CRUD | None |

---

## 5. End-to-End Encryption

### Algorithm suite

| Primitive | Algorithm | Notes |
|---|---|---|
| Key pair | ECDH P-256 | One pair per user, generated at registration |
| Symmetric encryption | AES-256-GCM | 96-bit random IV per message/file; 128-bit auth tag |
| PIN key-wrapping | PBKDF2-SHA256 | 600,000 iterations, random 16-byte salt, 256-bit output |
| ECIES key wrap | ECDH + HKDF-SHA256 + AES-256-GCM | Used to distribute conversation keys and org recovery keys |

All cryptographic operations use the **Web Crypto API** (`SubtleCrypto`). No third-party crypto library.

### Conversation key lifecycle

1. **Creation** — when a conversation is created, a fresh AES-256-GCM key (`convKey`) is generated.
2. **Distribution** — the creator wraps `convKey` with each member's ECDH public key via ECIES and writes one row per member to `conversation_keys`.
3. **Use** — on load, the member unwraps their row with their in-memory private key → `convKey` is used for all message encrypt/decrypt.
4. **No plaintext fallback** — if `convKey` cannot be unwrapped, the send is blocked and the user sees an error. Messages are never sent in the clear when E2E is expected.

### Message encryption flow

```
plaintext → AES-GCM(convKey, random_iv) → base64 ciphertext stored in messages.content
```

`messages.content_encrypted = true` distinguishes E2E messages from pre-encryption legacy rows.

### File encryption flow

```
file bytes → AES-GCM(fileKey, random_iv) → .enc blob stored in Supabase Storage
fileKey wrapped per member → stored in file_keys
```

If encryption fails (key unavailable or SubtleCrypto error), upload is **aborted** and an error is returned. No plaintext fallback.

### What is stored server-side

| Item | Server sees |
|---|---|
| Message content | AES-GCM ciphertext only |
| File content | AES-GCM ciphertext only |
| Private keys | Wrapped with PBKDF2(PIN)-derived KWK — server never sees plaintext private key |
| Conversation keys | ECIES-wrapped per recipient — server never sees plaintext convKey |
| PIN / Password | Never stored; used only for local key derivation |

### CryptoSession (in-memory state)

`CryptoSession` (`src/lib/crypto-session.ts`) holds the unwrapped ECDH private key in memory only. It is:
- Loaded on sign-in (PIN entered → PBKDF2 → unwrap private key).
- Lost on page refresh (user must re-enter PIN to reload).
- Never serialised to `localStorage`, `sessionStorage`, or cookies.

---

## 6. Key Management

### Per-user key pair

| Field | Storage location |
|---|---|
| Public key (SPKI) | `user_key_pairs.public_key` — readable by org peers |
| Private key (PKCS8, AES-GCM-wrapped) | `user_key_pairs.private_key_encrypted` |
| Wrap IV | `user_key_pairs.iv` |
| PBKDF2 salt | `user_key_pairs.salt` |

### PIN change / reset

Changing the PIN re-wraps the existing private key with a new KWK. A full PIN reset (via OTP recovery) calls `collaboratorResetPin`, which re-wraps the key with the new PIN. **Messages encrypted before the reset cannot be decrypted** — this is intentional (forward secrecy under key compromise).

### Org recovery key

Admins hold a share of the organisation's ECDH recovery key pair:

- `org_recovery_keys.encrypted_priv` — org private key wrapped with each admin's public key via ECIES.
- `org_recovery_keys.pub` — org public key (plaintext, used to wrap `conversation_recovery_keys`).

Team conversation (`type = 'team'`) keys are additionally wrapped for the org recovery key, stored in `conversation_recovery_keys`. Direct and group conversations are **never** accessible via recovery.

---

## 7. Organisation Recovery Key & Breakglass

### Normal recovery (collaborator forgets PIN)
1. User requests OTP to their email.
2. After OTP verification, user chooses a new PIN.
3. Service re-wraps the existing private key with the new KWK.

### Admin breakglass (all admins lose access)
1. Admin authenticates via OTP.
2. Admin enters the breakglass phrase (shown once at org creation, never stored).
3. Phrase is used as PBKDF2 secret to unwrap `org_recovery_keys.encrypted_priv` → org private ECDH key.
4. Org private key unwraps all `conversation_recovery_keys` rows → re-distributes team conversation keys to the recovering admin.
5. Event logged in `audit_logs` (`action = 'breakglass_used'`).

**Breakglass does not expose direct or group conversations.** Only `type = 'team'` conversations have recovery keys.

---

## 8. Data Protection Boundaries

### What admins CAN see
- Member list (name, email, job title, department, status).
- Audit logs (actions, actor, target, timestamp — no message content).
- Organisation security events.
- Announcements (org-wide broadcast messages they authored or all members can read).
- File metadata (name, uploader, date) — but **not** file content without the conversation key.
- Session list of org members (device, browser, last seen).

### What admins CANNOT see
- Content of **direct** (1:1) messages — no conversation key distributed to admins, no RLS policy grants SELECT.
- Content of **group** conversations — same as above.
- Content of **team** conversations — accessible only via breakglass, not normal admin access.
- Any user's private key (stored encrypted, server never holds plaintext).
- PIN codes — never transmitted or stored server-side.

### Technical enforcement
- `conversation_keys` RLS: `user_id = auth.uid()` — a row only exists for conversation members.
- `messages` RLS: `Message senders and receivers` policy uses a `conversation_members` EXISTS check. Admins who are not conversation members get zero rows.
- Org recovery requires explicit user action (breakglass phrase input). It is not accessible via normal API calls.

---

## 9. File & Attachment Security

### Upload validation (client-side + described in storage policy)

| Check | Value |
|---|---|
| MIME allowlist | PNG, JPEG, GIF, WebP, PDF, DOCX, XLSX, PPTX, TXT, CSV, ZIP (see `StorageService`, `DocumentService`) |
| Max file size | 50 MB (documents), 5 MB (avatars/logos) |
| Storage path | Scoped to `{orgId}/...` to match storage RLS |

### URL access
- The `attachments` bucket is **private**. Public URLs are never used.
- Files are served via signed URLs with limited expiry (1 hour for downloads, 1 year for avatars stored in `profiles.avatar_url`).
- Signed URL generation uses `supabase.storage.createSignedUrl()` server-side.

### File encryption
- Files uploaded within an E2E context are encrypted before upload (AES-256-GCM, `.enc` extension).
- File keys are distributed via ECIES to all conversation members in `file_keys`.
- Org admins who hold recovery keys can recover team file keys via breakglass.

---

## 10. Input Validation & Injection Prevention

### XSS
- React's JSX escapes all values by default. No `dangerouslySetInnerHTML` is used anywhere in the codebase.
- CSP header blocks inline scripts (`script-src 'self'`).

### URL injection
- External URLs (e.g., event links) are validated against `/^https?:\/\//i` before rendering as `<a>` tags. `javascript:` and `data:` URIs are never rendered as links.

### CSS injection
- `org.primaryColor` is validated against `/^#[0-9a-fA-F]{3,8}$/` before being applied to `document.documentElement.style`. Non-hex values are silently ignored.

### SQL injection
- All DB access uses the Supabase PostgREST client with parameterised queries. No raw SQL is executed from frontend code.

### Content-Type enforcement
- `X-Content-Type-Options: nosniff` prevents MIME sniffing.
- File uploads include explicit `contentType` in storage calls.

---

## 11. Rate Limiting & Abuse Prevention

| Surface | Limit | Lockout |
|---|---|---|
| Admin login | 5 failed attempts | 15 min (client-side; Supabase also enforces server-side) |
| Collaborator login | 5 failed attempts | 15 min (client-side) |
| OTP verification (recovery) | 5 failed attempts | 2 min (client-side) |
| PIN registration/reset | Weak PIN rejected | N/A |
| Invitation links | Reuse of valid unexpired token | One active token per org |

> Client-side rate limiting is a UX-layer defence only. The Supabase Auth server enforces its own rate limits independently.

---

## 12. HTTP Security Headers

Configured in `vercel.json` for all routes:

| Header | Value |
|---|---|
| `Content-Security-Policy` | `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://*.supabase.co; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.vapid.cloud; font-src 'self'; worker-src 'self' blob:; frame-ancestors 'none'; form-action 'self'; base-uri 'self'` |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` |
| `X-Frame-Options` | `DENY` |
| `X-Content-Type-Options` | `nosniff` |
| `X-XSS-Protection` | `1; mode=block` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=()` |

The service worker (`/sw.js`) receives `Cache-Control: no-cache` to ensure it is always fresh.

---

## 13. Security Settings (per organisation)

Stored in `org_security_settings` table (RLS: admin-only):

| Setting | Default | Effect |
|---|---|---|
| `session_duration_days` | 30 | Sessions older than this are revoked by `cleanup_expired_sessions()` |
| `invite_expiry_days` | 7 | Invitation links expire after this many days (NULL = never) |

Settings are read via `OrganizationService.getSecuritySettings()` and persisted via `saveSecuritySettings()`. They are no longer stored in `localStorage`.

---

## 14. Incident Management

### A collaborator loses their PIN
1. User navigates to `/recuperation/utilisateur`.
2. OTP sent to their email (5-attempt lockout applies).
3. After OTP, user sets a new PIN. Private key is re-wrapped with the new KWK.
4. **Past messages** in direct/group conversations become inaccessible (no recovery path by design).
5. Team conversation keys are re-distributed from the org recovery key if the admin has run breakglass.

### An admin loses all access (breakglass scenario)
1. Navigate to `/recuperation/admin`.
2. Enter email → OTP → breakglass phrase (24-word mnemonic distributed at org creation).
3. New admin credentials are set; team conversation keys are re-wrapped.
4. Event logged as `breakglass_used` in `audit_logs`.
5. Notify remaining org admins (if any) via out-of-band channel.

### A collaborator account is compromised
1. Admin navigates to Users → select user → Suspend or Revoke.
2. `UserService.updateStatus()` sets `status = 'suspended'` or `'deleted'` and revokes all `user_sessions` rows immediately.
3. The user's Supabase Auth account still exists but all sessions are marked revoked — the `AuthContext` redirect to login is triggered on next API call.
4. If needed, reset the user's PIN via the recovery flow.
5. Log in `audit_logs` (`action = 'user_suspended'` / `'user_revoked'`).

### The organisation recovery key phrase is lost
- If at least one admin can still log in: the org recovery key remains accessible — the phrase is only needed for the full breakglass flow when all admins lose access.
- If all admins lose access AND the phrase is lost: **team conversations are permanently unrecoverable**. Direct and group conversations are never recoverable by design.
- Prevention: admins should store the phrase in a hardware password manager or printed and locked in a physical safe.

### Revocation of organisation access (employee leaves)
1. Admin sets the member's status to `deleted` via Users page.
2. All `user_sessions` rows revoked immediately.
3. Member cannot re-join without a new invitation.
4. Deleted members remain visible with a grace period badge for 7 days, then are filtered from the UI.

---

## 15. Known Limitations

| Limitation | Impact | Mitigation |
|---|---|---|
| CryptoSession is lost on page refresh | User must re-enter PIN after refresh | Forced re-login via `/connexion/utilisateur` if session is still valid but crypto is not loaded |
| Client-side rate limiting only | Determined attacker can bypass UI lockout | Supabase Auth server-side limits apply; OTP expiry limits window of attack |
| PBKDF2 PIN hashing is not hardware-accelerated | Slower on low-end devices | 600k iterations is the OWASP 2024 minimum for PBKDF2-SHA256; acceptable UX on modern devices |
| Signed avatar URLs expire after 1 year | Stale URL after 1 year | Avatar re-upload renews URL; edge case for long-lived accounts |
| No server-side E2E key verification | Supabase could substitute a malicious public key | Planned: public key pinning or out-of-band fingerprint comparison |
| Payment callbacks handled client-side | Webhook spoofing possible | Planned: Supabase Edge Function `payment-webhook` as server-side handler |

---

*Last updated: 2026-07-29*
