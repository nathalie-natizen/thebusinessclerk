-- Staff review fixes: whether the client was notified on each order step; company addresses
alter table public.order_events add column if not exists notified boolean;
alter table public.entities add column if not exists principal_address text;
alter table public.entities add column if not exists mailing_address text;
select email, role from public.profiles where role in ('staff','admin');
