-- THE BUSINESS CLERK – portal database
-- Run this once in Supabase: SQL Editor → New query → paste → Run.

-- ---------- Profiles (one per login) ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  phone text,                       -- E.164 format, e.g. +14075551234
  sms_opt_in boolean not null default false,
  role text not null default 'client' check (role in ('client','staff','admin')),
  created_at timestamptz not null default now()
);

-- Create a profile automatically when someone signs in for the first time
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email) on conflict do nothing;
  -- link any pending invitations for this email
  insert into public.entity_members (entity_id, user_id)
    select entity_id, new.id from public.invitations where lower(email) = lower(new.email)
    on conflict do nothing;
  delete from public.invitations where lower(email) = lower(new.email);
  return new;
end $$;

-- ---------- Entities (each client company) ----------
create sequence if not exists public.file_number_seq start 10001;

create table if not exists public.entities (
  id uuid primary key default gen_random_uuid(),
  file_number text unique not null default ('TBC-' || nextval('public.file_number_seq')),
  legal_name text not null,
  entity_type text not null default 'LLC' check (entity_type in ('LLC','Corporation','Nonprofit','Other')),
  sunbiz_doc_number text,
  formation_date date,
  status text not null default 'active' check (status in ('active','pending','inactive','dissolved')),
  registered_agent boolean not null default false,
  mail_service boolean not null default false,
  stripe_customer_id text unique,
  created_at timestamptz not null default now()
);

-- Staff-only notes, kept in a separate table so clients can never read them
create table if not exists public.entity_notes (
  entity_id uuid primary key references public.entities(id) on delete cascade,
  notes text,
  updated_at timestamptz not null default now()
);

-- Clients who can see an entity
create table if not exists public.entity_members (
  entity_id uuid references public.entities(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  primary key (entity_id, user_id)
);

-- Emails invited to an entity before they have signed in
create table if not exists public.invitations (
  email text not null,
  entity_id uuid references public.entities(id) on delete cascade,
  primary key (email, entity_id)
);

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Mail handling preferences ----------
create table if not exists public.mail_preferences (
  entity_id uuid primary key references public.entities(id) on delete cascade,
  handling text not null default 'scan_hold'
    check (handling in ('scan_hold','scan_shred','scan_forward_monthly','scan_forward_quarterly','forward_unopened','hold_pickup')),
  -- scan_hold: scan and keep originals 90 days, then shred
  -- scan_shred: scan and shred originals after 30 days
  -- scan_forward_monthly / quarterly: scan and mail originals in a batch
  -- forward_unopened: forward each item unopened (no scan)
  -- hold_pickup: hold originals for pickup at the office
  forward_name text, forward_line1 text, forward_line2 text, forward_city text,
  forward_state text, forward_postal text, forward_country text default 'United States',
  updated_at timestamptz not null default now()
);

-- ---------- Mail items (registered agent + business mail) ----------
create table if not exists public.mail_items (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid not null references public.entities(id) on delete cascade,
  received_at timestamptz not null default now(),
  sender text,
  category text not null default 'general' check (category in ('service_of_process','state_notice','government','general','package')),
  urgent boolean not null default false,
  description text,
  file_path text,                    -- path in the "mail" storage bucket
  status text not null default 'received'
    check (status in ('received','scanned','forward_requested','forwarded','shred_requested','shredded','held','picked_up')),
  client_request text,               -- what the client asked for this item
  tracking_number text,
  received_by uuid references public.profiles(id),
  notified_at timestamptz,
  viewed_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---------- Documents (filed articles, EIN letters, certificates…) ----------
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid not null references public.entities(id) on delete cascade,
  title text not null,
  category text not null default 'filing' check (category in ('formation','filing','annual_report','ein','certificate','agreement','other')),
  file_path text not null,           -- path in the "documents" storage bucket
  uploaded_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

-- ---------- Orders (formations, filings, annual reports…) ----------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid not null references public.entities(id) on delete cascade,
  service text not null,
  status text not null default 'received'
    check (status in ('received','payment_confirmed','information_needed','in_review','submitted','completed','delivered','cancelled')),
  stripe_session_id text,
  amount_cents integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_events (
  id bigserial primary key,
  order_id uuid not null references public.orders(id) on delete cascade,
  status text not null,
  note text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

-- ---------- Notification log ----------
create table if not exists public.notifications (
  id bigserial primary key,
  entity_id uuid references public.entities(id) on delete cascade,
  channel text not null check (channel in ('email','sms')),
  recipient text not null,
  subject text,
  status text not null,
  error text,
  created_at timestamptz not null default now()
);

-- ---------- Helper functions for security rules ----------
create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role in ('staff','admin'));
$$;

create or replace function public.is_member(e uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.entity_members where entity_id = e and user_id = auth.uid());
$$;

-- ---------- Row Level Security: clients only ever see their own entities ----------
alter table public.profiles enable row level security;
alter table public.entities enable row level security;
alter table public.entity_members enable row level security;
alter table public.invitations enable row level security;
alter table public.mail_preferences enable row level security;
alter table public.mail_items enable row level security;
alter table public.documents enable row level security;
alter table public.orders enable row level security;
alter table public.order_events enable row level security;
alter table public.notifications enable row level security;
alter table public.entity_notes enable row level security;

-- profiles: you see/edit yourself (not your role); staff see all
drop policy if exists p_profiles_self on public.profiles;
create policy p_profiles_self on public.profiles for select using (id = auth.uid() or public.is_staff());
drop policy if exists p_profiles_update on public.profiles;
create policy p_profiles_update on public.profiles for update using (id = auth.uid() or public.is_staff());

-- Only staff/admin can change anyone's role
create or replace function public.protect_role() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role and not public.is_staff() and auth.uid() is not null then
    raise exception 'Not allowed to change role';
  end if;
  return new;
end $$;
drop trigger if exists protect_role on public.profiles;
create trigger protect_role before update on public.profiles for each row execute function public.protect_role();

-- entities
drop policy if exists p_entities_read on public.entities;
create policy p_entities_read on public.entities for select using (public.is_member(id) or public.is_staff());
drop policy if exists p_entities_staff on public.entities;
create policy p_entities_staff on public.entities for all using (public.is_staff()) with check (public.is_staff());

-- memberships / invitations
drop policy if exists p_members_read on public.entity_members;
create policy p_members_read on public.entity_members for select using (user_id = auth.uid() or public.is_staff());
drop policy if exists p_members_staff on public.entity_members;
create policy p_members_staff on public.entity_members for all using (public.is_staff()) with check (public.is_staff());
drop policy if exists p_invites_staff on public.invitations;
create policy p_invites_staff on public.invitations for all using (public.is_staff()) with check (public.is_staff());

-- mail preferences: members can read and update their own
drop policy if exists p_prefs_read on public.mail_preferences;
create policy p_prefs_read on public.mail_preferences for select using (public.is_member(entity_id) or public.is_staff());
drop policy if exists p_prefs_write on public.mail_preferences;
create policy p_prefs_write on public.mail_preferences for insert with check (public.is_member(entity_id) or public.is_staff());
drop policy if exists p_prefs_update on public.mail_preferences;
create policy p_prefs_update on public.mail_preferences for update using (public.is_member(entity_id) or public.is_staff());

-- mail items: members read; staff manage. Client requests go through the server (API) only.
drop policy if exists p_mail_read on public.mail_items;
create policy p_mail_read on public.mail_items for select using (public.is_member(entity_id) or public.is_staff());
drop policy if exists p_mail_staff on public.mail_items;
create policy p_mail_staff on public.mail_items for all using (public.is_staff()) with check (public.is_staff());

-- documents
drop policy if exists p_docs_read on public.documents;
create policy p_docs_read on public.documents for select using (public.is_member(entity_id) or public.is_staff());
drop policy if exists p_docs_staff on public.documents;
create policy p_docs_staff on public.documents for all using (public.is_staff()) with check (public.is_staff());

-- orders and events
drop policy if exists p_orders_read on public.orders;
create policy p_orders_read on public.orders for select using (public.is_member(entity_id) or public.is_staff());
drop policy if exists p_orders_staff on public.orders;
create policy p_orders_staff on public.orders for all using (public.is_staff()) with check (public.is_staff());
drop policy if exists p_events_read on public.order_events;
create policy p_events_read on public.order_events for select using (
  public.is_staff() or exists (select 1 from public.orders o where o.id = order_id and public.is_member(o.entity_id)));
drop policy if exists p_events_staff on public.order_events;
create policy p_events_staff on public.order_events for all using (public.is_staff()) with check (public.is_staff());

-- staff notes: staff only
drop policy if exists p_notes_staff on public.entity_notes;
create policy p_notes_staff on public.entity_notes for all using (public.is_staff()) with check (public.is_staff());

-- notifications: staff only
drop policy if exists p_notif_staff on public.notifications;
create policy p_notif_staff on public.notifications for all using (public.is_staff()) with check (public.is_staff());

-- ---------- Private storage buckets ----------
insert into storage.buckets (id, name, public) values ('mail', 'mail', false) on conflict do nothing;
insert into storage.buckets (id, name, public) values ('documents', 'documents', false) on conflict do nothing;

-- Files are stored as <entity_id>/<file>. Members read their entity's files; staff read/write all.
drop policy if exists s_read on storage.objects;
create policy s_read on storage.objects for select using (
  bucket_id in ('mail','documents') and (public.is_staff() or public.is_member(((storage.foldername(name))[1])::uuid)));
drop policy if exists s_staff_write on storage.objects;
create policy s_staff_write on storage.objects for insert with check (bucket_id in ('mail','documents') and public.is_staff());
drop policy if exists s_staff_update on storage.objects;
create policy s_staff_update on storage.objects for update using (bucket_id in ('mail','documents') and public.is_staff());
drop policy if exists s_staff_delete on storage.objects;
create policy s_staff_delete on storage.objects for delete using (bucket_id in ('mail','documents') and public.is_staff());

-- ---------- Make yourself admin (run AFTER your first sign-in) ----------
-- update public.profiles set role = 'admin' where email = 'hello@thebusinessclerk.com';

-- ===== Added later (also in 02_resources_and_staff.sql) =====
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

-- Forwarding speed (client's default + per item request)
alter table public.mail_preferences add column if not exists forward_shipping text not null default 'first_class'
  check (forward_shipping in ('first_class','priority','express','courier_overnight'));
alter table public.mail_items add column if not exists forward_shipping text
  check (forward_shipping in ('first_class','priority','express','courier_overnight'));

-- Orders from the website intake: service kind, intake details, awaiting-payment status
alter table public.orders add column if not exists kind text;
alter table public.orders add column if not exists details jsonb;
alter table public.orders add column if not exists source text not null default 'staff';
alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check check (status in
  ('awaiting_payment','received','payment_confirmed','information_needed','in_review','submitted','completed','delivered','cancelled'));
alter table public.entities add column if not exists ein text;
alter table public.entities add column if not exists contact_name text;
alter table public.entities add column if not exists contact_email text;
alter table public.entities add column if not exists contact_phone text;
alter table public.entities add column if not exists language text default 'en';
create index if not exists orders_status_idx on public.orders(status);

-- Carrier tracking for forwarded mail (EasyPost)
alter table public.mail_items add column if not exists carrier text;
alter table public.mail_items add column if not exists tracker_id text;
alter table public.mail_items add column if not exists tracking_status text;
alter table public.mail_items add column if not exists tracking_url text;
alter table public.mail_items add column if not exists est_delivery timestamptz;
alter table public.mail_items add column if not exists delivered_at timestamptz;
alter table public.mail_items drop constraint if exists mail_items_status_check;
alter table public.mail_items add constraint mail_items_status_check check (status in
  ('received','scanned','forward_requested','forwarded','delivered','shred_requested','shredded','held','picked_up'));
create index if not exists mail_items_tracker_idx on public.mail_items(tracker_id);

-- Usage-based mail billing: price list (editable by staff) and monthly statements
create table if not exists public.mail_pricing (
  id int primary key default 1 check (id = 1),
  base_cents int not null default 2000,                -- monthly subscription price (charged by the Stripe subscription)
  tiers jsonb not null default '[{"up_to":25,"cents":2000},{"up_to":60,"cents":3500},{"up_to":120,"cents":5500},{"up_to":250,"cents":9500}]',
  over_cents int not null default 40,                  -- per item above the last tier
  package_cents int not null default 300,              -- per package received
  forward_cents int not null default 200,              -- handling per forwarded item (postage billed at cost on top)
  updated_at timestamptz not null default now()
);
insert into public.mail_pricing (id) values (1) on conflict do nothing;
alter table public.mail_pricing enable row level security;
drop policy if exists p_pricing_read on public.mail_pricing;
create policy p_pricing_read on public.mail_pricing for select using (auth.uid() is not null);
drop policy if exists p_pricing_staff on public.mail_pricing;
create policy p_pricing_staff on public.mail_pricing for all using (public.is_staff()) with check (public.is_staff());

alter table public.mail_items add column if not exists postage_cents int;

create table if not exists public.mail_statements (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid not null references public.entities(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  items_count int not null default 0,
  lines jsonb not null default '[]',          -- charge lines
  items jsonb not null default '[]',          -- every mail item counted, for the client's breakdown
  base_cents int not null default 0,
  total_cents int not null default 0,         -- amount charged on top of the subscription
  status text not null default 'draft' check (status in ('draft','no_charge','invoiced','paid','failed','needs_card')),
  stripe_invoice_id text, invoice_url text, error text,
  created_at timestamptz not null default now(),
  unique (entity_id, period_start)
);
alter table public.mail_statements enable row level security;
drop policy if exists p_stmt_read on public.mail_statements;
create policy p_stmt_read on public.mail_statements for select using (public.is_member(entity_id) or public.is_staff());
drop policy if exists p_stmt_staff on public.mail_statements;
create policy p_stmt_staff on public.mail_statements for all using (public.is_staff()) with check (public.is_staff());

-- Mail service v2: receive & log (base), forward per item, open & scan per item with auto-selected scan level
drop table if exists public.mail_pricing;
create table public.mail_pricing (
  id int primary key default 1 check (id = 1),
  base_cents int not null default 2000,            -- monthly plan (Stripe subscription)
  included_items int not null default 30,          -- items logged per month included in the plan
  over_item_cents int not null default 50,         -- per item above that
  forward_cents int not null default 250,          -- per forwarded item, postage at cost on top
  package_cents int not null default 300,          -- per package received
  scan_pages int not null default 10,              -- pages included per scan
  page_cents int not null default 25,              -- per page above that
  scan_levels jsonb not null default '[{"name":"Pay as you go","cents":0,"included":0,"extra_cents":250},{"name":"Scan 10","cents":1900,"included":10,"extra_cents":225},{"name":"Scan 25","cents":3900,"included":25,"extra_cents":200},{"name":"Scan 50","cents":6900,"included":50,"extra_cents":175},{"name":"Scan 100","cents":11900,"included":100,"extra_cents":150}]',
  updated_at timestamptz not null default now()
);
insert into public.mail_pricing (id) values (1);
alter table public.mail_pricing enable row level security;
create policy p_pricing_read on public.mail_pricing for select using (auth.uid() is not null);
create policy p_pricing_staff on public.mail_pricing for all using (public.is_staff()) with check (public.is_staff());

-- Envelope photo stays in file_path; the opened & scanned contents go in content_path
alter table public.mail_items add column if not exists content_path text;
alter table public.mail_items add column if not exists pages int;
alter table public.mail_items add column if not exists scanned_at timestamptz;
alter table public.mail_items drop constraint if exists mail_items_status_check;
alter table public.mail_items add constraint mail_items_status_check check (status in
  ('received','scan_requested','scanned','forward_requested','forwarded','delivered','shred_requested','shredded','held','picked_up'));

-- New default handling choices
alter table public.mail_preferences drop constraint if exists mail_preferences_handling_check;
update public.mail_preferences set handling = case handling
  when 'scan_hold' then 'notify' when 'scan_shred' then 'scan_all' when 'scan_forward_monthly' then 'forward_monthly'
  when 'scan_forward_quarterly' then 'forward_monthly' when 'forward_unopened' then 'forward_each' else handling end;
alter table public.mail_preferences alter column handling set default 'notify';
alter table public.mail_preferences add constraint mail_preferences_handling_check check (handling in
  ('notify','scan_all','forward_each','forward_weekly','forward_monthly','hold_pickup'));
