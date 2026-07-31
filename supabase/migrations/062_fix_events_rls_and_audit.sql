-- Migration 062: Fix events table RLS + comprehensive policy audit
--
-- Root cause: events INSERT/SELECT policies use raw EXISTS on organization_members
-- instead of is_org_member() SECURITY DEFINER. Same pattern that was causing
-- silent RLS blocks on storage attachments (fixed in 061).
-- When organization_members RLS is evaluated inside a raw EXISTS, it re-enters
-- its own SELECT policy, creating an evaluation chain that can return false
-- under certain conditions.
--
-- Fix: replace all raw EXISTS(organization_members) with is_org_member() directly.

-- ── events: fix INSERT policy ──────────────────────────────────────────────────
DROP POLICY IF EXISTS "Members create events" ON public.events;
CREATE POLICY "Members create events"
  ON public.events FOR INSERT TO authenticated
  WITH CHECK (
    events.created_by = auth.uid()
    AND public.is_org_member(events.organization_id)
  );

-- ── events: fix SELECT policy ──────────────────────────────────────────────────
DROP POLICY IF EXISTS "Members view their events" ON public.events;
CREATE POLICY "Members view their events"
  ON public.events FOR SELECT TO authenticated
  USING (
    public.is_org_member(events.organization_id)
    AND (
      events.created_by = auth.uid()
      OR auth.uid() = ANY(events.participants)
      OR public.is_org_admin(events.organization_id)
    )
  );

-- ── files: ensure UPDATE policy exists (missing from initial schema) ──────────
DROP POLICY IF EXISTS "Update own files" ON public.files;
CREATE POLICY "Update own files"
  ON public.files FOR UPDATE TO authenticated
  USING (owner_id = auth.uid() AND public.is_org_member(organization_id));

-- ── meeting_participants: add missing INSERT policy ────────────────────────────
-- The meetings table has SELECT only; participants can't be added without this.
DROP POLICY IF EXISTS "Org members join meetings" ON public.meeting_participants;
CREATE POLICY "Org members join meetings"
  ON public.meeting_participants FOR INSERT TO authenticated
  WITH CHECK (
    public.is_org_member(
      (SELECT organization_id FROM public.meetings WHERE id = meeting_id)
    )
  );

-- ── notifications: ensure members can insert notifications for themselves ──────
-- "Own notifications" FOR ALL covers INSERT when user_id = auth.uid(),
-- but server-side triggers need no policy (SECURITY DEFINER). Already covered.
-- No change needed here.
