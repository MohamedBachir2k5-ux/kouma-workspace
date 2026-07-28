-- Stable device fingerprint prevents duplicate session rows on page reload.
-- Supabase fires SIGNED_IN when restoring a session from localStorage, not just on actual login.
-- Without a stable key, every page reload inserts a new row.
ALTER TABLE user_sessions ADD COLUMN IF NOT EXISTS device_fingerprint text;

CREATE UNIQUE INDEX IF NOT EXISTS user_sessions_user_device_uidx
  ON user_sessions (user_id, device_fingerprint)
  WHERE device_fingerprint IS NOT NULL;
