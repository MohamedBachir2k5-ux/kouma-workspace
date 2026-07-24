-- ── Events table ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title           text NOT NULL,
  description     text,
  location        text,
  external_link   text,
  start_at        timestamptz NOT NULL,
  end_at          timestamptz NOT NULL,
  participants    uuid[] NOT NULL DEFAULT '{}',
  created_by      uuid NOT NULL REFERENCES public.profiles(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  status          text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'modified', 'cancelled', 'done')),
  modified_at     timestamptz,
  cancel_reason   text
);

-- ── RLS ──────────────────────────────────────────────────────────────────────
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Org members see events they created or are participants of
CREATE POLICY "Members view their events"
  ON public.events FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = events.organization_id
        AND om.user_id = auth.uid()
        AND om.status != 'deleted'
    )
    AND (
      events.created_by = auth.uid()
      OR auth.uid() = ANY(events.participants)
      OR is_org_admin(events.organization_id)
    )
  );

-- Org members can create events
CREATE POLICY "Members create events"
  ON public.events FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = events.organization_id
        AND om.user_id = auth.uid()
        AND om.status = 'active'
    )
    AND events.created_by = auth.uid()
  );

-- Creator or admin can update
CREATE POLICY "Creator or admin updates events"
  ON public.events FOR UPDATE TO authenticated
  USING (
    events.created_by = auth.uid()
    OR is_org_admin(events.organization_id)
  );

-- Creator or admin can delete
CREATE POLICY "Creator or admin deletes events"
  ON public.events FOR DELETE TO authenticated
  USING (
    events.created_by = auth.uid()
    OR is_org_admin(events.organization_id)
  );

-- ── Realtime ──────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'events'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
  END IF;
END $$;
