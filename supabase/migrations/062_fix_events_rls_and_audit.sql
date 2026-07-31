-- Migration 062: Fix events table RLS + files UPDATE policy
--
-- Root cause: events INSERT/SELECT policies use raw EXISTS on organization_members
-- instead of is_org_member() SECURITY DEFINER. Same pattern that was causing
-- silent RLS blocks on storage attachments (fixed in 061).
-- When organization_members RLS is evaluated inside a raw EXISTS, it re-enters
-- its own SELECT policy, creating an evaluation chain that can return false.
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

-- ── files: add missing UPDATE policy ──────────────────────────────────────────
DROP POLICY IF EXISTS "Update own files" ON public.files;
CREATE POLICY "Update own files"
  ON public.files FOR UPDATE TO authenticated
  USING (owner_id = auth.uid() AND public.is_org_member(organization_id));
