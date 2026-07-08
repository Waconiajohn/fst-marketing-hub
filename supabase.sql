-- Reference schema for the marketing engine tables (applied 2026-07-07
-- to Supabase project fst-marketing-hub as migration marketing_engine_tables).
-- All tables use the same open RLS policy as marketing_assets ("Allow all operations")
-- because the app authenticates with the anon key. Internal tool — keep the URL private.

create table if not exists public.prospects (
  id uuid primary key default gen_random_uuid(),
  lead_id text,
  name text not null,
  company text,
  title text,
  location text,
  email text,
  source text,
  displacement_date date,
  linkedin_signals text,
  readiness_signals text,
  content_recommendation text,
  notes text,
  status text not null default 'new', -- new | invited | replied | registered | attended | converted | dead
  invite_message text,
  invited_at timestamptz,
  replied_at timestamptz,
  registered_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.b2b_accounts (
  id uuid primary key default gen_random_uuid(),
  company text not null,
  company_size text,
  trigger_event text,
  trigger_date date,
  trigger_source text,
  contact_name text,
  contact_title text,
  contact_email text,
  contact_linkedin text,
  status text not null default 'target', -- target | contacted | followup | conversation | proposal | won | lost
  touches int not null default 0,
  last_touch_at timestamptz,
  notes text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.b2b_touches (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references public.b2b_accounts(id) on delete cascade,
  step int,
  subject text,
  body text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.publish_targets (
  id uuid primary key default gen_random_uuid(),
  platform text not null,
  account_id text not null,
  page_id text,
  label text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.published_posts (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid references public.marketing_assets(id) on delete set null,
  platform text,
  target_label text,
  content text,
  media_urls text,
  scheduled_time timestamptz,
  blotato_submission_id text,
  status text not null default 'scheduled', -- scheduled | published | failed
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.weekly_metrics (
  id uuid primary key default gen_random_uuid(),
  week_start date not null unique,
  registrations int,
  attendees int,
  next_steps int,
  b2b_conversations int,
  notes text,
  created_at timestamptz not null default timezone('utc', now())
);
