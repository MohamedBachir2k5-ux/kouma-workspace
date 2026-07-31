-- Migration 061: Fix attachments bucket storage policies
-- Root cause: the INSERT/SELECT/UPDATE policies query organization_members directly
-- via a raw EXISTS clause. organization_members itself has RLS, creating a potential
-- evaluation chain that can resolve to false under certain conditions.
-- Fix: use is_org_member() SECURITY DEFINER function directly — it bypasses RLS
-- on organization_members by design (see migration 022).

DROP POLICY IF EXISTS "Org members upload attachments" ON storage.objects;
CREATE POLICY "Org members upload attachments"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'attachments'
    AND public.is_org_member((storage.foldername(name))[1]::uuid)
  );

DROP POLICY IF EXISTS "Org members read attachments" ON storage.objects;
CREATE POLICY "Org members read attachments"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'attachments'
    AND public.is_org_member((storage.foldername(name))[1]::uuid)
  );

DROP POLICY IF EXISTS "Org members delete own attachments" ON storage.objects;
CREATE POLICY "Org members delete own attachments"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'attachments'
    AND owner = auth.uid()
  );

DROP POLICY IF EXISTS "Org members update own attachments" ON storage.objects;
CREATE POLICY "Org members update own attachments"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'attachments'
    AND owner = auth.uid()
  )
  WITH CHECK (
    bucket_id = 'attachments'
    AND public.is_org_member((storage.foldername(name))[1]::uuid)
  );
