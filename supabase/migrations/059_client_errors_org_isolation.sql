-- Migration 059: Fix 2 issues found in post-pentest audit of new modules
--
-- ISSUE 1 (MAJOR): client_errors has no organization_id — any admin of any org
--   can read error logs (messages, URLs, stack traces) of all other orgs.
--   Confirmed exploitable: T11 in cross-org test — admin B read Org A error log
--   including URL with query params. Fix: add organization_id, scope RLS,
--   update log_client_error RPC to auto-derive org from caller's membership.
--
-- ISSUE 2 (MINOR): assistant_actions missing GRANT to authenticated role.
--   RLS policies were correct but table-level grant was absent, blocking all
--   legitimate use via PostgREST. Fix: grant the required DML privileges.

-- ── Fix 1 : scope client_errors to organization ──────────────────────────────

ALTER TABLE client_errors
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS client_errors_org_idx ON client_errors (organization_id);

-- Drop the too-broad admin policy and replace with org-scoped one
DROP POLICY IF EXISTS "Admins read client errors" ON client_errors;

CREATE POLICY "Org admins read own org errors"
  ON client_errors FOR SELECT TO authenticated
  USING (is_org_admin(organization_id));

-- Rewrite log_client_error to look up and store the caller's organization.
-- Uses LIMIT 1 — in this app, users belong to exactly one active org.
CREATE OR REPLACE FUNCTION public.log_client_error(
  p_message    text,
  p_stack      text    DEFAULT NULL,
  p_url        text    DEFAULT NULL,
  p_user_agent text    DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id uuid;
BEGIN
  SELECT organization_id INTO v_org_id
  FROM organization_members
  WHERE user_id = auth.uid()
    AND status = 'active'
  LIMIT 1;

  INSERT INTO client_errors(user_id, organization_id, message, stack, url, user_agent)
  VALUES (
    auth.uid(),
    v_org_id,
    left(p_message, 500),
    left(p_stack, 2000),
    left(p_url, 300),
    left(p_user_agent, 300)
  );
EXCEPTION WHEN OTHERS THEN
  NULL; -- never raise from error handler
END;
$$;

-- ── Fix 2 : grant DML to authenticated on assistant_actions ──────────────────

GRANT SELECT, INSERT, UPDATE, DELETE ON assistant_actions TO authenticated;
