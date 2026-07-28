-- =========================================================
-- 029 — Production fixes: search_path, last_read_at, rsvp,
--       team permissions alignment, unread counts RPC
-- =========================================================

-- 1. Fix missing search_path on SECURITY DEFINER functions
ALTER FUNCTION public.get_departments_for_invite(text) SET search_path = public;
ALTER FUNCTION public.handle_new_user()              SET search_path = public;
ALTER FUNCTION public.is_group_admin_fn(uuid)        SET search_path = public;
ALTER FUNCTION public.is_group_member_fn(uuid)       SET search_path = public;
ALTER FUNCTION public.is_team_member(uuid)           SET search_path = public;

-- 2. Add last_read_at to conversation_members for unread tracking
ALTER TABLE public.conversation_members
  ADD COLUMN IF NOT EXISTS last_read_at TIMESTAMPTZ DEFAULT now();

-- Index for fast unread queries
CREATE INDEX IF NOT EXISTS conversation_members_last_read_idx
  ON public.conversation_members (user_id, conversation_id, last_read_at);

-- 3. Add rsvp jsonb to events for accept/decline
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS rsvp JSONB NOT NULL DEFAULT '{}'::jsonb;

-- 4. Align team_permissions: seed the 4 UI-visible keys for teams that
--    don't already have them (covers legacy teams created before this fix).
INSERT INTO public.team_permissions (team_id, permission_name, enabled)
SELECT t.id, perm.name, true
FROM public.teams t
CROSS JOIN (VALUES
  ('invite_members'),
  ('manage_documents'),
  ('manage_events'),
  ('admin_space')
) AS perm(name)
WHERE NOT EXISTS (
  SELECT 1 FROM public.team_permissions tp
  WHERE tp.team_id = t.id AND tp.permission_name = perm.name
);

-- Remove the old mismatched keys that were seeded before (send_messages,
-- upload_files, view_members) — they are no longer used in the UI.
-- We keep them if the row count == 3 exactly (i.e. only those 3 were
-- present, meaning the team had no UI permissions yet). If a team
-- already has the 4 UI keys we do nothing extra.
DELETE FROM public.team_permissions
WHERE permission_name IN ('send_messages', 'upload_files', 'view_members')
  AND NOT EXISTS (
    SELECT 1 FROM public.team_permissions tp2
    WHERE tp2.team_id = team_permissions.team_id
      AND tp2.permission_name = 'invite_members'
  );

-- 5. RPC: get unread counts per conversation for one user
CREATE OR REPLACE FUNCTION public.get_unread_counts(p_user_id uuid, p_org_id uuid)
RETURNS TABLE(conversation_id uuid, unread_count bigint)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    cm.conversation_id,
    COUNT(m.id)::bigint AS unread_count
  FROM conversation_members cm
  LEFT JOIN messages m
    ON  m.conversation_id = cm.conversation_id
    AND m.sender_id        != p_user_id
    AND m.created_at        > COALESCE(cm.last_read_at, '1970-01-01'::timestamptz)
  WHERE cm.user_id = p_user_id
    AND cm.conversation_id IN (
      SELECT id FROM conversations WHERE organization_id = p_org_id
    )
  GROUP BY cm.conversation_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_unread_counts(uuid, uuid) TO authenticated;

-- 6. RPC: mark conversation as read for one user
CREATE OR REPLACE FUNCTION public.mark_conversation_read(p_conversation_id uuid, p_user_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE conversation_members
  SET    last_read_at = now()
  WHERE  conversation_id = p_conversation_id
    AND  user_id         = p_user_id;
$$;

GRANT EXECUTE ON FUNCTION public.mark_conversation_read(uuid, uuid) TO authenticated;
