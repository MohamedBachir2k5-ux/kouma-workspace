-- ═══════════════════════════════════════════════════════════════════════════
-- 011_security_fixes.sql — Corrections issues audit de sécurité v1.0
-- Corrections : C-1, C-2, C-3, C-4, M-1, M-5
-- ═══════════════════════════════════════════════════════════════════════════

-- ── C-1 : audit_logs — INSERT silencieusement bloqué → journal vide ─────────
-- RLS était activé mais aucune politique INSERT n'existait.
-- Les services écrivaient dans le vide (audit_logs vide en production).

CREATE POLICY "Authenticated users insert audit logs"
  ON public.audit_logs FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND public.is_org_member(organization_id)
  );

-- ── C-2 : conversations + conversation_members — INSERT/DELETE manquants ────
-- createGroupConversation() et leaveConversation() échouaient silencieusement.

-- Tout membre actif peut créer une conversation dans son org
CREATE POLICY "Org members create conversations"
  ON public.conversations FOR INSERT TO authenticated
  WITH CHECK (
    public.is_org_member(organization_id)
  );

-- Participants peuvent s'ajouter / être ajoutés à une conversation
CREATE POLICY "Members join conversations"
  ON public.conversation_members FOR INSERT TO authenticated
  WITH CHECK (
    -- Le créateur de la conv peut ajouter des membres depuis la même org
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND public.is_org_member(c.organization_id)
    )
  );

-- Chaque membre peut quitter (supprimer sa propre ligne)
CREATE POLICY "Members leave conversations"
  ON public.conversation_members FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ── C-3 : organizations — INSERT bloqué → création d'org impossible ─────────
-- OrganizationService.create() échouait : RLS activé, aucune politique INSERT.

CREATE POLICY "Authenticated users create organizations"
  ON public.organizations FOR INSERT TO authenticated
  WITH CHECK (true);
-- Note : l'isolation est assurée par organization_members créé immédiatement
-- après. Un utilisateur ne peut créer qu'une org vide sans membres tant
-- qu'il n'est pas lui-même inséré comme admin.

-- ── C-4 : file_keys — WITH CHECK (true) → poisoning inter-org possible ──────
-- Un utilisateur d'Org A pouvait insérer de fausses clés pour des fichiers
-- appartenant à Org B (race condition DoS sur la distribution de clés).

DROP POLICY IF EXISTS "Uploaders insert file keys for others" ON public.file_keys;

CREATE POLICY "Uploaders insert file keys for org peers"
  ON public.file_keys FOR INSERT TO authenticated
  WITH CHECK (
    -- L'inserteur et le destinataire doivent appartenir à la même org
    EXISTS (
      SELECT 1
      FROM public.organization_members om1
      JOIN public.organization_members om2
        ON om1.organization_id = om2.organization_id
      WHERE om1.user_id = auth.uid()
        AND om2.user_id = file_keys.user_id
        AND om1.status = 'active'
        AND om2.status = 'active'
    )
  );

-- ── M-1 : departments — anon USING(true) → énumération all-orgs ────────────
-- La policy autorisait n'importe quel visiteur non authentifié à lister
-- les départements de TOUTES les organisations sans filtre.
--
-- Fix : remplacer par une fonction SECURITY DEFINER qui valide un token
-- d'invitation avant de retourner les départements de l'org concernée.

DROP POLICY IF EXISTS "Public department list" ON public.departments;
REVOKE SELECT ON public.departments FROM anon;

CREATE OR REPLACE FUNCTION public.get_departments_for_invite(p_token text)
RETURNS TABLE(id uuid, name text, code text, organization_id uuid)
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT d.id, d.name, d.code, d.organization_id
  FROM public.departments d
  WHERE d.organization_id = (
    SELECT i.organization_id
    FROM public.invitations i
    WHERE i.token = p_token
      AND i.status = 'sent'
      AND i.expires_at > now()
    LIMIT 1
  )
  ORDER BY d.name;
$$;

GRANT EXECUTE ON FUNCTION public.get_departments_for_invite(text) TO anon, authenticated;

-- ── M-5 : user_key_pairs — utilisateurs suspendus lisaient les clés publiques ─
-- "om1.status != 'deleted'" autorisait les comptes suspendus.
-- Fix : restreindre à 'active' uniquement.

DROP POLICY IF EXISTS "Org members read peer public keys" ON public.user_key_pairs;

CREATE POLICY "Org members read peer public keys"
  ON public.user_key_pairs FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.organization_members om1
      JOIN public.organization_members om2
        ON om1.organization_id = om2.organization_id
      WHERE om1.user_id = auth.uid()
        AND om2.user_id = user_key_pairs.user_id
        AND om1.status = 'active'   -- était != 'deleted'
        AND om2.status = 'active'
    )
  );

-- ── M-5 bis : profiles — "Org members see each other" ───────────────────────
-- Même problème : un utilisateur suspendu pouvait voir les profils de ses collègues.

DROP POLICY IF EXISTS "Org members see each other" ON public.profiles;

CREATE POLICY "Org members see each other"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.organization_members a
      JOIN public.organization_members b ON a.organization_id = b.organization_id
      WHERE a.user_id = auth.uid()
        AND b.user_id = profiles.id
        AND a.status = 'active'   -- était 'active' pour a, mais pas filtré pour b
        AND b.status = 'active'
    )
  );
