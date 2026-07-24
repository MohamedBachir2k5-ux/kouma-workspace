-- Allow any admin in an org to SELECT all org_recovery_keys rows
-- (needed for: breakglass recovery + reading bg_* fields during key distribution)
-- INSERT/UPDATE/DELETE remain restricted to own row via the existing ALL policy.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'org_recovery_keys'
      AND policyname = 'admin_read_all_org_recovery_keys'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "admin_read_all_org_recovery_keys"
        ON public.org_recovery_keys
        FOR SELECT
        USING (is_org_admin(organization_id));
    $policy$;
  END IF;
END $$;
