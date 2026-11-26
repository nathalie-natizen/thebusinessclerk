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
