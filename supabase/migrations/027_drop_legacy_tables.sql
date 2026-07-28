-- Migration 027: Drop legacy tables (meetings, meeting_participants, groups, group_members)
--
-- These tables have 0 rows and are not referenced by any service.
-- The app uses events + events.participants[] instead of meetings,
-- and conversations instead of groups.

DROP TABLE IF EXISTS public.meeting_participants CASCADE;
DROP TABLE IF EXISTS public.meetings CASCADE;
DROP TABLE IF EXISTS public.group_members CASCADE;
DROP TABLE IF EXISTS public.groups CASCADE;
