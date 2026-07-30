-- Fix 1: message_reactions was missing UPDATE grant.
-- The RLS policy is FOR ALL (covers UPDATE) but GRANT didn't include UPDATE.
-- Upsert/toggle reactions failed with "permission denied for table".
GRANT UPDATE ON public.message_reactions TO authenticated;
