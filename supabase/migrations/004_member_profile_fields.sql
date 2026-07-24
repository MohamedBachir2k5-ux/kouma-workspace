-- 004_member_profile_fields.sql
-- Adds per-membership department assignment and job title.
-- Adds anon SELECT on departments so the JoinOrg public page can load the org's dept list.

ALTER TABLE public.organization_members
  ADD COLUMN IF NOT EXISTS department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS job_title text;

-- JoinOrg is a public page — the user has no session when picking their department.
-- Department names are non-sensitive org metadata (Finance, RH, IT…).
GRANT SELECT ON public.departments TO anon;

CREATE POLICY "Public department list" ON public.departments
  FOR SELECT
  TO anon
  USING (true);
