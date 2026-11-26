-- Failed card payments: shown as a banner to the client and listed for staff until a payment succeeds
alter table public.entities add column if not exists payment_issue jsonb;
