-- 1. Per-user notification preferences (persisted in DB instead of localStorage)
CREATE TABLE IF NOT EXISTS user_notification_preferences (
  user_id   uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  org_id    uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  type      text NOT NULL,
  push      boolean NOT NULL DEFAULT true,
  inapp     boolean NOT NULL DEFAULT true,
  PRIMARY KEY (user_id, org_id, type)
);

ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own notification prefs"
  ON user_notification_preferences FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

GRANT ALL ON user_notification_preferences TO authenticated;

-- 2. Org customization: primary brand color
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS primary_color text DEFAULT NULL;

-- 3. Notification-type check
ALTER TABLE user_notification_preferences
  ADD CONSTRAINT valid_notif_type CHECK (
    type IN ('new_message', 'meeting_invite', 'team_update', 'announcement', 'document_shared')
  );
