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
