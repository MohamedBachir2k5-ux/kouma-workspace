-- ── Messages: add files column ──────────────────────────────────────────────
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS files text[] DEFAULT NULL;

-- ── Realtime: publish messages table ────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;
END $$;

-- ── Storage: attachments bucket policies (org isolation) ─────────────────────
-- Path convention: {org_id}/{conversation_id}/{filename}
-- foldername(name)[1] = org_id, foldername(name)[2] = conversation_id

DROP POLICY IF EXISTS "Org members upload attachments" ON storage.objects;
CREATE POLICY "Org members upload attachments"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'attachments'
    AND EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.user_id = auth.uid()
        AND om.status = 'active'
        AND (storage.foldername(name))[1] = om.organization_id::text
    )
  );

DROP POLICY IF EXISTS "Org members read attachments" ON storage.objects;
CREATE POLICY "Org members read attachments"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'attachments'
    AND EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.user_id = auth.uid()
        AND om.status = 'active'
        AND (storage.foldername(name))[1] = om.organization_id::text
    )
  );

DROP POLICY IF EXISTS "Org members delete own attachments" ON storage.objects;
CREATE POLICY "Org members delete own attachments"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'attachments'
    AND owner = auth.uid()
  );
