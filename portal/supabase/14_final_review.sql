-- Pipeline: "Final review" (quality check) stage before an order is archived as completed
alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check check (status in
  ('awaiting_payment','received','payment_confirmed','information_needed','in_review','submitted','final_review','completed','delivered','cancelled'));
