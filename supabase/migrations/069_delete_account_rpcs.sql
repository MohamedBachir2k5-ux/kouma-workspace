-- 069 — Self-delete (user) and org deletion RPCs
-- Both run SECURITY DEFINER so they bypass RLS for the destructive writes.

/* ── 1. User self-deletion ─────────────────────────────────────────────────
   Soft-deletes the calling user from their organisation:
   - sets status = 'deleted', deleted_at = now()
   - revokes all their sessions immediately
   The auth.users row is kept (Supabase policy); only org membership is removed.
────────────────────────────────────────────────────────────────────────── */
create or replace function public.self_delete_account(p_org_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;

  -- Must be an active member (not already deleted)
  if not exists (
    select 1 from organization_members
    where user_id = v_user_id
      and organization_id = p_org_id
      and status = 'active'
  ) then
    raise exception 'not_member';
  end if;

  -- Soft-delete membership
  update organization_members
  set status = 'deleted', deleted_at = now()
  where user_id = v_user_id
    and organization_id = p_org_id;

  -- Revoke all active sessions
  update user_sessions
  set revoked = true
  where user_id = v_user_id;

  -- Audit log
  insert into audit_logs (organization_id, user_id, action, target_id, target_type, target_name)
  select p_org_id, v_user_id, 'user_self_deleted', v_user_id, 'user',
         coalesce(firstname || ' ' || lastname, email)
  from profiles where id = v_user_id;
end;
$$;

grant execute on function public.self_delete_account(uuid) to authenticated;


/* ── 2. Organisation deletion ──────────────────────────────────────────────
   Hard-deletes the entire organisation and all its data via CASCADE.
   Caller must be the admin of the org.
   Storage objects (avatars, logos, documents) are NOT automatically cleaned
   by CASCADE — we mark the org deleted; a separate cleanup job handles storage.
────────────────────────────────────────────────────────────────────────── */
create or replace function public.delete_organization(p_org_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;

  -- Caller must be admin of this organisation
  if not exists (
    select 1 from organization_members
    where user_id = v_user_id
      and organization_id = p_org_id
      and role = 'admin'
  ) then
    raise exception 'not_admin';
  end if;

  -- Revoke all member sessions so they are kicked out immediately
  update user_sessions us
  set revoked = true
  from organization_members om
  where om.organization_id = p_org_id
    and om.user_id = us.user_id;

  -- Delete organisation — CASCADE removes all child rows automatically:
  -- organization_members, conversations, messages, attachments,
  -- documents, events, teams, notifications, audit_logs, subscriptions, etc.
  delete from organizations where id = p_org_id;
end;
$$;

grant execute on function public.delete_organization(uuid) to authenticated;
