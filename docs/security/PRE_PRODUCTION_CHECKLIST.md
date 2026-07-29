# Kouma — Pre-Production Security Checklist

Run this checklist before every major release and before go-live with an enterprise customer.

---

## Database & RLS

- [ ] RLS is enabled on every table in `public` schema
      ```sql
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public' AND NOT rowsecurity;
      -- must return 0 rows
      ```
- [ ] Each sensitive table has at least one restrictive policy (no `USING (true)` catch-alls)
- [ ] `is_org_member()` and `is_org_admin()` helper functions are `SECURITY DEFINER` with fixed `search_path`
- [ ] All SECURITY DEFINER RPCs that do cross-table operations are reviewed (no privilege escalation)
- [ ] `org_security_settings` table exists and has admin-only RLS
- [ ] Cross-org data leak test: JWT of org A cannot SELECT rows belonging to org B for all critical tables (messages, conversation_keys, files, profiles)

---

## Authentication

- [ ] Admin login has 5-attempt / 15-minute lockout (AdminLogin.tsx + Supabase server-side)
- [ ] Collaborator login has 5-attempt / 15-minute lockout (UserLogin.tsx)
- [ ] OTP recovery has 5-attempt / 2-minute lockout (AdminRecovery.tsx, CollaboratorRecovery.tsx)
- [ ] Weak PIN (all-same, sequential ±1) is rejected at registration (JoinOrg.tsx) and reset (CollaboratorRecovery.tsx)
- [ ] SIGNED_OUT Supabase event redirects user to /connexion (AuthContext.tsx)
- [ ] Device fingerprint is registered in user_sessions on every login

---

## End-to-End Encryption

- [ ] No plaintext fallback: `message.service.ts send()` returns error when crypto fails, never sends plaintext
- [ ] No plaintext fallback: `document.service.ts upload()` returns error when encryption fails, never uploads plaintext
- [ ] No plaintext fallback: `storage.service.ts upload()` (attachment in Messages) returns error when crypto fails
- [ ] CryptoSession (`src/lib/crypto-session.ts`) is never serialised to localStorage, sessionStorage, or cookie
- [ ] Conversation key is unwrapped via ECIES from the user's own private key — server never holds plaintext convKey
- [ ] Direct and group conversations have NO recovery path (confirmed: no rows in conversation_recovery_keys for type != 'team')
- [ ] `content_encrypted = true` is set on all messages where E2E encryption was applied

---

## Key Management

- [ ] User private keys are stored only as AES-GCM(PBKDF2(PIN)) ciphertext in user_key_pairs
- [ ] PBKDF2 uses 600,000 iterations and a random 16-byte salt
- [ ] Org recovery key private is stored only as ECIES-wrapped ciphertext in org_recovery_keys
- [ ] Breakglass flow correctly re-keys team conversations and logs `breakglass_used` in audit_logs
- [ ] Demotion of an admin removes their row from org_recovery_keys

---

## Session Security

- [ ] Suspending a user revokes all user_sessions rows immediately
- [ ] Deleting (revoking) a user revokes all user_sessions rows immediately
- [ ] Demoting an admin revokes all their sessions
- [ ] cleanup_expired_sessions(org_id) correctly uses session_duration_days from org_security_settings
- [ ] org_security_settings.session_duration_days is persisted to DB (not localStorage)
- [ ] org_security_settings.invite_expiry_days is persisted to DB and used by UserService.invite()

---

## File & Attachment Security

- [ ] MIME allowlist enforced: only permitted types accepted (PNG, JPEG, GIF, WebP, PDF, DOCX, XLSX, PPTX, TXT, CSV, ZIP)
- [ ] Max file size enforced: 50 MB for documents, 5 MB for avatars/logos
- [ ] All file downloads use signed URLs (no public bucket URLs)
- [ ] Storage paths are org-scoped (`{orgId}/...`) to match storage RLS
- [ ] Avatar upload validates MIME and size before upload (UserService.uploadAvatar)
- [ ] Logo upload validates MIME and size before upload (OrganizationService.uploadLogo)

---

## Input Validation & Injection

- [ ] No `dangerouslySetInnerHTML` in any component
- [ ] External URLs validated against `/^https?:\/\//i` before rendering as links (Agenda.tsx)
- [ ] `primaryColor` validated against `/^#[0-9a-fA-F]{3,8}$/` before applying as CSS variable (AuthContext.tsx)
- [ ] No raw SQL in frontend — all queries use Supabase parameterised client

---

## HTTP Security Headers (vercel.json)

- [ ] `Content-Security-Policy` — `script-src 'self'` (no unsafe-eval, no external scripts)
- [ ] `Strict-Transport-Security` with preload and includeSubDomains
- [ ] `X-Frame-Options: DENY`
- [ ] `X-Content-Type-Options: nosniff`
- [ ] `Referrer-Policy: strict-origin-when-cross-origin`
- [ ] `Permissions-Policy` disables camera, microphone, geolocation, payment

---

## Admin Privilege Boundaries

- [ ] Admin has no SELECT on messages table for conversations they are not a member of
- [ ] Admin has no SELECT on conversation_keys for conversations they are not a member of
- [ ] Admin cannot read another user's private key (user_key_pairs — only own row + peers' public keys)
- [ ] Org recovery key access requires explicit breakglass phrase — not available via normal API
- [ ] Self-action guard: admin cannot suspend/revoke/demote their own account via the UI
- [ ] Last admin guard: demoting the sole admin is blocked

---

## Audit Logging

- [ ] All sensitive actions produce an audit_logs row: invite_generated, user_activated, user_suspended, user_revoked, admin_promoted, admin_demoted, recovery_initiated, recovery_completed, breakglass_used
- [ ] Audit logs are INSERT-only for authenticated users; SELECT is admin-only (via RLS)
- [ ] Audit log entries include: organization_id, user_id (actor), action, target_id, target_type, target_name

---

## Secrets & Configuration

- [ ] No secrets or API keys committed to the repository
- [ ] `.env` is in `.gitignore`
- [ ] `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are the only client-side env vars — anon key is safe to expose (RLS is the access control layer)
- [ ] Service role key is never used client-side
- [ ] Push notification VAPID keys are server-side only

---

## Pending (pre-production blockers)

- [ ] **Payment webhook**: implement `supabase/functions/payment-webhook/` Edge Function to replace client-side `PaymentService.handleCallback()`. A server-side handler prevents webhook spoofing.
- [ ] **Session cleanup cron**: implement `supabase/functions/session-cleanup/` Edge Function (pg_cron or Supabase scheduled function) that calls `cleanup_expired_sessions()` daily per org.
- [ ] **Public key pinning**: out-of-band mechanism for users to verify their peers' ECDH public key fingerprints, preventing a compromised Supabase instance from substituting keys.

---

*Last updated: 2026-07-29*
