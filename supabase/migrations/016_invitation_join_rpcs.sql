-- ─── Migration 016: invitation join RPCs ──────────────────────────────────────
-- The invitations table has admin-only RLS. These SECURITY DEFINER functions
-- bypass RLS so the join flow works regardless of the caller's session state.

-- 1. Validate a token and return the organisation_id (null = invalid or expired)
create or replace function public.get_org_for_invite(p_token text)
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select organization_id
  from public.invitations
  where token = p_token
    and status = 'sent'
    and expires_at > now()
  limit 1;
$$;

-- Accessible by both anonymous (fresh link open) and authenticated users
grant execute on function public.get_org_for_invite(text) to anon, authenticated;

-- ─────────────────────────────────────────────────────────────────────────────

-- 2. Accept an invitation and join the organisation
create or replace function public.accept_member_invite(
  p_token         text,
  p_user_id       uuid,
  p_department_id uuid default null,
  p_job_title     text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
begin
  -- Caller must be the user being added (prevents impersonation)
  if auth.uid() is null or auth.uid() != p_user_id then
    return jsonb_build_object('error', 'Opération non autorisée.');
  end if;

  -- Validate invitation (reads bypassing RLS)
  select organization_id into v_org_id
  from public.invitations
  where token = p_token
    and status = 'sent'
    and expires_at > now()
  limit 1;

  if v_org_id is null then
    return jsonb_build_object('error', 'Lien d''invitation invalide ou expiré.');
  end if;

  -- Guard: prevent double-join
  if exists (
    select 1 from public.organization_members
    where user_id = p_user_id and organization_id = v_org_id
  ) then
    return jsonb_build_object('error', 'Vous êtes déjà membre de cette organisation.');
  end if;

  -- Add member
  insert into public.organization_members (
    organization_id, user_id, role, status, department_id, job_title
  ) values (
    v_org_id, p_user_id, 'member', 'active',
    p_department_id, p_job_title
  );

  -- Audit log
  insert into public.audit_logs (organization_id, user_id, action, target_id, target_type)
  values (v_org_id, p_user_id, 'user_joined', p_user_id, 'user');

  -- Notify org admins
  insert into public.notifications (user_id, type, payload)
  select
    om.user_id,
    'member_joined',
    jsonb_build_object(
      'userId', p_user_id,
      'text', 'Un nouveau collaborateur a rejoint l''organisation.'
    )
  from public.organization_members om
  where om.organization_id = v_org_id
    and om.role  = 'admin'
    and om.status = 'active';

  return jsonb_build_object('error', null);
end;
$$;

-- Authenticated only (caller must have a valid session)
grant   execute on function public.accept_member_invite(text, uuid, uuid, text) to authenticated;
revoke  execute on function public.accept_member_invite(text, uuid, uuid, text) from anon;
