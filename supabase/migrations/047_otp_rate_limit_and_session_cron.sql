-- ── R-03 : OTP server-side rate limiting ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS otp_attempts (
  id         uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email      text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS otp_attempts_email_created_idx ON otp_attempts (email, created_at);

-- No RLS needed — this table is only accessed via the SECURITY DEFINER function below.
-- Direct access is blocked by default (no policies = deny all via RLS).
ALTER TABLE otp_attempts ENABLE ROW LEVEL SECURITY;

-- Returns NULL when the request is allowed; returns an error string when rate-limited.
-- Cleans up entries older than 10 minutes on every call to keep the table small.
CREATE OR REPLACE FUNCTION check_otp_rate_limit(p_email text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
  v_window interval := interval '2 minutes';
  v_max    integer  := 5;
BEGIN
  -- Purge stale entries first (older than 10 minutes)
  DELETE FROM otp_attempts WHERE created_at < now() - interval '10 minutes';

  -- Count recent attempts for this email
  SELECT COUNT(*) INTO v_count
  FROM otp_attempts
  WHERE email = lower(trim(p_email))
    AND created_at >= now() - v_window;

  IF v_count >= v_max THEN
    RETURN 'Trop de tentatives. Attendez 2 minutes avant de réessayer.';
  END IF;

  -- Record this attempt
  INSERT INTO otp_attempts (email) VALUES (lower(trim(p_email)));

  RETURN NULL; -- allowed
END;
$$;

-- Grant to anon so unauthenticated recovery pages can call it
GRANT EXECUTE ON FUNCTION check_otp_rate_limit(text) TO anon, authenticated;


-- ── R-02 : Automatic session cleanup via pg_cron ───────────────────────────────
-- pg_cron is available on Supabase cloud. This migration enables it and schedules
-- a daily job that calls cleanup_expired_sessions() for every active organisation.
-- On local Supabase CLI the extension is not loaded — the DO block catches that
-- gracefully so the migration still applies without error.

DO $$
BEGIN
  -- Try to enable pg_cron; ignore if unavailable (local dev)
  CREATE EXTENSION IF NOT EXISTS pg_cron;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pg_cron not available in this environment — skipping cron job setup.';
END;
$$;

-- Wrapper called by the cron job — iterates every active org
CREATE OR REPLACE FUNCTION cleanup_all_org_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT id FROM organizations LOOP
    PERFORM cleanup_expired_sessions(r.id);
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION cleanup_all_org_sessions() TO authenticated;

-- Only schedule if pg_cron is loaded (Supabase cloud). Silently skipped on local dev.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- Remove previous version if it exists
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'kouma-session-cleanup') THEN
      PERFORM cron.unschedule('kouma-session-cleanup');
    END IF;
    PERFORM cron.schedule(
      'kouma-session-cleanup',
      '0 3 * * *',
      'SELECT cleanup_all_org_sessions()'
    );
    RAISE NOTICE 'pg_cron job "kouma-session-cleanup" scheduled (daily at 03:00 UTC).';
  END IF;
END;
$$;
