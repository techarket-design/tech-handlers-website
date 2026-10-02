-- Website enquiries and email outbox commit together. Only Vercel's server can call these RPCs.
alter table public.leads add column if not exists request_id uuid unique;
alter table public.leads add column if not exists attribution jsonb not null default '{}'::jsonb;
drop policy if exists "Anyone can submit a lead" on public.leads;
-- Keep existing team insertion policies; explicitly preserve administrator insertion.
create policy "Admins submit leads" on public.leads for insert to authenticated
with check (public.has_role(auth.uid(), 'admin'));

create table public.website_lead_rate_limits (
  rate_key text primary key,
  window_start timestamptz not null default now(),
  submissions integer not null default 1
);
alter table public.website_lead_rate_limits enable row level security;
create table public.lead_notification_outbox (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null unique references public.leads(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','sent')),
  attempts integer not null default 0,
  next_attempt_at timestamptz not null default now(),
  locked_until timestamptz,
  claim_token uuid,
  last_error text,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.lead_notification_outbox enable row level security;
create policy "Admins read lead delivery" on public.lead_notification_outbox for select to authenticated
using (public.has_role(auth.uid(), 'admin'));
grant select on public.lead_notification_outbox to authenticated;
grant all on public.lead_notification_outbox, public.website_lead_rate_limits to service_role;
create index lead_delivery_due_idx on public.lead_notification_outbox(next_attempt_at) where status = 'pending';

create or replace function public.submit_website_lead(p_lead jsonb, p_rate_key text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare existing_id uuid; new_id uuid; rate_count integer; req uuid;
begin
  req := (p_lead->>'request_id')::uuid;
  -- Serialize retries of the same submission; a lost HTTP response cannot create two leads.
  perform pg_advisory_xact_lock(hashtextextended(req::text, 0));
  select id into existing_id from public.leads where request_id = req;
  if existing_id is not null then return jsonb_build_object('id', existing_id, 'duplicate', true); end if;
  if coalesce(length(trim(p_lead->>'name')),0) = 0 or coalesce(p_lead->>'email','') !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then raise exception 'invalid_lead'; end if;
  delete from public.website_lead_rate_limits where window_start < now() - interval '2 days';
  insert into public.website_lead_rate_limits(rate_key) values (p_rate_key)
  on conflict (rate_key) do update set
    submissions = case when website_lead_rate_limits.window_start < now() - interval '1 hour' then 1 else website_lead_rate_limits.submissions + 1 end,
    window_start = case when website_lead_rate_limits.window_start < now() - interval '1 hour' then now() else website_lead_rate_limits.window_start end
  returning submissions into rate_count;
  if rate_count > 5 then raise exception 'lead_rate_limit'; end if;
  insert into public.leads(name,email,phone,company,website_url,service_interest,message,budget,source,request_id,attribution)
  values (left(p_lead->>'name',120),lower(left(p_lead->>'email',254)),p_lead->>'phone',p_lead->>'company',p_lead->>'website_url',p_lead->>'service_interest',p_lead->>'message',p_lead->>'budget',p_lead->>'source',req,coalesce(p_lead->'attribution','{}'::jsonb))
  returning id into new_id;
  insert into public.lead_notification_outbox(lead_id) values (new_id);
  return jsonb_build_object('id',new_id,'duplicate',false);
end $$;

create or replace function public.claim_lead_notifications(p_lead_id uuid default null)
returns setof public.lead_notification_outbox language sql security definer set search_path = public as $$
  update public.lead_notification_outbox set locked_until = now() + interval '5 minutes', claim_token = gen_random_uuid(), attempts = attempts + 1
  where id in (
    select id from public.lead_notification_outbox
    where status = 'pending' and next_attempt_at <= now() and (locked_until is null or locked_until < now())
      and (p_lead_id is null or lead_id = p_lead_id)
    order by next_attempt_at for update skip locked limit 1
  ) returning *;
$$;
create or replace function public.complete_lead_notification(p_id uuid, p_token uuid, p_sent boolean, p_error text)
returns void language sql security definer set search_path = public as $$
  update public.lead_notification_outbox set
    status = case when p_sent then 'sent' else 'pending' end,
    sent_at = case when p_sent then now() else null end,
    next_attempt_at = now() + interval '1 hour', locked_until = null, claim_token = null,
    last_error = case when p_sent then null else left(p_error,200) end
  where id = p_id and claim_token = p_token;
$$;
revoke all on function public.submit_website_lead(jsonb,text), public.claim_lead_notifications(uuid), public.complete_lead_notification(uuid,uuid,boolean,text) from public,anon,authenticated;
grant execute on function public.submit_website_lead(jsonb,text), public.claim_lead_notifications(uuid), public.complete_lead_notification(uuid,uuid,boolean,text) to service_role;
-- Detail rendering and sitemap lookup stay efficient as the CMS grows.
create index if not exists blog_posts_public_slug_idx on public.blog_posts(slug) where is_published;
create index if not exists portfolio_public_slug_idx on public.portfolio(slug) where is_active;
create index if not exists city_pages_public_slug_idx on public.city_pages(slug) where is_published;
