-- Org-level security settings (replaces localStorage-only storage)
CREATE TABLE IF NOT EXISTS org_security_settings (
  organization_id    uuid    NOT NULL PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
  invite_expiry_days integer           DEFAULT 7,   -- NULL = never expire
  session_duration_days integer NOT NULL DEFAULT 30,
  updated_at         timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE org_security_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage security settings"
  ON org_security_settings FOR ALL TO authenticated
  USING  (is_org_admin(organization_id))
  WITH CHECK (is_org_admin(organization_id));

GRANT ALL ON org_security_settings TO authenticated;

-- Revoke user_sessions older than session_duration_days for a given org
CREATE OR REPLACE FUNCTION cleanup_expired_sessions(p_org_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_days integer;
BEGIN
  SELECT session_duration_days INTO v_days
  FROM org_security_settings
  WHERE organization_id = p_org_id;

  IF v_days IS NULL THEN
    RETURN; -- no setting yet; do nothing
  END IF;

  UPDATE user_sessions us
  SET    revoked = true
  FROM   organization_members om
  WHERE  om.organization_id = p_org_id
    AND  om.user_id = us.user_id
    AND  us.revoked = false
    AND  us.last_seen_at < (now() - (v_days || ' days')::interval);
END;
$$;

GRANT EXECUTE ON FUNCTION cleanup_expired_sessions(uuid) TO authenticated;
