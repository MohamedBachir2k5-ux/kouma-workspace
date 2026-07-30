-- Standalone actions created from the AI assistant (not linked to meeting minutes)
CREATE TABLE IF NOT EXISTS assistant_actions (
  id              uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by      uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  description     text        NOT NULL,
  due_date        date,
  done            boolean     NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS assistant_actions_org_idx ON assistant_actions (organization_id);
CREATE INDEX IF NOT EXISTS assistant_actions_user_idx ON assistant_actions (created_by);

ALTER TABLE assistant_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view own org actions"
  ON assistant_actions FOR SELECT TO authenticated
  USING (is_org_member(organization_id));

CREATE POLICY "Members create own actions"
  ON assistant_actions FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid() AND is_org_member(organization_id));

CREATE POLICY "Creator updates own actions"
  ON assistant_actions FOR UPDATE TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Creator deletes own actions"
  ON assistant_actions FOR DELETE TO authenticated
  USING (created_by = auth.uid());
