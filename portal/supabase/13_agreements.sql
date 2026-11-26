-- Client Service Agreement and dated addenda, stored exactly as accepted
create table if not exists public.agreements (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid not null references public.entities(id) on delete cascade,
  doc_type text not null check (doc_type in ('agreement','addendum')),
  number int not null default 0,
  services text[] not null default '{}',
  version text not null,
  content text not null,
  signer_name text not null,
  signer_email text,
  user_id uuid,
  ip text,
  accepted_at timestamptz not null default now()
);
create index if not exists agreements_entity on public.agreements(entity_id, accepted_at);
alter table public.agreements enable row level security;
drop policy if exists p_agreements_read on public.agreements;
create policy p_agreements_read on public.agreements for select using (public.is_member(entity_id) or public.is_staff());
drop policy if exists p_agreements_staff on public.agreements;
create policy p_agreements_staff on public.agreements for all using (public.is_staff()) with check (public.is_staff());
