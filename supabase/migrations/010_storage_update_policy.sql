-- 010_storage_update_policy.sql
-- Adds UPDATE policy on storage.objects so upsert (avatar, logo, re-upload) works.
-- Without this, supabase.storage.upload({ upsert: true }) silently fails when
-- the file already exists because there is no UPDATE policy.

DROP POLICY IF EXISTS "Org members update own attachments" ON storage.objects;
CREATE POLICY "Org members update own attachments"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'attachments'
    AND owner = auth.uid()
  )
  WITH CHECK (
    bucket_id = 'attachments'
    AND EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.user_id = auth.uid()
        AND om.status = 'active'
        AND (storage.foldername(name))[1] = om.organization_id::text
    )
  );
