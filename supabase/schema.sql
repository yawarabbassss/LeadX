-- ==============================================================================
-- LEADX V1 - SUPABASE / POSTGRESQL DATABASE SCHEMA
-- ==============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. USERS / PROFILES TABLE
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  full_name text,
  company_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. CAMPAIGNS TABLE (For organizing prospecting batches)
create table if not exists public.campaigns (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  target_service text,
  target_location text,
  target_industry text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. LEADS TABLE
create table if not exists public.leads (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  campaign_id uuid references public.campaigns on delete set null,
  business_name text not null,
  domain text,
  website text,
  category text,
  city text,
  state text,
  country text default 'United States',
  phone text,
  email text,
  contact_name text,
  contact_role text,
  notes text,
  lead_score integer default 0,
  lead_category text check (lead_category in ('HOT', 'WARM', 'POTENTIAL', 'LOW', 'UNSCORED')) default 'UNSCORED',
  primary_service text,
  status text check (status in ('New', 'Qualified', 'Contacted', 'Replied', 'Meeting', 'Won', 'Lost', 'Archived')) default 'New',
  analysis_status text check (analysis_status in ('pending', 'analyzing', 'completed', 'partial', 'failed')) default 'pending',
  error_message text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Index for duplicate lookups & fast search
create index if not exists idx_leads_user_domain on public.leads(user_id, domain);
create index if not exists idx_leads_user_score on public.leads(user_id, lead_score desc);
create index if not exists idx_leads_user_status on public.leads(user_id, status);
create index if not exists idx_leads_user_category on public.leads(user_id, lead_category);

-- 4. LEAD CONTACTS TABLE (For multiple contacts per business)
create table if not exists public.lead_contacts (
  id uuid default uuid_generate_v4() primary key,
  lead_id uuid references public.leads on delete cascade not null,
  name text not null,
  role text,
  email text,
  phone text,
  is_primary boolean default false,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. WEBSITE AUDITS TABLE
create table if not exists public.website_audits (
  id uuid default uuid_generate_v4() primary key,
  lead_id uuid references public.leads on delete cascade not null,
  url text not null,
  final_url text,
  http_status integer,
  response_time_ms integer,
  has_https boolean default false,
  has_robots_txt boolean default false,
  has_sitemap boolean default false,
  has_mobile_viewport boolean default false,
  has_schema boolean default false,
  is_indexable boolean default true,
  canonical_url text,
  title text,
  meta_description text,
  h1 text,
  heading_count integer default 0,
  image_count integer default 0,
  images_without_alt integer default 0,
  broken_links_sample jsonb default '[]'::jsonb,
  internal_links_count integer default 0,
  external_links_count integer default 0,
  detected_technologies jsonb default '[]'::jsonb,
  raw_signals jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. SEO FINDINGS & EVIDENCE TABLE
create table if not exists public.seo_findings (
  id uuid default uuid_generate_v4() primary key,
  audit_id uuid references public.website_audits on delete cascade not null,
  lead_id uuid references public.leads on delete cascade not null,
  category text not null, -- 'Technical SEO', 'On-Page SEO', 'Local SEO', 'Website Quality'
  check_name text not null,
  status text check (status in ('pass', 'warning', 'fail', 'info')) not null,
  score_impact integer default 0,
  title text not null,
  description text not null,
  evidence text not null,
  recommendation text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. LEAD SCORES TABLE (Deterministic 100-Point Breakdown)
create table if not exists public.lead_scores (
  id uuid default uuid_generate_v4() primary key,
  lead_id uuid references public.leads on delete cascade not null unique,
  total_score integer not null check (total_score between 0 and 100),
  website_opportunity integer not null check (website_opportunity between 0 and 25),
  seo_opportunity integer not null check (seo_opportunity between 0 and 25),
  local_seo_opportunity integer not null check (local_seo_opportunity between 0 and 20),
  business_potential integer not null check (business_potential between 0 and 15),
  contactability integer not null check (contactability between 0 and 15),
  breakdown_json jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. AI ANALYSES (GROK Output)
create table if not exists public.ai_analyses (
  id uuid default uuid_generate_v4() primary key,
  lead_id uuid references public.leads on delete cascade not null unique,
  audit_id uuid references public.website_audits on delete cascade,
  lead_summary text not null,
  qualification_reason text not null,
  primary_service text not null,
  secondary_service text,
  pain_points jsonb not null default '[]'::jsonb,
  evidence jsonb not null default '[]'::jsonb,
  recommended_pitch_angle text not null,
  personalized_message text not null,
  confidence numeric check (confidence between 0 and 1) default 0.85,
  raw_response jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 9. OUTREACH MESSAGES (Short, Long, Direct, Email variations)
create table if not exists public.outreach_messages (
  id uuid default uuid_generate_v4() primary key,
  lead_id uuid references public.leads on delete cascade not null,
  variation_type text not null, -- 'standard', 'short', 'direct', 'email'
  tone text default 'conversational',
  subject text,
  message_body text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 10. LEAD STATUS HISTORY (Audit trail for CRM status)
create table if not exists public.lead_status_history (
  id uuid default uuid_generate_v4() primary key,
  lead_id uuid references public.leads on delete cascade not null,
  from_status text,
  to_status text not null,
  note text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

alter table public.profiles enable row level security;
alter table public.campaigns enable row level security;
alter table public.leads enable row level security;
alter table public.lead_contacts enable row level security;
alter table public.website_audits enable row level security;
alter table public.seo_findings enable row level security;
alter table public.lead_scores enable row level security;
alter table public.ai_analyses enable row level security;
alter table public.outreach_messages enable row level security;
alter table public.lead_status_history enable row level security;

-- Profiles: user can read/write only their profile
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- Leads: user can only access their own leads
create policy "Users can view own leads" on public.leads for select using (auth.uid() = user_id);
create policy "Users can insert own leads" on public.leads for insert with check (auth.uid() = user_id);
create policy "Users can update own leads" on public.leads for update using (auth.uid() = user_id);
create policy "Users can delete own leads" on public.leads for delete using (auth.uid() = user_id);

-- Child tables policies based on lead ownership
create policy "Users can view own campaigns" on public.campaigns for all using (auth.uid() = user_id);

create policy "Users access contacts via lead" on public.lead_contacts for all using (
  exists (select 1 from public.leads where leads.id = lead_contacts.lead_id and leads.user_id = auth.uid())
);

create policy "Users access audits via lead" on public.website_audits for all using (
  exists (select 1 from public.leads where leads.id = website_audits.lead_id and leads.user_id = auth.uid())
);

create policy "Users access findings via lead" on public.seo_findings for all using (
  exists (select 1 from public.leads where leads.id = seo_findings.lead_id and leads.user_id = auth.uid())
);

create policy "Users access scores via lead" on public.lead_scores for all using (
  exists (select 1 from public.leads where leads.id = lead_scores.lead_id and leads.user_id = auth.uid())
);

create policy "Users access ai analyses via lead" on public.ai_analyses for all using (
  exists (select 1 from public.leads where leads.id = ai_analyses.lead_id and leads.user_id = auth.uid())
);

create policy "Users access outreach via lead" on public.outreach_messages for all using (
  exists (select 1 from public.leads where leads.id = outreach_messages.lead_id and leads.user_id = auth.uid())
);

create policy "Users access status history via lead" on public.lead_status_history for all using (
  exists (select 1 from public.leads where leads.id = lead_status_history.lead_id and leads.user_id = auth.uid())
);
