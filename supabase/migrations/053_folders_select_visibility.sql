-- Fix folder SELECT: personal folders must only be visible to their creator.
-- Migration 052 added the visibility column (default 'personal') and created_by,
-- but did not update the "Org folders" SELECT policy, leaving personal folders
-- exposed to all org members.

DROP POLICY IF EXISTS "Org folders" ON public.folders;

-- Personal folders: only visible to creator.
-- Org folders: visible to all active org members.
CREATE POLICY "Folders select by visibility"
  ON public.folders FOR SELECT TO authenticated
  USING (
    (visibility = 'personal' AND created_by = auth.uid())
    OR (visibility = 'org'      AND is_org_member(organization_id))
  );
