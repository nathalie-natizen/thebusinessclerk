-- Florida company records (our own copy of the Sunbiz data files) for the "find your company" lookup.
-- Filled by the nightly GitHub Action (scripts/sunbiz). Public record data; read only through /api/sunbiz/search.
create extension if not exists pg_trgm;

-- Same cleanup for stored names and typed searches: capitals, letters/numbers only, single spaces
create or replace function public.sunbiz_norm(t text) returns text language sql immutable parallel safe as $$
  select btrim(regexp_replace(regexp_replace(upper(coalesce(t, '')), '[^A-Z0-9& ]', ' ', 'g'), '\s+', ' ', 'g'))
$$;

create table if not exists public.sunbiz_entities (
  doc_number text primary key,
  name text not null,
  name_norm text generated always as (public.sunbiz_norm(name)) stored,
  status text,                -- A = active, I = inactive
  filing_type text,           -- FLAL (FL LLC), DOMP (FL corp), FORL, FORP, DOMNP, ...
  file_date date,
  last_txn_date date,
  fei text,
  principal jsonb,            -- {line1, line2, city, state, zip, country}
  mailing jsonb,
  ra jsonb,                   -- {name, type, line1, city, state, zip}
  officers jsonb,             -- [{title, type, name, line1, city, state, zip}] (first 6)
  more_officers boolean default false,
  reports jsonb,              -- [{year, date}] last 3 annual reports
  updated_at timestamptz default now()
);
create index if not exists sunbiz_name_prefix on public.sunbiz_entities (name_norm text_pattern_ops);
create index if not exists sunbiz_name_trgm on public.sunbiz_entities using gin (name_norm gin_trgm_ops);
alter table public.sunbiz_entities enable row level security; -- no policies: only the server (service role) reads it

create table if not exists public.sunbiz_sync_log (
  id bigserial primary key,
  mode text not null,          -- full | daily
  source_file text not null,
  rows_read integer,
  rows_kept integer,
  finished_at timestamptz default now()
);
alter table public.sunbiz_sync_log enable row level security;

-- Search: names starting with the text first, then other names containing it; active companies first
create or replace function public.sunbiz_search(q text, lim int default 10)
returns setof public.sunbiz_entities language plpgsql stable as $$
declare n text := public.sunbiz_norm(q); got int;
begin
  if length(n) < 2 then return; end if;
  return query select * from public.sunbiz_entities s where s.name_norm like n || '%'
    order by (s.status = 'A') desc, length(s.name_norm), s.name_norm limit lim;
  get diagnostics got = row_count;
  if got >= lim or length(n) < 3 then return; end if;
  return query select * from public.sunbiz_entities s where s.name_norm like '%' || n || '%' and s.name_norm not like n || '%'
    order by (s.status = 'A') desc, similarity(s.name_norm, n) desc, s.name_norm limit lim - got;
end $$;
revoke all on function public.sunbiz_search(text, int) from public, anon, authenticated;
grant execute on function public.sunbiz_search(text, int) to service_role;
