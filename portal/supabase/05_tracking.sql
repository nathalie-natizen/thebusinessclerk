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
