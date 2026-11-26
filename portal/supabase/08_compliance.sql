-- USPS Form 1583 (mail service) compliance file per company: applicant info, two IDs, signed form, verification
create table if not exists public.cmra_applications (
  entity_id uuid primary key references public.entities(id) on delete cascade,
  status text not null default 'not_started' check (status in ('not_started','in_progress','submitted','needs_changes','verified','filed')),
  applicant_name text, applicant_email text, applicant_phone text, home_address text,
  business_name text, business_address text, business_type text, registration_place text,
  receivers text,                      -- other people authorized to receive mail at this address
  id1_type text, id1_issuer text, id1_expires date, id1_path text,   -- primary photo ID
  id2_type text, id2_issuer text, id2_expires date, id2_path text,   -- secondary ID showing the home address
  form_path text,                      -- signed (and notarized or witnessed) PS Form 1583
  witness_method text check (witness_method in ('video','in_person','notary')),
  client_note text, staff_note text,
  submitted_at timestamptz, verified_at timestamptz, verified_by uuid references public.profiles(id), crd_filed_at timestamptz,
  updated_at timestamptz not null default now()
);
alter table public.cmra_applications enable row level security;
drop policy if exists p_cmra_read on public.cmra_applications;
create policy p_cmra_read on public.cmra_applications for select using (public.is_member(entity_id) or public.is_staff());
drop policy if exists p_cmra_staff on public.cmra_applications;
create policy p_cmra_staff on public.cmra_applications for all using (public.is_staff()) with check (public.is_staff());
-- Clients write only through the portal's server code (which checks they belong to the company)

-- Private bucket for ID copies and signed forms. Clients may upload into their own company's folder; nobody else can read them.
insert into storage.buckets (id, name, public) values ('compliance', 'compliance', false) on conflict do nothing;
drop policy if exists s_comp_read on storage.objects;
create policy s_comp_read on storage.objects for select using (bucket_id = 'compliance' and (public.is_staff() or public.is_member(((storage.foldername(name))[1])::uuid)));
drop policy if exists s_comp_client_upload on storage.objects;
create policy s_comp_client_upload on storage.objects for insert with check (bucket_id = 'compliance' and (public.is_staff() or public.is_member(((storage.foldername(name))[1])::uuid)));
drop policy if exists s_comp_staff_delete on storage.objects;
create policy s_comp_staff_delete on storage.objects for delete using (bucket_id = 'compliance' and public.is_staff());
