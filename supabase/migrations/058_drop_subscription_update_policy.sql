-- Migration 058: Drop admin UPDATE policy on subscriptions (billing bypass fix)
--
-- An org admin could PATCH plan='enterprise', status='active' directly via REST API
-- without any payment, because "Admins update subscription" allowed full UPDATE
-- with no column restrictions. Confirmed exploitable via real REST API call.
--
-- Plan/status/amount must only be written by service_role (billing webhook).
-- No admin UI currently needs direct subscription mutation → zero functional regression.
DROP POLICY IF EXISTS "Admins update subscription" ON public.subscriptions;
