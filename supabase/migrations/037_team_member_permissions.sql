-- Per-member permissions within a team (granted by team responsable)
CREATE TABLE IF NOT EXISTS team_member_permissions (
  team_id        uuid REFERENCES teams(id) ON DELETE CASCADE,
  member_id      uuid REFERENCES profiles(id) ON DELETE CASCADE,
  permission_key text NOT NULL,
  granted        boolean NOT NULL DEFAULT false,
  updated_at     timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (team_id, member_id, permission_key)
);

ALTER TABLE team_member_permissions ENABLE ROW LEVEL SECURITY;

-- Team members can view their own permissions
CREATE POLICY "Members view own team permissions"
  ON team_member_permissions FOR SELECT TO authenticated
  USING (member_id = auth.uid());

-- Team responsable can view all member permissions for their team
CREATE POLICY "Responsable views all team member permissions"
  ON team_member_permissions FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM teams t WHERE t.id = team_id AND t.owner_id = auth.uid()
    )
  );

-- Admins can view all
CREATE POLICY "Admins view all team member permissions"
  ON team_member_permissions FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      JOIN teams t ON t.organization_id = om.organization_id
      WHERE t.id = team_member_permissions.team_id
        AND om.user_id = auth.uid()
        AND om.role = 'admin'
    )
  );

-- Team responsable can manage permissions for their team members
CREATE POLICY "Responsable manages team member permissions"
  ON team_member_permissions FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM teams t WHERE t.id = team_id AND t.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM teams t WHERE t.id = team_id AND t.owner_id = auth.uid()
    )
  );

-- Admins can manage all
CREATE POLICY "Admins manage all team member permissions"
  ON team_member_permissions FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      JOIN teams t ON t.organization_id = om.organization_id
      WHERE t.id = team_member_permissions.team_id
        AND om.user_id = auth.uid()
        AND om.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members om
      JOIN teams t ON t.organization_id = om.organization_id
      WHERE t.id = team_member_permissions.team_id
        AND om.user_id = auth.uid()
        AND om.role = 'admin'
    )
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON team_member_permissions TO authenticated;
