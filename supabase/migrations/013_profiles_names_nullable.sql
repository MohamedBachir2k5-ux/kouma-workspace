-- ═══════════════════════════════════════════════════════════════════════════
-- 013_profiles_names_nullable.sql
-- L'admin d'une organisation est un compte institutionnel, pas une personne.
-- firstname / lastname ne sont pas pertinents lors de l'onboarding CreateOrg.
-- On les rend nullable pour ne pas bloquer la création.
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.profiles
  ALTER COLUMN firstname DROP NOT NULL,
  ALTER COLUMN lastname  DROP NOT NULL;
