-- Structured Form 1583 fields so the portal can fill the official USPS PDF
alter table public.cmra_applications add column if not exists last_name text;
alter table public.cmra_applications add column if not exists first_name text;
alter table public.cmra_applications add column if not exists middle_initial text;
alter table public.cmra_applications add column if not exists home_street text;
alter table public.cmra_applications add column if not exists home_city text;
alter table public.cmra_applications add column if not exists home_state text;
alter table public.cmra_applications add column if not exists home_zip text;
alter table public.cmra_applications add column if not exists home_country text default 'United States';
alter table public.cmra_applications add column if not exists business_phone text;
alter table public.cmra_applications add column if not exists id1_number text;
alter table public.cmra_applications add column if not exists protected_individual boolean not null default false;
alter table public.cmra_applications drop constraint if exists cmra_applications_witness_method_check;
update public.cmra_applications set witness_method = 'notary' where witness_method = 'video';
alter table public.cmra_applications add constraint cmra_applications_witness_method_check check (witness_method in ('notary','ron','in_person'));
