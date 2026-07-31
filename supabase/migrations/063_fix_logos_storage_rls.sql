-- Migration 063: Fix logos bucket storage policies
-- Same raw EXISTS pattern as attachments (fixed in 061) — replace with
-- is_org_admin() SECURITY DEFINER to avoid RLS chain evaluation failures.

DROP POLICY IF EXISTS "Org admins upload logos" ON storage.objects;
CREATE POLICY "Org admins upload logos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'logos'
    AND public.is_org_admin((storage.foldername(name))[1]::uuid)
  );

DROP POLICY IF EXISTS "Org admins delete logos" ON storage.objects;
CREATE POLICY "Org admins delete logos"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'logos'
    AND public.is_org_admin((storage.foldername(name))[1]::uuid)
  );

-- Add missing SELECT policy for logos bucket (public bucket but good practice)
DROP POLICY IF EXISTS "Anyone reads logos" ON storage.objects;
CREATE POLICY "Anyone reads logos"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'logos');
