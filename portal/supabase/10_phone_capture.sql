-- Phone capture: one-time links (QR) that let a client take ID photos and a selfie with their phone camera
alter table public.cmra_applications add column if not exists id1_back_path text;
alter table public.cmra_applications add column if not exists selfie_path text;
create table if not exists public.capture_tokens (
  token text primary key,
  entity_id uuid not null references public.entities(id) on delete cascade,
  created_by uuid references public.profiles(id),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
alter table public.capture_tokens enable row level security;  -- no policies: only the server (service key) reads or writes tokens
