-- Module tâches : table principale avec RLS
create table if not exists public.tasks (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references public.organizations(id) on delete cascade,
  title        text not null,
  assignee_id  uuid references public.profiles(id) on delete set null,
  created_by   uuid not null references public.profiles(id) on delete cascade,
  status       text not null default 'todo'
               check (status in ('todo','in_progress','done','waiting')),
  due_date     date,
  source       text not null default 'manual'
               check (source in ('manual','meeting','assistant')),
  source_id    uuid,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.tasks enable row level security;

create policy "tasks_select" on public.tasks for select
  using (is_org_member(org_id));

create policy "tasks_insert" on public.tasks for insert
  with check (is_org_member(org_id) and auth.uid() = created_by);

create policy "tasks_update" on public.tasks for update
  using (
    is_org_member(org_id) and
    (auth.uid() = created_by or auth.uid() = assignee_id or is_org_admin(org_id))
  );

create policy "tasks_delete" on public.tasks for delete
  using (auth.uid() = created_by or is_org_admin(org_id));

create index if not exists tasks_org_status_idx on public.tasks(org_id, status);
create index if not exists tasks_assignee_idx   on public.tasks(assignee_id);
