-- ═══════════════════════════════════════════════════════════════════════════
-- 014_e2e_table_grants.sql
-- Migration 008 a créé les tables E2E mais omis les GRANT SELECT/INSERT/UPDATE/DELETE
-- pour le rôle `authenticated`. Résultat : "permission denied for table user_key_pairs"
-- lors de la création de compte (et pour toutes les autres tables E2E).
-- ═══════════════════════════════════════════════════════════════════════════

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_key_pairs              TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.org_recovery_keys           TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversation_keys           TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversation_recovery_keys  TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.file_keys                   TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.file_recovery_keys          TO authenticated;
