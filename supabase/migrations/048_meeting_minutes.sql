-- Meeting minutes — linked to event + conversation + participants
CREATE TABLE IF NOT EXISTS meeting_minutes (
  id              uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id        uuid        NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  organization_id uuid        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  conversation_id uuid        REFERENCES conversations(id) ON DELETE SET NULL,
  created_by      uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title           text        NOT NULL,
  objective       text,
  summary         text,
  decisions       text,
  notes           text,
  participants    uuid[]      NOT NULL DEFAULT '{}',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS meeting_minutes_event_idx ON meeting_minutes (event_id);
CREATE INDEX IF NOT EXISTS meeting_minutes_org_idx   ON meeting_minutes (organization_id);

ALTER TABLE meeting_minutes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members view minutes"
  ON meeting_minutes FOR SELECT TO authenticated
  USING (is_org_member(organization_id));

CREATE POLICY "Org members create minutes"
  ON meeting_minutes FOR INSERT TO authenticated
  WITH CHECK (is_org_member(organization_id) AND created_by = auth.uid());

CREATE POLICY "Creator or admin updates minutes"
  ON meeting_minutes FOR UPDATE TO authenticated
  USING (created_by = auth.uid() OR is_org_admin(organization_id));

CREATE POLICY "Creator or admin deletes minutes"
  ON meeting_minutes FOR DELETE TO authenticated
  USING (created_by = auth.uid() OR is_org_admin(organization_id));

GRANT ALL ON meeting_minutes TO authenticated;

-- Action items linked to meeting minutes
CREATE TABLE IF NOT EXISTS meeting_actions (
  id          uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  minutes_id  uuid        NOT NULL REFERENCES meeting_minutes(id) ON DELETE CASCADE,
  description text        NOT NULL,
  assignee_id uuid        REFERENCES profiles(id) ON DELETE SET NULL,
  due_date    date,
  done        boolean     NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS meeting_actions_minutes_idx ON meeting_actions (minutes_id);

ALTER TABLE meeting_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members view actions"
  ON meeting_actions FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM meeting_minutes mm
    WHERE mm.id = meeting_actions.minutes_id AND is_org_member(mm.organization_id)
  ));

CREATE POLICY "Org members create actions"
  ON meeting_actions FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM meeting_minutes mm
    WHERE mm.id = meeting_actions.minutes_id AND is_org_member(mm.organization_id)
  ));

CREATE POLICY "Creator or admin manages actions"
  ON meeting_actions FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM meeting_minutes mm
    WHERE mm.id = meeting_actions.minutes_id
      AND (mm.created_by = auth.uid() OR is_org_admin(mm.organization_id))
  ));

CREATE POLICY "Creator or admin deletes actions"
  ON meeting_actions FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM meeting_minutes mm
    WHERE mm.id = meeting_actions.minutes_id
      AND (mm.created_by = auth.uid() OR is_org_admin(mm.organization_id))
  ));

GRANT ALL ON meeting_actions TO authenticated;

-- Audit log entries for meeting minutes
INSERT INTO audit_logs (organization_id, user_id, action, target_type, target_name)
SELECT null::uuid, null::uuid, null, null, null
WHERE false; -- just validate that the table exists (no-op)
