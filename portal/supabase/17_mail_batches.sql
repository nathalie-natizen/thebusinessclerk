-- Scheduled forwarding: client picks the weekday; each cycle creates a "Mail forwarding" task in the staff pipeline
alter table public.mail_preferences add column if not exists forward_day int not null default 5 check (forward_day between 1 and 5);
alter table public.mail_items add column if not exists batch_order_id uuid references public.orders(id) on delete set null;
