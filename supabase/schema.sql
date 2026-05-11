create extension if not exists pgcrypto;

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  niche text,
  instagram_handle text,
  youtube_url text,
  x_handle text,
  email text,
  phone text,
  website text,
  address text,
  source text not null default 'manual',
  follower_counts jsonb not null default '{}'::jsonb,
  platform_payload jsonb not null default '{}'::jsonb,
  ai_score numeric(4, 2),
  score_breakdown jsonb not null default '{}'::jsonb,
  score_reason text,
  notes text,
  pipeline_stage text not null default 'Prospect',
  duplicate_group_id uuid,
  duplicate_candidates jsonb not null default '[]'::jsonb,
  deal_value numeric(12, 2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.outreach_statuses (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  platform text not null check (platform in ('instagram', 'youtube', 'x', 'email', 'phone', 'website')),
  status text not null default 'Not Contacted' check (status in ('Not Contacted', 'Sent', 'Replied', 'Booked', 'Closed')),
  last_message text,
  last_contacted_at timestamptz,
  reply_received_at timestamptz,
  follow_up_count integer not null default 0,
  next_follow_up_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (lead_id, platform)
);

create table if not exists public.followups (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  outreach_status_id uuid references public.outreach_statuses(id) on delete cascade,
  platform text not null,
  due_at timestamptz not null,
  generated_message text,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads(id) on delete set null,
  event_type text not null,
  platform text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists leads_touch_updated_at on public.leads;
create trigger leads_touch_updated_at
before update on public.leads
for each row execute function public.touch_updated_at();

drop trigger if exists outreach_statuses_touch_updated_at on public.outreach_statuses;
create trigger outreach_statuses_touch_updated_at
before update on public.outreach_statuses
for each row execute function public.touch_updated_at();

create index if not exists leads_user_id_idx on public.leads(user_id);
create index if not exists leads_pipeline_stage_idx on public.leads(pipeline_stage);
create index if not exists leads_ai_score_idx on public.leads(ai_score desc);
create index if not exists leads_instagram_handle_idx on public.leads(lower(instagram_handle));
create index if not exists leads_email_idx on public.leads(lower(email));
create index if not exists outreach_statuses_lead_id_idx on public.outreach_statuses(lead_id);
create index if not exists outreach_statuses_status_idx on public.outreach_statuses(status);
create index if not exists followups_due_at_idx on public.followups(due_at);
create index if not exists activities_created_at_idx on public.activities(created_at desc);

alter table public.leads enable row level security;
alter table public.outreach_statuses enable row level security;
alter table public.followups enable row level security;
alter table public.activities enable row level security;

drop policy if exists "Leads are owned by their user" on public.leads;
create policy "Leads are owned by their user"
on public.leads for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Outreach belongs to owned leads" on public.outreach_statuses;
create policy "Outreach belongs to owned leads"
on public.outreach_statuses for all
using (exists (select 1 from public.leads where leads.id = outreach_statuses.lead_id and leads.user_id = auth.uid()))
with check (exists (select 1 from public.leads where leads.id = outreach_statuses.lead_id and leads.user_id = auth.uid()));

drop policy if exists "Followups belong to owned leads" on public.followups;
create policy "Followups belong to owned leads"
on public.followups for all
using (exists (select 1 from public.leads where leads.id = followups.lead_id and leads.user_id = auth.uid()))
with check (exists (select 1 from public.leads where leads.id = followups.lead_id and leads.user_id = auth.uid()));

drop policy if exists "Activities belong to owned leads" on public.activities;
create policy "Activities belong to owned leads"
on public.activities for all
using (
  lead_id is null
  or exists (select 1 from public.leads where leads.id = activities.lead_id and leads.user_id = auth.uid())
)
with check (
  lead_id is null
  or exists (select 1 from public.leads where leads.id = activities.lead_id and leads.user_id = auth.uid())
);
