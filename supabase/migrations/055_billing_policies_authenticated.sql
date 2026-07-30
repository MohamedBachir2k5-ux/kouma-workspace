-- Principle of least privilege: billing data must never be accessible to
-- anonymous or unauthenticated roles, even if anon auth is later enabled.
-- Migration 001 created these two SELECT policies without an explicit TO clause
-- (PostgreSQL default = PUBLIC). This migration replaces them with TO authenticated.
--
-- Functional behavior is unchanged: is_org_admin() still restricts reads to
-- org admins only. The change eliminates the dependency on anon auth being disabled.

DROP POLICY IF EXISTS "Admins view subscription" ON public.subscriptions;
CREATE POLICY "Admins view subscription"
  ON public.subscriptions
  FOR SELECT TO authenticated
  USING (is_org_admin(organization_id));

DROP POLICY IF EXISTS "Admins view payments" ON public.payments;
CREATE POLICY "Admins view payments"
  ON public.payments
  FOR SELECT TO authenticated
  USING (is_org_admin(organization_id));
