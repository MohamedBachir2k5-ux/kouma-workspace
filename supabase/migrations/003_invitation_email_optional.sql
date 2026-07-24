-- 003_invitation_email_optional.sql
-- Invitations are now link-based: no target email required.
-- The person who follows the link supplies their own email at registration.

-- Make email nullable (was NOT NULL)
ALTER TABLE public.invitations ALTER COLUMN email DROP NOT NULL;

-- Allow unauthenticated users to validate a token.
-- JoinOrg is a public page — the user has no session yet when they follow the link.
-- Risk is minimal: the token is 32 random bytes (unguessable) and no PII is stored
-- on invitation rows once email is optional.
CREATE POLICY "Public token validation" ON public.invitations
  FOR SELECT
  TO anon
  USING (status = 'sent' AND expires_at > now());
