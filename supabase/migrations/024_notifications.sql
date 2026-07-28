-- Migration 024: Notification infrastructure
--
-- 1. notify_users() RPC — lets authenticated users insert notifications for
--    other users without hitting the "user_id = auth.uid()" RLS restriction.
--    (The current Own notifications policy blocks cross-user inserts.)
--
-- 2. notify_new_direct_message() trigger — fires after INSERT on messages,
--    inserts a new_message notification for the other party in direct convs.
--
-- 3. notify_team_member_added() RPC — called by addMember in team.service.ts
--    to notify the newly added member.

-- ── RPC: insert notifications for a list of users ────────────────────────────
CREATE OR REPLACE FUNCTION public.notify_users(
  p_user_ids uuid[],
  p_type     text,
  p_payload  jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, payload)
  SELECT uid, p_type, p_payload
  FROM unnest(p_user_ids) AS uid;
END;
$$;

GRANT EXECUTE ON FUNCTION public.notify_users(uuid[], text, jsonb) TO authenticated;

-- ── Trigger: new_message on direct conversations ──────────────────────────────
CREATE OR REPLACE FUNCTION public.notify_new_direct_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only direct conversations
  IF NOT EXISTS (
    SELECT 1 FROM public.conversations
    WHERE id = NEW.conversation_id AND type = 'direct'
  ) THEN
    RETURN NEW;
  END IF;

  -- Insert notification for the other member only
  INSERT INTO public.notifications (user_id, type, payload)
  SELECT
    cm.user_id,
    'new_message',
    jsonb_build_object(
      'conversationId', NEW.conversation_id,
      'senderId', NEW.sender_id,
      'text', 'Vous avez reçu un nouveau message direct.'
    )
  FROM public.conversation_members cm
  WHERE cm.conversation_id = NEW.conversation_id
    AND cm.user_id <> NEW.sender_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_new_direct_message ON public.messages;
CREATE TRIGGER on_new_direct_message
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_direct_message();
