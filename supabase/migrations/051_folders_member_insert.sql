-- Allow all org members to create folders (not just admins).
-- Admins retain full management (UPDATE/DELETE) via the existing "Manage folders" policy.
CREATE POLICY "Members insert folders"
  ON folders
  FOR INSERT
  WITH CHECK (is_org_member(organization_id));
