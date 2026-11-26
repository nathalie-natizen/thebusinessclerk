-- Company team: owners and members (manager, partner, accountant…), each with their own notification preferences
alter table public.entity_members add column if not exists role text not null default 'owner' check (role in ('owner','member'));
alter table public.entity_members add column if not exists title text;
alter table public.entity_members add column if not exists notify jsonb not null default '{}'::jsonb;
alter table public.entity_members add column if not exists created_at timestamptz not null default now();
alter table public.invitations add column if not exists name text;
alter table public.invitations add column if not exists phone text;
alter table public.invitations add column if not exists title text;
alter table public.invitations add column if not exists role text not null default 'owner' check (role in ('owner','member'));
alter table public.invitations add column if not exists created_at timestamptz not null default now();

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, role, full_name, phone)
    values (new.id, new.email, coalesce((select role from public.staff_emails where lower(email) = lower(new.email)), 'client'),
      (select name from public.invitations where lower(email) = lower(new.email) and name is not null limit 1),
      (select phone from public.invitations where lower(email) = lower(new.email) and phone is not null limit 1))
    on conflict do nothing;
  insert into public.entity_members (entity_id, user_id, role, title)
    select entity_id, new.id, role, title from public.invitations where lower(email) = lower(new.email)
    on conflict do nothing;
  delete from public.invitations where lower(email) = lower(new.email);
  return new;
end $$;
