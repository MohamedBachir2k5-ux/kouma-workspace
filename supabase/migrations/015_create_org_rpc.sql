-- ═══════════════════════════════════════════════════════════════════════════
-- 015_create_org_rpc.sql
-- RPC SECURITY DEFINER : création atomique org + admin fondateur + abonnement.
-- Avantage : une seule transaction, aucune dépendance aux policies RLS
-- individuelles, impossible de laisser une org sans membre ou sans abonnement.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.create_organization_with_admin(
  p_name        text,
  p_email       text,
  p_phone       text        DEFAULT NULL,
  p_website     text        DEFAULT NULL,
  p_country     text        DEFAULT 'Guinée',
  p_city        text        DEFAULT NULL,
  p_currency    text        DEFAULT 'XOF',
  p_language    text        DEFAULT 'fr',
  p_sector      text        DEFAULT NULL,
  p_admin_id    uuid        DEFAULT NULL,   -- auth.uid() si NULL
  p_trial_days  integer     DEFAULT 15,
  p_plan        text        DEFAULT 'starter'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id    uuid;
  v_org_id      uuid;
  v_amount      numeric;
  v_discount    integer;
  v_trial_end   timestamptz;
BEGIN
  -- Résoudre l'identité de l'admin fondateur
  v_admin_id := COALESCE(p_admin_id, auth.uid());
  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Utilisateur non authentifié.';
  END IF;

  -- Vérifier que le profil existe
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_admin_id) THEN
    RAISE EXCEPTION 'Profil introuvable pour cet utilisateur.';
  END IF;

  -- Montant et remise par devise/plan (valeurs par défaut conservatrices)
  SELECT
    CASE p_currency
      WHEN 'GNF' THEN CASE p_plan WHEN 'starter' THEN 250000 ELSE 500000 END
      WHEN 'XOF' THEN CASE p_plan WHEN 'starter' THEN 35000  ELSE 75000  END
      ELSE             CASE p_plan WHEN 'starter' THEN 49     ELSE 99     END
    END,
    30  -- remise lancement 30%
  INTO v_amount, v_discount;

  v_trial_end := now() + (p_trial_days || ' days')::interval;

  -- 1. Créer l'organisation
  INSERT INTO public.organizations (
    name, email, phone, website, country, city,
    currency, language, sector, plan, logo_url
  ) VALUES (
    p_name, p_email, p_phone, p_website, p_country, p_city,
    p_currency, p_language, p_sector, p_plan, NULL
  )
  RETURNING id INTO v_org_id;

  -- 2. Ajouter l'admin fondateur comme membre admin actif
  INSERT INTO public.organization_members (organization_id, user_id, role, status)
  VALUES (v_org_id, v_admin_id, 'admin', 'active');

  -- 3. Créer l'abonnement d'essai
  INSERT INTO public.subscriptions (
    organization_id, plan, status, currency,
    amount, trial_ends_at, discount_percent
  ) VALUES (
    v_org_id, p_plan, 'trial', p_currency,
    v_amount, v_trial_end, v_discount
  );

  -- 4. Journal d'audit
  INSERT INTO public.audit_logs (organization_id, user_id, action, target_name)
  VALUES (v_org_id, v_admin_id, 'organization_created', p_name);

  RETURN v_org_id;
END;
$$;

-- Seul le rôle authenticated peut appeler cette fonction
REVOKE ALL ON FUNCTION public.create_organization_with_admin FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_organization_with_admin TO authenticated;
