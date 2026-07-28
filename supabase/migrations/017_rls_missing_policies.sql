-- ═══════════════════════════════════════════════════════════════════════════
-- 017_rls_missing_policies.sql
-- Trois bugs RLS détectés après audit complet (migrations 001-016).
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Bug 1 : user_sessions — admin ne peut pas révoquer les sessions d'un membre ──
-- UserService.demoteAdmin() appelle :
--   .update({ revoked: true }).eq('user_id', targetUserId)
-- La seule policy UPDATE existante est USING (user_id = auth.uid()),
-- donc un admin qui révoque les sessions de quelqu'un d'autre est silencieusement bloqué.
-- Conséquence sécurité : après une rétrogradation, l'ex-admin garde ses sessions actives.

CREATE POLICY "Admins revoke org member sessions"
  ON public.user_sessions FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.organization_members om_admin
      JOIN public.organization_members om_target
        ON om_target.organization_id = om_admin.organization_id
      WHERE om_admin.user_id  = auth.uid()
        AND om_admin.role     = 'admin'
        AND om_admin.status   = 'active'
        AND om_target.user_id = user_sessions.user_id
        AND om_target.status != 'deleted'
    )
  )
  WITH CHECK (revoked = true);
-- WITH CHECK (revoked = true) : un admin ne peut que révoquer, pas modifier d'autres champs.

-- ── Bug 2 : subscriptions — UPDATE bloqué après paiement réussi ─────────────────
-- PaymentService.handleCallback() fait :
--   subscriptions.update({ status: 'active', start_date, end_date })
-- Il n'existait aucune policy UPDATE sur subscriptions → bloqué silencieusement.

CREATE POLICY "Admins update subscription"
  ON public.subscriptions FOR UPDATE TO authenticated
  USING  (public.is_org_admin(organization_id))
  WITH CHECK (public.is_org_admin(organization_id));

-- ── Bug 3 : payments — INSERT et UPDATE bloqués ──────────────────────────────────
-- PaymentService.createPayment() (appelé depuis Settings.tsx) insère un enregistrement
-- pending dans payments. Seule la policy "Admins view payments" (SELECT) existait.
-- L'UPDATE du provider_reference et du status après retour prestataire était aussi bloqué.

CREATE POLICY "Admins insert payment"
  ON public.payments FOR INSERT TO authenticated
  WITH CHECK (public.is_org_admin(organization_id));

CREATE POLICY "Admins update payment"
  ON public.payments FOR UPDATE TO authenticated
  USING  (public.is_org_admin(organization_id))
  WITH CHECK (public.is_org_admin(organization_id));
