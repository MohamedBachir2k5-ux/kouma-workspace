-- Migration 028: Create missing tables identified in audit
--
-- 1. event_reminders     — rappels planifiés pour les événements
-- 2. announcements       — annonces de l'admin à l'organisation
-- 3. announcement_reads  — lecture par utilisateur (tracking)
-- 4. document_access_logs — journal d'accès aux documents

-- ── 1. event_reminders ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.event_reminders (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id     uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  remind_at    timestamptz NOT NULL,
  sent         boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS event_reminders_event_id_idx    ON public.event_reminders (event_id);
CREATE INDEX IF NOT EXISTS event_reminders_user_id_idx     ON public.event_reminders (user_id);
CREATE INDEX IF NOT EXISTS event_reminders_remind_at_idx   ON public.event_reminders (remind_at) WHERE sent = false;

ALTER TABLE public.event_reminders ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_reminders TO authenticated;

-- Own reminders only
CREATE POLICY "Own event reminders" ON public.event_reminders
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ── 2. announcements ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.announcements (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  author_id       uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title           text NOT NULL,
  body            text NOT NULL,
  pinned          boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz
);

CREATE INDEX IF NOT EXISTS announcements_organization_id_idx ON public.announcements (organization_id, created_at DESC);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.announcements TO authenticated;

-- All org members can read
CREATE POLICY "Org members view announcements" ON public.announcements
  FOR SELECT TO authenticated
  USING (is_org_member(organization_id));

-- Only admins can create / edit / delete
CREATE POLICY "Admins manage announcements" ON public.announcements
  FOR ALL TO authenticated
  USING (is_org_admin(organization_id))
  WITH CHECK (is_org_admin(organization_id));

-- ── 3. announcement_reads ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.announcement_reads (
  announcement_id uuid NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  read_at         timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (announcement_id, user_id)
);

CREATE INDEX IF NOT EXISTS announcement_reads_user_id_idx ON public.announcement_reads (user_id);

ALTER TABLE public.announcement_reads ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, DELETE ON public.announcement_reads TO authenticated;

-- User can only manage their own reads
CREATE POLICY "Own announcement reads" ON public.announcement_reads
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admins can see who read what
CREATE POLICY "Admins view reads" ON public.announcement_reads
  FOR SELECT TO authenticated
  USING (is_org_admin(
    (SELECT organization_id FROM public.announcements WHERE id = announcement_id)
  ));

-- ── 4. document_access_logs ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.document_access_logs (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  user_id     uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  action      text NOT NULL DEFAULT 'download',
  accessed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS document_access_logs_document_id_idx ON public.document_access_logs (document_id);
CREATE INDEX IF NOT EXISTS document_access_logs_org_id_idx      ON public.document_access_logs (organization_id, accessed_at DESC);

ALTER TABLE public.document_access_logs ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT ON public.document_access_logs TO authenticated;

-- Any org member can insert a log (tracks their own access)
CREATE POLICY "Insert own access log" ON public.document_access_logs
  FOR INSERT TO authenticated
  WITH CHECK (is_org_member(organization_id));

-- Only admins can query access logs
CREATE POLICY "Admins view access logs" ON public.document_access_logs
  FOR SELECT TO authenticated
  USING (is_org_admin(organization_id));
