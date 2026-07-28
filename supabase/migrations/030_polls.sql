-- =========================================================
-- 030 — Polls: tables, RLS, GRANTs
-- =========================================================

-- 1. polls table
CREATE TABLE IF NOT EXISTS public.polls (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id   uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  organization_id   uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  creator_id        uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  question          text NOT NULL,
  multiple_choice   boolean NOT NULL DEFAULT false,
  ends_at           timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- 2. poll_options table
CREATE TABLE IF NOT EXISTS public.poll_options (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id   uuid NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  text      text NOT NULL,
  position  smallint NOT NULL DEFAULT 0
);

-- 3. poll_votes table
CREATE TABLE IF NOT EXISTS public.poll_votes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id    uuid NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  option_id  uuid NOT NULL REFERENCES public.poll_options(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (poll_id, option_id, user_id)
);

-- 4. Indexes
CREATE INDEX IF NOT EXISTS polls_conversation_id_idx     ON public.polls (conversation_id);
CREATE INDEX IF NOT EXISTS poll_options_poll_id_idx      ON public.poll_options (poll_id);
CREATE INDEX IF NOT EXISTS poll_votes_poll_id_idx        ON public.poll_votes (poll_id);
CREATE INDEX IF NOT EXISTS poll_votes_user_poll_idx      ON public.poll_votes (user_id, poll_id);

-- 5. Enable RLS
ALTER TABLE public.polls        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_votes   ENABLE ROW LEVEL SECURITY;

-- 6. polls RLS — conversation members can view and create
DROP POLICY IF EXISTS "Conversation members view polls"   ON public.polls;
DROP POLICY IF EXISTS "Conversation members create polls" ON public.polls;

CREATE POLICY "Conversation members view polls" ON public.polls
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_members cm
      WHERE cm.conversation_id = polls.conversation_id
        AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Conversation members create polls" ON public.polls
  FOR INSERT
  WITH CHECK (
    creator_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.conversation_members cm
      WHERE cm.conversation_id = polls.conversation_id
        AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Creator deletes poll" ON public.polls
  FOR DELETE
  USING (creator_id = auth.uid());

-- 7. poll_options RLS — same conversation members
DROP POLICY IF EXISTS "Conversation members view poll options" ON public.poll_options;
DROP POLICY IF EXISTS "Poll creator manages options"          ON public.poll_options;

CREATE POLICY "Conversation members view poll options" ON public.poll_options
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.polls p
      JOIN public.conversation_members cm ON cm.conversation_id = p.conversation_id
      WHERE p.id = poll_options.poll_id
        AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Poll creator manages options" ON public.poll_options
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.polls p
      WHERE p.id = poll_options.poll_id
        AND p.creator_id = auth.uid()
    )
  );

-- 8. poll_votes RLS — own votes only
DROP POLICY IF EXISTS "Own votes" ON public.poll_votes;

CREATE POLICY "Own votes" ON public.poll_votes
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Conversation members view all votes" ON public.poll_votes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.polls p
      JOIN public.conversation_members cm ON cm.conversation_id = p.conversation_id
      WHERE p.id = poll_votes.poll_id
        AND cm.user_id = auth.uid()
    )
  );

-- 9. GRANTs
GRANT SELECT, INSERT, DELETE ON public.polls        TO authenticated;
GRANT SELECT, INSERT         ON public.poll_options TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.poll_votes   TO authenticated;
