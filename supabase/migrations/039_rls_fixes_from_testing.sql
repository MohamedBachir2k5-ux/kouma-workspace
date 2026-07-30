-- Corrections issues détectées pendant les tests utilisateurs (28 juil. 2026)

-- 1. team_permissions : les admins org ne pouvaient pas écrire les permissions
--    lors de la création d'une équipe (bloqué car non membres de l'équipe)
DROP POLICY IF EXISTS "Team owners set permissions" ON public.team_permissions;
CREATE POLICY "Team owners and org admins manage permissions"
  ON public.team_permissions FOR ALL TO authenticated
  USING (
    public.is_team_owner_or_admin(team_id)
    OR public.is_org_admin((SELECT organization_id FROM public.teams WHERE id = team_id))
  )
  WITH CHECK (
    public.is_team_owner_or_admin(team_id)
    OR public.is_org_admin((SELECT organization_id FROM public.teams WHERE id = team_id))
  );

-- 2. user_sessions : l'index unique partiel (WHERE device_fingerprint IS NOT NULL)
--    est incompatible avec ON CONFLICT (user_id, device_fingerprint) de PostgREST.
--    On le remplace par une contrainte unique complète.
DROP INDEX IF EXISTS public.user_sessions_user_device_uidx;
ALTER TABLE public.user_sessions
  ADD CONSTRAINT user_sessions_user_device_unique
  UNIQUE (user_id, device_fingerprint);

-- 3. announcement_reads : le grant UPDATE manquait, empêchant le upsert
--    (ON CONFLICT DO UPDATE nécessite UPDATE)
GRANT UPDATE ON public.announcement_reads TO authenticated;

-- 4. conversation_keys : politique UPDATE manquante — le upsert de clés E2E
--    lors de la création d'une conversation directe était bloqué
CREATE POLICY "Conversation members update own keys"
  ON public.conversation_keys FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
