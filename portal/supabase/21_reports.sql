-- Saved custom reports (staff)
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  config jsonb not null,
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.reports enable row level security;
drop policy if exists p_reports_staff on public.reports;
create policy p_reports_staff on public.reports for all using (public.is_staff()) with check (public.is_staff());
