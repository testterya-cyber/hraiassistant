create extension if not exists pgcrypto;

create table if not exists public.resumes (
  id uuid primary key default gen_random_uuid(),
  candidate_name text,
  position text,
  city text,
  experience_years text,
  salary_expectation text,
  summary text,
  skills jsonb not null default '[]'::jsonb,
  strengths jsonb not null default '[]'::jsonb,
  risks jsonb not null default '[]'::jsonb,
  contacts jsonb not null default '{}'::jsonb,
  experience jsonb not null default '[]'::jsonb,
  education jsonb not null default '[]'::jsonb,
  source_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.job_profiles (
  id uuid primary key default gen_random_uuid(),
  title text,
  department text,
  level text,
  purpose text,
  responsibilities jsonb not null default '[]'::jsonb,
  must_have jsonb not null default '[]'::jsonb,
  nice_to_have jsonb not null default '[]'::jsonb,
  soft_skills jsonb not null default '[]'::jsonb,
  kpi jsonb not null default '[]'::jsonb,
  salary_range text,
  education text,
  tools jsonb not null default '[]'::jsonb,
  notes text,
  source_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.candidate_evaluations (
  id uuid primary key default gen_random_uuid(),
  resume_id uuid references public.resumes(id) on delete set null,
  profile_id uuid references public.job_profiles(id) on delete set null,
  overall_score integer,
  verdict text,
  verdict_reason text,
  match jsonb not null default '[]'::jsonb,
  pros jsonb not null default '[]'::jsonb,
  cons jsonb not null default '[]'::jsonb,
  questions_to_clarify jsonb not null default '[]'::jsonb,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.interview_sets (
  id uuid primary key default gen_random_uuid(),
  resume_id uuid references public.resumes(id) on delete set null,
  profile_id uuid references public.job_profiles(id) on delete set null,
  competency jsonb not null default '[]'::jsonb,
  situational jsonb not null default '[]'::jsonb,
  technical jsonb not null default '[]'::jsonb,
  motivation jsonb not null default '[]'::jsonb,
  closing jsonb not null default '[]'::jsonb,
  notes text,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger resumes_set_updated_at
before update on public.resumes
for each row
execute function public.set_updated_at();

drop trigger if exists job_profiles_set_updated_at on public.job_profiles;
create trigger job_profiles_set_updated_at
before update on public.job_profiles
for each row
execute function public.set_updated_at();

alter table public.resumes enable row level security;
alter table public.job_profiles enable row level security;
alter table public.candidate_evaluations enable row level security;
alter table public.interview_sets enable row level security;

drop policy if exists "Public resumes access" on public.resumes;
create policy "Public resumes access"
on public.resumes
for all
using (true)
with check (true);

drop policy if exists "Public job profiles access" on public.job_profiles;
create policy "Public job profiles access"
on public.job_profiles
for all
using (true)
with check (true);

drop policy if exists "Public candidate evaluations access" on public.candidate_evaluations;
create policy "Public candidate evaluations access"
on public.candidate_evaluations
for all
using (true)
with check (true);

drop policy if exists "Public interview sets access" on public.interview_sets;
create policy "Public interview sets access"
on public.interview_sets
for all
using (true)
with check (true);
