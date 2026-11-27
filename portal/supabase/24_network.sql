-- Trusted network: partner professionals shown only inside the client portal (/network), never on the public site.
create table if not exists public.network_partners (
  id uuid primary key default gen_random_uuid(),
  name text not null,                 -- person, e.g. "Daniela Medina, Esq."
  firm text not null,                 -- e.g. "MEDINA & ASSOCIATES LAW FIRM PLLC"
  category text not null,             -- e.g. "Immigration attorney"
  bio text,                           -- 2-3 short lines
  note text,                          -- required notice shown under the bio (e.g. bar admission)
  website text check (website is null or website ~* '^https://'),
  photo_url text check (photo_url is null or photo_url ~* '^https://'),
  active boolean not null default true,
  sort int not null default 100,
  created_at timestamptz not null default now()
);
alter table public.network_partners enable row level security;
drop policy if exists p_network_read on public.network_partners;
create policy p_network_read on public.network_partners for select using ((active and auth.uid() is not null) or public.is_staff());
drop policy if exists p_network_staff on public.network_partners;
create policy p_network_staff on public.network_partners for all using (public.is_staff()) with check (public.is_staff());

-- Introduction requests from clients (lets staff track every referral)
create table if not exists public.network_intros (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.network_partners(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  message text,
  status text not null default 'new' check (status in ('new','introduced','closed')),
  created_at timestamptz not null default now()
);
alter table public.network_intros enable row level security;
drop policy if exists p_intros_insert on public.network_intros;
create policy p_intros_insert on public.network_intros for insert with check (user_id = auth.uid());
drop policy if exists p_intros_read on public.network_intros;
create policy p_intros_read on public.network_intros for select using (user_id = auth.uid() or public.is_staff());
drop policy if exists p_intros_staff on public.network_intros;
create policy p_intros_staff on public.network_intros for update using (public.is_staff()) with check (public.is_staff());

insert into public.network_partners (name, firm, category, bio, note, sort)
select * from (values
  ('[Name]', 'MEDINA & ASSOCIATES LAW FIRM PLLC', 'Immigration attorney', '[Short bio]', 'Admitted in the District of Columbia. Practice limited to federal immigration law.', 10),
  ('[Name]', 'SKYDEN TAX SOLUTIONS', 'Tax preparation (Enrolled Agent)', '[Short bio]', null, 20),
  ('[Name]', 'THE LEDGER PRACTICE LLC', 'Bookkeeping', '[Short bio]', null, 30),
  ('[Name]', 'AMERICAN HORIZONS MANAGEMENT LLC', 'Short-term rental management', '[Short bio]', null, 40)
) v(name, firm, category, bio, note, sort)
where not exists (select 1 from public.network_partners);
