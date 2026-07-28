-- Migration 023: Fix infinite recursion in team_members RLS
--
-- Root cause: "Team owners manage members" (FOR ALL) has
--   USING: is_team_owner_or_admin(team_id)
-- is_team_owner_or_admin queries team_members. PostgreSQL uses SESSION_USER
-- (the authenticated role, no BYPASSRLS) to evaluate RLS inside SECURITY DEFINER
-- functions when FORCE ROW LEVEL SECURITY = false. This means accessing
-- team_members from within a team_members policy triggers the policies again
-- → infinite recursion.
--
-- Similarly, "Team creator becomes first owner" has a NOT EXISTS subquery
-- on team_members from within a team_members policy — same risk.
--
-- Fix: replace both with policies that check tables OTHER than team_members:
--   • teams.owner_id = auth.uid()  (queries teams, not team_members)
--   • is_org_admin(org_id)         (queries organization_members, not team_members)

-- Remove recursive policies
DROP POLICY IF EXISTS "Team owners manage members"      ON public.team_members;
DROP POLICY IF EXISTS "Team creator becomes first owner" ON public.team_members;

-- Team owner can manage their team's members
-- Uses teams.owner_id instead of querying team_members → no recursion
CREATE POLICY "Team owner manages members"
  ON public.team_members FOR ALL TO authenticated
  USING (
    (SELECT owner_id FROM public.teams WHERE id = team_id) = auth.uid()
  )
  WITH CHECK (
    (SELECT owner_id FROM public.teams WHERE id = team_id) = auth.uid()
  );
