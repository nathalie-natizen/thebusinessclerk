-- Annual bundle (registered agent + annual report + business address) and the new $25 mail base
alter table public.entities add column if not exists bundle boolean not null default false;
update public.mail_pricing set base_cents = 2500 where id = 1;
