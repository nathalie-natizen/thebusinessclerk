-- Forwarding speed (client's default + per item request)
alter table public.mail_preferences add column if not exists forward_shipping text not null default 'first_class'
  check (forward_shipping in ('first_class','priority','express','courier_overnight'));
alter table public.mail_items add column if not exists forward_shipping text
  check (forward_shipping in ('first_class','priority','express','courier_overnight'));
