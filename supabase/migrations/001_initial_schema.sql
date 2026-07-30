-- Kouma Workspace — Initial Schema
-- Run: supabase db push  (or apply via Supabase dashboard SQL editor)

-- ─── Extensions ──────────────────────────────────────────────────────────────

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ─── Tables ──────────────────────────────────────────────────────────────────

-- User profiles — extends Supabase auth.users
create table public.profiles (
  id          uuid primary key references auth.users on delete cascade,
  firstname   text not null,
  lastname    text not null,
  email       text not null unique,
  phone       text,
  avatar_url  text,
  country     text,
  language    text not null default 'fr',
  status      text not null default 'active'
                check (status in ('active','invited','suspended','deleted')),
  created_at  timestamptz not null default now()
);

-- Organizations
create table public.organizations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  logo_url    text,
  email       text not null,
  phone       text,
  website     text,
  country     text not null,
  currency    text not null default 'GNF',
  language    text not null default 'fr',
  sector      text,
  size        text,
  plan        text not null default 'starter'
                check (plan in ('starter','business')),
  created_at  timestamptz not null default now()
);

-- Organization membership
create table public.organization_members (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations on delete cascade,
  user_id          uuid not null references public.profiles on delete cascade,
  role             text not null default 'member',
  status           text not null default 'active'
                     check (status in ('active','invited','suspended','deleted')),
  unique (organization_id, user_id)
);

-- Departments
create table public.departments (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations on delete cascade,
  name             text not null,
  code             text not null
);

-- Teams
create table public.teams (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations on delete cascade,
  name             text not null,
  description      text,
  color            text not null default '#4f46e5',
  owner_id         uuid references public.profiles,
  created_at       timestamptz not null default now()
);

-- Team membership
create table public.team_members (
  team_id  uuid not null references public.teams on delete cascade,
  user_id  uuid not null references public.profiles on delete cascade,
  role     text not null default 'member'
             check (role in ('owner','admin','member')),
  primary key (team_id, user_id)
);

-- Team permissions (owned by the team, not global admin)
create table public.team_permissions (
  team_id          uuid not null references public.teams on delete cascade,
  permission_name  text not null,
  enabled          boolean not null default false,
  primary key (team_id, permission_name)
);

-- Private groups (user-created, not admin-managed)
create table public.groups (
  id          uuid primary key default gen_random_uuid(),
  creator_id  uuid not null references public.profiles,
  name        text not null,
  avatar_url  text,
  private     boolean not null default true,
  created_at  timestamptz not null default now()
);

create table public.group_members (
  group_id  uuid not null references public.groups on delete cascade,
  user_id   uuid not null references public.profiles on delete cascade,
  role      text not null default 'member'
              check (role in ('admin','member')),
  primary key (group_id, user_id)
);

-- Conversations (direct / group / team / org)
create table public.conversations (
  id               uuid primary key default gen_random_uuid(),
  type             text not null
                     check (type in ('direct','group','team','org')),
  organization_id  uuid not null references public.organizations on delete cascade,
  reference_id     uuid,  -- team_id or group_id
  created_at       timestamptz not null default now()
);

create table public.conversation_members (
  conversation_id  uuid not null references public.conversations on delete cascade,
  user_id          uuid not null references public.profiles on delete cascade,
  last_read_at     timestamptz,
  primary key (conversation_id, user_id)
);

-- Messages
create table public.messages (
  id               uuid primary key default gen_random_uuid(),
  conversation_id  uuid not null references public.conversations on delete cascade,
  sender_id        uuid not null references public.profiles,
  content          text not null,
  status           text not null default 'sent'
                     check (status in ('sent','received','read')),
  reply_to_id      uuid references public.messages,
  edited_at        timestamptz,
  created_at       timestamptz not null default now()
);

-- Files (two categories: documents vs attachments)
create table public.files (
  id               uuid primary key default gen_random_uuid(),
  owner_id         uuid not null references public.profiles,
  organization_id  uuid not null references public.organizations on delete cascade,
  storage_path     text not null,
  name             text not null,
  type             text not null,
  size             bigint not null,
  category         text not null check (category in ('attachment','document')),
  created_at       timestamptz not null default now()
);

-- Folders (nested, can belong to a team)
create table public.folders (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations on delete cascade,
  parent_id        uuid references public.folders,
  team_id          uuid references public.teams,
  name             text not null,
  created_at       timestamptz not null default now()
);

-- Documents (metadata — file stored in Storage bucket)
create table public.documents (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations on delete cascade,
  folder_id        uuid references public.folders,
  owner_id         uuid not null references public.profiles,
  title            text not null,
  file_id          uuid not null references public.files,
  created_at       timestamptz not null default now()
);

-- Meetings
create table public.meetings (
  id               uuid primary key default gen_random_uuid(),
  creator_id       uuid not null references public.profiles,
  organization_id  uuid not null references public.organizations on delete cascade,
  title            text not null,
  description      text,
  date             timestamptz not null,
  end_date         timestamptz,
  location         text,
  link             text,
  status           text not null default 'scheduled'
                     check (status in ('scheduled','modified','cancelled','done')),
  created_at       timestamptz not null default now()
);

create table public.meeting_participants (
  meeting_id  uuid not null references public.meetings on delete cascade,
  user_id     uuid references public.profiles,
  team_id     uuid references public.teams,
  group_id    uuid references public.groups,
  constraint one_participant_type check (
    (user_id is not null)::int + (team_id is not null)::int + (group_id is not null)::int = 1
  )
);

-- Invitations
create table public.invitations (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations on delete cascade,
  email            text not null,
  token            text not null unique default encode(gen_random_bytes(32), 'hex'),
  status           text not null default 'sent'
                     check (status in ('sent','accepted','expired','cancelled')),
  expires_at       timestamptz not null default (now() + interval '7 days'),
  created_at       timestamptz not null default now()
);

-- Subscriptions (one per organization)
create table public.subscriptions (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations on delete cascade unique,
  plan              text not null check (plan in ('starter','business')),
  status            text not null check (status in ('trial','active','expired','payment_failed','cancelled')),
  currency          text not null default 'GNF',
  amount            numeric not null,
  trial_ends_at     timestamptz,
  start_date        timestamptz,
  end_date          timestamptz,
  discount_percent  integer not null default 0,
  discount_ends_at  timestamptz,
  created_at        timestamptz not null default now()
);

-- Payments
create table public.payments (
  id                   uuid primary key default gen_random_uuid(),
  organization_id      uuid not null references public.organizations on delete cascade,
  provider             text not null default 'lengopay',
  amount               numeric not null,
  currency             text not null,
  status               text not null check (status in ('pending','success','failed','refunded')),
  provider_reference   text,
  created_at           timestamptz not null default now()
);

-- Notifications
create table public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles on delete cascade,
  type        text not null,
  payload     jsonb,
  read        boolean not null default false,
  created_at  timestamptz not null default now()
);

-- Audit logs — never stores message content
create table public.audit_logs (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations on delete cascade,
  user_id          uuid references public.profiles,
  action           text not null,
  target_type      text,
  target_id        uuid,
  target_name      text,
  detail           text,
  created_at       timestamptz not null default now()
);

-- ─── Indexes ─────────────────────────────────────────────────────────────────

create index on public.organization_members (organization_id);
create index on public.organization_members (user_id);
create index on public.team_members (team_id);
create index on public.team_members (user_id);
create index on public.messages (conversation_id, created_at);
create index on public.messages (sender_id);
create index on public.files (organization_id);
create index on public.documents (organization_id);
create index on public.notifications (user_id, read);
create index on public.audit_logs (organization_id, created_at desc);
create index on public.invitations (token);

-- ─── Row Level Security ───────────────────────────────────────────────────────

alter table public.profiles             enable row level security;
alter table public.organizations        enable row level security;
alter table public.organization_members enable row level security;
alter table public.departments          enable row level security;
alter table public.teams                enable row level security;
alter table public.team_members         enable row level security;
alter table public.team_permissions     enable row level security;
alter table public.groups               enable row level security;
alter table public.group_members        enable row level security;
alter table public.conversations        enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages             enable row level security;
alter table public.files                enable row level security;
alter table public.folders              enable row level security;
alter table public.documents            enable row level security;
alter table public.meetings             enable row level security;
alter table public.meeting_participants enable row level security;
alter table public.invitations          enable row level security;
alter table public.subscriptions        enable row level security;
alter table public.payments             enable row level security;
alter table public.notifications        enable row level security;
alter table public.audit_logs           enable row level security;

-- ─── Helper: is the current user a member of an organization? ────────────────

create or replace function public.is_org_member(org_id uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.organization_members
    where organization_id = org_id
      and user_id = auth.uid()
      and status = 'active'
  );
$$;

create or replace function public.is_org_admin(org_id uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.organization_members
    where organization_id = org_id
      and user_id = auth.uid()
      and role in ('admin','owner')
      and status = 'active'
  );
$$;

create or replace function public.is_team_member(t_id uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.team_members
    where team_id = t_id and user_id = auth.uid()
  );
$$;

-- SECURITY DEFINER helpers — break RLS recursion cycles

create or replace function public.is_team_owner_or_admin(p_team_id uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.team_members
    where team_id = p_team_id and user_id = auth.uid() and role in ('owner','admin')
  );
$$;

create or replace function public.is_group_member_fn(p_group_id uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.group_members
    where group_id = p_group_id and user_id = auth.uid()
  );
$$;

create or replace function public.is_group_admin_fn(p_group_id uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.group_members
    where group_id = p_group_id and user_id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.is_conversation_member(p_conversation_id uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.conversation_members
    where conversation_id = p_conversation_id and user_id = auth.uid()
  );
$$;

-- ─── RLS Policies ────────────────────────────────────────────────────────────

-- profiles: see own profile + fellow org members
create policy "Own profile" on public.profiles for all
  using (auth.uid() = id);

create policy "Org members see each other" on public.profiles for select
  using (
    exists (
      select 1 from public.organization_members a
      join  public.organization_members b on a.organization_id = b.organization_id
      where a.user_id = auth.uid() and b.user_id = profiles.id
        and a.status = 'active'
    )
  );

-- organizations: members only
create policy "Org members view org" on public.organizations for select
  using (public.is_org_member(id));

create policy "Org admins update org" on public.organizations for update
  using (public.is_org_admin(id));

-- organization_members: admins manage, members view
create policy "Org members view members" on public.organization_members for select
  using (public.is_org_member(organization_id));

create policy "Org admins manage members" on public.organization_members for all
  using (public.is_org_admin(organization_id));

-- departments
create policy "Org members view departments" on public.departments for select
  using (public.is_org_member(organization_id));

create policy "Org admins manage departments" on public.departments for all
  using (public.is_org_admin(organization_id));

-- teams
create policy "Org members view teams" on public.teams for select
  using (public.is_org_member(organization_id));

create policy "Org admins manage teams" on public.teams for all
  using (public.is_org_admin(organization_id));

-- team_members
create policy "Team members view" on public.team_members for select
  using (public.is_org_member((select organization_id from public.teams where id = team_id)));

-- Note: uses is_team_owner_or_admin() (SECURITY DEFINER) to avoid infinite recursion
create policy "Team owners manage members" on public.team_members for all
  using (public.is_team_owner_or_admin(team_members.team_id));

-- team_permissions: org admins + team owners/admins
create policy "Team permissions view" on public.team_permissions for select
  using (
    public.is_team_member(team_id) or
    public.is_org_admin((select organization_id from public.teams where id = team_id))
  );

create policy "Team owners set permissions" on public.team_permissions for all
  using (public.is_team_owner_or_admin(team_permissions.team_id));

-- groups: private — only members (admins never see content)
-- Note: uses is_group_member_fn() / is_group_admin_fn() (SECURITY DEFINER) to avoid recursion
create policy "Group members only" on public.groups for select
  using (public.is_group_member_fn(groups.id));

create policy "Group creator manages" on public.groups for all
  using (creator_id = auth.uid());

create policy "Group member view membership" on public.group_members for select
  using (public.is_group_member_fn(group_members.group_id));

create policy "Group admin manages members" on public.group_members for all
  using (public.is_group_admin_fn(group_members.group_id));

-- conversations: members only — private conversations invisible to admins
-- Note: uses is_conversation_member() (SECURITY DEFINER) to avoid infinite recursion
create policy "Conversation members view" on public.conversations for select
  using (public.is_conversation_member(conversations.id));

create policy "Conversation members" on public.conversation_members for select
  using (public.is_conversation_member(conversation_members.conversation_id));

-- messages: conversation members only — admins cannot read private messages
create policy "Message senders and receivers" on public.messages for select
  using (
    exists (
      select 1 from public.conversation_members
      where conversation_id = messages.conversation_id and user_id = auth.uid()
    )
  );

create policy "Send messages" on public.messages for insert
  with check (
    sender_id = auth.uid() and
    exists (
      select 1 from public.conversation_members
      where conversation_id = messages.conversation_id and user_id = auth.uid()
    )
  );

create policy "Edit own messages" on public.messages for update
  using (sender_id = auth.uid());

-- files: org members for org documents; conversation members for attachments
create policy "Org files" on public.files for select
  using (public.is_org_member(organization_id));

create policy "Upload files" on public.files for insert
  with check (owner_id = auth.uid() and public.is_org_member(organization_id));

create policy "Delete own files" on public.files for delete
  using (owner_id = auth.uid());

-- documents, folders
create policy "Org documents" on public.documents for select
  using (public.is_org_member(organization_id));

create policy "Manage documents" on public.documents for all
  using (public.is_org_member(organization_id));

create policy "Org folders" on public.folders for select
  using (public.is_org_member(organization_id));

create policy "Manage folders" on public.folders for all
  using (public.is_org_admin(organization_id));

-- meetings
create policy "Org meetings" on public.meetings for select
  using (public.is_org_member(organization_id));

create policy "Create meetings" on public.meetings for insert
  with check (creator_id = auth.uid() and public.is_org_member(organization_id));

create policy "Edit meetings" on public.meetings for update
  using (creator_id = auth.uid());

create policy "Meeting participants" on public.meeting_participants for select
  using (public.is_org_member((select organization_id from public.meetings where id = meeting_id)));

-- invitations: admin only
create policy "Admins view invitations" on public.invitations for select
  using (public.is_org_admin(organization_id));

create policy "Admins manage invitations" on public.invitations for all
  using (public.is_org_admin(organization_id));

-- subscriptions, payments: admin only
create policy "Admins view subscription" on public.subscriptions for select
  using (public.is_org_admin(organization_id));

create policy "Admins view payments" on public.payments for select
  using (public.is_org_admin(organization_id));

-- notifications: own only
create policy "Own notifications" on public.notifications for all
  using (user_id = auth.uid());

-- audit logs: admin only
create policy "Admins view audit logs" on public.audit_logs for select
  using (public.is_org_admin(organization_id));

-- ─── Trigger: create profile on auth.users insert ────────────────────────────

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, firstname, lastname, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'firstname', ''),
    coalesce(new.raw_user_meta_data->>'lastname', ''),
    new.email
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── Grants ───────────────────────────────────────────────────────────────────

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant select on public.invitations to anon;
grant usage, select on all sequences in schema public to authenticated;

