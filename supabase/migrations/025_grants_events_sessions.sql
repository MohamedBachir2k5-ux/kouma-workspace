-- Migration 025: Grant missing table-level permissions
--
-- events and user_sessions were accessible via RLS policies but the
-- underlying table-level GRANTs for the authenticated role were missing,
-- causing a 403 "permission denied for table X" before RLS even ran.

GRANT SELECT, INSERT, UPDATE, DELETE ON public.events TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_sessions TO authenticated;
