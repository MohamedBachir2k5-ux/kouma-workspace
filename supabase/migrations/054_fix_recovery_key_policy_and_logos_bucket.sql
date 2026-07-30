-- Two fixes in one migration:
--
-- 1. org_recovery_keys SELECT policy was created in migration 009 without an explicit
--    TO clause (PostgreSQL defaults to PUBLIC). The live DB had this fixed manually.
--    This migration makes that fix permanent and idempotent.
--
-- 2. Create a dedicated public `logos` bucket for organization logos.
--    Organization logos are identity assets, not sensitive documents.
--    Using a public bucket gives permanent URLs that never expire, replacing the
--    1-year signed URLs previously stored in organizations.logo_url from the
--    attachments bucket.

-- ── Fix 1: org_recovery_keys SELECT policy ────────────────────────────────────

-- Drop the old policy (created by migration 009 without explicit TO = {public})
DROP POLICY IF EXISTS "admin_read_all_org_recovery_keys" ON public.org_recovery_keys;
-- Drop the manually-applied version too (idempotent)
DROP POLICY IF EXISTS "Admins read all org recovery keys" ON public.org_recovery_keys;

CREATE POLICY "Admins read all org recovery keys"
  ON public.org_recovery_keys
  FOR SELECT TO authenticated
  USING (is_org_admin(organization_id));

-- ── Fix 2: logos storage bucket ───────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'logos',
  'logos',
  true,                                                    -- public: GET requests bypass RLS
  5242880,                                                 -- 5 MB max per logo
  ARRAY['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  public             = EXCLUDED.public,
  file_size_limit    = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Org admins can upload/overwrite their org's logo
CREATE POLICY "Org admins upload logos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'logos'
    AND EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.user_id = auth.uid()
        AND om.role    = 'admin'
        AND om.status  = 'active'
        AND (storage.foldername(objects.name))[1] = om.organization_id::text
    )
  );

-- Org admins can delete their org's logo
CREATE POLICY "Org admins delete logos"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'logos'
    AND EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.user_id = auth.uid()
        AND om.role    = 'admin'
        AND om.status  = 'active'
        AND (storage.foldername(objects.name))[1] = om.organization_id::text
    )
  );
