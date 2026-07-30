-- Migration 057: Pentest fix — suspended user message access + security hardening
--
-- FIX 1: Suspended/deleted users must not read or send messages.
--   Previously, message policies only checked conversation_members membership.
--   A suspended user kept their conversation_members entries → full message access.
--   Fix: join conversations to also verify is_org_member() which checks status='active'.

DROP POLICY IF EXISTS "Message senders and receivers" ON public.messages;
CREATE POLICY "Message senders and receivers" ON public.messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversation_members cm
      JOIN conversations c ON c.id = cm.conversation_id
      WHERE cm.conversation_id = messages.conversation_id
        AND cm.user_id = auth.uid()
        AND is_org_member(c.organization_id)
    )
  );

DROP POLICY IF EXISTS "Send messages" ON public.messages;
CREATE POLICY "Send messages" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM conversation_members cm
      JOIN conversations c ON c.id = cm.conversation_id
      WHERE cm.conversation_id = messages.conversation_id
        AND cm.user_id = auth.uid()
        AND is_org_member(c.organization_id)
    )
  );

-- FIX 2 (pending Bachir decision): Admin plan bypass via subscriptions UPDATE.
--   "Admins update subscription" policy allows full UPDATE with no column restriction.
--   Admin can self-set plan='enterprise', status='active' without billing.
--   Documented in report — awaiting decision between Option A (drop UPDATE policy)
--   and Option B (trigger to block plan/status/amount columns).
