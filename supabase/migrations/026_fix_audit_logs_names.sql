-- Migration 026: Fix audit log target_name gaps
--
-- 1. accept_member_invite: add firstname+lastname to user_joined target_name
-- 2. Add indexes on conversations(organization_id, reference_id) and events.participants GIN

-- ── Fix accept_member_invite: store user name in target_name ─────────────────
CREATE OR REPLACE FUNCTION public.accept_member_invite(
  p_token         text,
  p_user_id       uuid,
  p_department_id uuid DEFAULT NULL,
  p_job_title     text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id  uuid;
  v_name    text;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
    RETURN jsonb_build_object('error', 'Opération non autorisée.');
  END IF;

  SELECT organization_id INTO v_org_id
  FROM public.invitations
  WHERE token = p_token AND status = 'sent' AND expires_at > now()
  LIMIT 1;

  IF v_org_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Lien d''invitation invalide ou expiré.');
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE user_id = p_user_id AND organization_id = v_org_id
  ) THEN
    RETURN jsonb_build_object('error', 'Vous êtes déjà membre de cette organisation.');
  END IF;

  INSERT INTO public.organization_members (
    organization_id, user_id, role, status, department_id, job_title
  ) VALUES (
    v_org_id, p_user_id, 'member', 'active',
    p_department_id, p_job_title
  );

  -- Fetch user display name for the audit log
  SELECT COALESCE(TRIM(COALESCE(firstname, '') || ' ' || COALESCE(lastname, '')), email)
  INTO v_name
  FROM public.profiles
  WHERE id = p_user_id;

  INSERT INTO public.audit_logs (organization_id, user_id, action, target_id, target_type, target_name)
  VALUES (v_org_id, p_user_id, 'user_joined', p_user_id, 'user', COALESCE(v_name, ''));

  -- Notify org admins
  INSERT INTO public.notifications (user_id, type, payload)
  SELECT
    om.user_id,
    'member_joined',
    jsonb_build_object(
      'userId', p_user_id,
      'text', COALESCE(v_name, 'Un collaborateur') || ' a rejoint l''organisation.'
    )
  FROM public.organization_members om
  WHERE om.organization_id = v_org_id
    AND om.role  = 'admin'
    AND om.status = 'active';

  RETURN jsonb_build_object('error', null);
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_member_invite(text, uuid, uuid, text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.accept_member_invite(text, uuid, uuid, text) FROM anon;

-- ── Indexes manquants ─────────────────────────────────────────────────────────

-- conversations: filtrées par organization_id dans getConversations()
CREATE INDEX IF NOT EXISTS conversations_organization_id_idx
  ON public.conversations (organization_id);

-- conversations: recherche par reference_id dans getTeamConversationId()
CREATE INDEX IF NOT EXISTS conversations_reference_id_idx
  ON public.conversations (reference_id)
  WHERE reference_id IS NOT NULL;

-- events: .contains('participants', [userId]) requiert un GIN sur le ARRAY
CREATE INDEX IF NOT EXISTS events_participants_gin_idx
  ON public.events USING GIN (participants);

-- events: filtrage par organization_id
CREATE INDEX IF NOT EXISTS events_organization_id_idx
  ON public.events (organization_id);
