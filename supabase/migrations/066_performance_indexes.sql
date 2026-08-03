-- Migration 066: Add missing indexes for hot query paths
-- reply_to_id lookup (FK used when rendering reply-quote previews)
CREATE INDEX IF NOT EXISTS messages_reply_to_id_idx
  ON public.messages(reply_to_id)
  WHERE reply_to_id IS NOT NULL;

-- message_reactions: fast lookup of all reactions for a given message
-- (the PK covers (message_id, user_id, emoji) but a standalone message_id index
--  avoids a full PK scan when counting reactions per message)
CREATE INDEX IF NOT EXISTS message_reactions_message_id_idx
  ON public.message_reactions(message_id);

-- notifications: unread count per user is a hot path (polled on every page load)
CREATE INDEX IF NOT EXISTS notifications_user_unread_idx
  ON public.notifications(user_id, read, created_at DESC)
  WHERE NOT read;
