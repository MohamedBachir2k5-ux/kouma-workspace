-- Migration 064: Fix team_member_permissions and user_sessions raw EXISTS
-- Same root cause as 061/062/063: raw EXISTS(organization_members) triggers RLS
-- evaluation chain that can silently return false for legitimate users.
-- Fix: replace with is_org_admin() SECURITY DEFINER.

-- ── team_member_permissions: admin VIEW policy ─────────────────────────────
DROP POLICY IF EXISTS "Admins view all team member permissions" ON public.team_member_permissions;
CREATE POLICY "Admins view all team member permissions"
  ON public.team_member_permissions FOR SELECT TO authenticated
  USING (
    public.is_org_admin(
      (SELECT organization_id FROM public.teams WHERE id = team_member_permissions.team_id)
    )
  );

-- ── team_member_permissions: admin MANAGE (ALL) policy ────────────────────
DROP POLICY IF EXISTS "Admins manage all team member permissions" ON public.team_member_permissions;
CREATE POLICY "Admins manage all team member permissions"
  ON public.team_member_permissions FOR ALL TO authenticated
  USING (
    public.is_org_admin(
      (SELECT organization_id FROM public.teams WHERE id = team_member_permissions.team_id)
    )
  )
  WITH CHECK (
    public.is_org_admin(
      (SELECT organization_id FROM public.teams WHERE id = team_member_permissions.team_id)
    )
  );

-- ── user_sessions: admin view org members' sessions ───────────────────────
DROP POLICY IF EXISTS "Admins view org sessions" ON public.user_sessions;
CREATE POLICY "Admins view org sessions"
  ON public.user_sessions FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.user_id = user_sessions.user_id
        AND om.status = 'active'
        AND public.is_org_admin(om.organization_id)
    )
  );
