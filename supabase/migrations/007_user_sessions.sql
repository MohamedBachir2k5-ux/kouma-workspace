-- ── User sessions tracking ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  device_name   text,
  browser       text,
  platform      text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  last_seen_at  timestamptz NOT NULL DEFAULT now(),
  revoked       boolean NOT NULL DEFAULT false
);

-- Index for fast lookups by user
CREATE INDEX IF NOT EXISTS user_sessions_user_id_idx ON public.user_sessions(user_id);

-- ── RLS ──────────────────────────────────────────────────────────────────────
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Each user sees only their own sessions
CREATE POLICY "Users view own sessions"
  ON public.user_sessions FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Each user can insert their own sessions
CREATE POLICY "Users insert own sessions"
  ON public.user_sessions FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Each user can update their own sessions (last_seen_at, revoked)
CREATE POLICY "Users update own sessions"
  ON public.user_sessions FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- Each user can delete their own sessions
CREATE POLICY "Users delete own sessions"
  ON public.user_sessions FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Admins can view sessions of org members
CREATE POLICY "Admins view org sessions"
  ON public.user_sessions FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      JOIN public.organization_members om2 ON om2.organization_id = om.organization_id
      WHERE om.user_id = auth.uid()
        AND om.role = 'admin'
        AND om2.user_id = user_sessions.user_id
    )
  );
