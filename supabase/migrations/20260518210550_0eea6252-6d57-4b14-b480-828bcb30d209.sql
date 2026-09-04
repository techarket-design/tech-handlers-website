
-- extensions
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- push_subscriptions
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);
create index if not exists idx_push_subs_user on public.push_subscriptions(user_id);

alter table public.push_subscriptions enable row level security;

create policy "users manage own push subs"
  on public.push_subscriptions for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- notification preferences (per user, separate table to avoid touching auth.users)
create table if not exists public.user_notification_prefs (
  user_id uuid primary key,
  master_enabled boolean not null default true,
  task_assigned boolean not null default true,
  task_due boolean not null default true,
  followup_due boolean not null default true,
  mention boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.user_notification_prefs enable row level security;

create policy "users manage own prefs"
  on public.user_notification_prefs for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- tracking for due/followup alerts
alter table public.tasks add column if not exists due_notified_at timestamptz;
alter table public.leads add column if not exists followup_notified_at timestamptz;

create index if not exists idx_tasks_due_notify on public.tasks(due_date) where status <> 'done' and due_date is not null;
create index if not exists idx_leads_followup_notify on public.leads(follow_up_date) where follow_up_date is not null;
