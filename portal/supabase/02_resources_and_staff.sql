-- ---------- Staff emails: these become admin automatically on first sign-in ----------
create table if not exists public.staff_emails (email text primary key, role text not null default 'admin' check (role in ('staff','admin')));
alter table public.staff_emails enable row level security;
drop policy if exists p_staff_emails on public.staff_emails;
create policy p_staff_emails on public.staff_emails for all using (public.is_staff()) with check (public.is_staff());
insert into public.staff_emails (email, role) values ('accounting@theledgerpractice.com', 'admin') on conflict do nothing;

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, role)
    values (new.id, new.email, coalesce((select role from public.staff_emails where lower(email) = lower(new.email)), 'client'))
    on conflict do nothing;
  insert into public.entity_members (entity_id, user_id)
    select entity_id, new.id from public.invitations where lower(email) = lower(new.email)
    on conflict do nothing;
  delete from public.invitations where lower(email) = lower(new.email);
  return new;
end $$;

-- ---------- Resource links (Sunbiz, IRS, etc.) shown in the portal ----------
create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  url text not null check (url ~* '^https://'),
  description text,
  audience text not null default 'client' check (audience in ('client','staff')),  -- client = everyone; staff = staff only
  sort int not null default 100,
  created_at timestamptz not null default now()
);
alter table public.resources enable row level security;
drop policy if exists p_resources_read on public.resources;
create policy p_resources_read on public.resources for select using ((audience = 'client' and auth.uid() is not null) or public.is_staff());
drop policy if exists p_resources_staff on public.resources;
create policy p_resources_staff on public.resources for all using (public.is_staff()) with check (public.is_staff());

insert into public.resources (title, url, description, audience, sort)
select * from (values
  ('Sunbiz – search your company', 'https://search.sunbiz.org/Inquiry/CorporationSearch/ByName', 'Look up your company''s official Florida record, status and filing history.', 'client', 10),
  ('Sunbiz – file your annual report', 'https://services.sunbiz.org/Filings/AnnualReport/FilingStart', 'Due January 1 – May 1 every year. We file it for you if you''re on auto-renew.', 'client', 20),
  ('Sunbiz – fictitious name (DBA) search', 'https://search.sunbiz.org/Inquiry/FictitiousName/ByName', 'Check whether a trade name is already registered in Florida.', 'client', 30),
  ('Sunbiz – fees', 'https://dos.fl.gov/sunbiz/forms/fees/', 'Official state filing fees.', 'client', 40),
  ('IRS – apply for an EIN', 'https://www.irs.gov/businesses/small-businesses-self-employed/apply-for-an-employer-identification-number-ein-online', 'Free online EIN application from the IRS.', 'client', 50),
  ('Florida Department of Revenue – tax registration', 'https://floridarevenue.com/taxes/registration/', 'Register for sales tax, reemployment tax and other Florida taxes.', 'client', 60),
  ('Sunbiz – forms and e-filing', 'https://dos.fl.gov/sunbiz/forms/', 'All Division of Corporations forms (amendments, RA changes, reinstatements).', 'staff', 10),
  ('USPTO – trademark search', 'https://tmsearch.uspto.gov/', 'Basic trademark search for Launch Pack clients.', 'staff', 20),
  ('USPS – PS Form 1583', 'https://about.usps.com/forms/ps1583.pdf', 'CMRA mail authorization form clients must sign.', 'staff', 30)
) v(title, url, description, audience, sort)
where not exists (select 1 from public.resources);
