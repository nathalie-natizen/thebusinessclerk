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
