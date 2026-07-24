-- ═══════════════════════════════════════════════════════════════════════════
-- 012_missing_insert_policies.sql
-- Corrige les blocages RLS qui rendaient les flux utilisateur impossibles.
-- Toutes les politiques ci-dessous sont des "bootstrap" ou des cas légitimes
-- non couverts par les policies FOR ALL existantes.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. organization_members : admin fondateur ─────────────────────────────
-- Problème : "Org admins manage members" utilise is_org_admin() comme WITH CHECK.
-- Lors de la création d'org, le fondateur n'est pas encore admin (aucun membre).
-- is_org_admin() retourne false → INSERT bloqué → création d'org impossible.
--
-- Fix : autoriser un utilisateur à s'insérer comme admin si l'org n'a
-- encore aucun membre (bootstrap).

CREATE POLICY "Founding admin bootstraps org membership"
  ON public.organization_members FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND role = 'admin'
    AND status = 'active'
    AND NOT EXISTS (
      SELECT 1 FROM public.organization_members existing
      WHERE existing.organization_id = organization_members.organization_id
    )
  );

-- ── 2. organization_members : membre invité rejoint ───────────────────────
-- Problème : lors de UserService.acceptInvite(), le futur membre n'est pas encore
-- dans organization_members → is_org_admin() false → INSERT bloqué.
--
-- Fix : autoriser l'auto-insertion comme 'member' si une invitation valide existe.

CREATE POLICY "Invited member self-joins org"
  ON public.organization_members FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND role = 'member'
    AND status = 'active'
    AND EXISTS (
      SELECT 1 FROM public.invitations i
      WHERE i.organization_id = organization_members.organization_id
        AND i.status = 'sent'
        AND i.expires_at > now()
    )
  );

-- ── 3. subscriptions : création de l'abonnement essai ────────────────────
-- Problème : OrganizationService.startTrial() insère dans subscriptions
-- mais il n'existe aucune policy INSERT → bloqué silencieusement.
-- À ce stade, l'admin est déjà dans organization_members → is_org_admin() = true.

CREATE POLICY "Org admins insert subscription"
  ON public.subscriptions FOR INSERT TO authenticated
  WITH CHECK (
    public.is_org_admin(organization_id)
  );

-- ── 4. team_members : premier membre (owner) ─────────────────────────────
-- Problème : TeamService.create() insère l'owner dans team_members après la
-- création de l'équipe. "Team owners manage members" USING is_team_owner_or_admin()
-- → false (personne dans l'équipe encore) → INSERT bloqué.
--
-- Fix : autoriser l'auto-insertion comme 'owner' si l'équipe est vide.

CREATE POLICY "Team creator becomes first owner"
  ON public.team_members FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND role = 'owner'
    AND NOT EXISTS (
      SELECT 1 FROM public.team_members existing
      WHERE existing.team_id = team_members.team_id
    )
  );

-- ── 5. invitations : le membre marque l'invitation comme acceptée ─────────
-- Problème : UserService.acceptInvite() fait UPDATE invitations SET status='accepted'.
-- La policy existante "Admins manage invitations" est réservée aux admins.
-- Le membre venant d'être créé n'est pas admin → UPDATE bloqué.
--
-- Fix : un membre actif de l'org peut passer son invitation de 'sent' à 'accepted'.

CREATE POLICY "New member marks invitation accepted"
  ON public.invitations FOR UPDATE TO authenticated
  USING (
    status = 'sent'
    AND expires_at > now()
    AND EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = invitations.organization_id
        AND om.user_id = auth.uid()
        AND om.status = 'active'
    )
  )
  WITH CHECK (status = 'accepted');

-- ── 6. file_recovery_keys : membres peuvent créer l'escrow ───────────────
-- Problème : KeyService.initFileKey() essaie d'insérer dans file_recovery_keys
-- pour les uploads de membres (non-admin). "Admins manage file recovery keys"
-- est réservée aux admins → INSERT bloqué silencieusement pour les membres.
-- Conséquence : les fichiers uploadés par les membres ne sont pas récupérables
-- via breakglass.

CREATE POLICY "Org members insert file recovery keys"
  ON public.file_recovery_keys FOR INSERT TO authenticated
  WITH CHECK (
    public.is_org_member(organization_id)
  );
