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
