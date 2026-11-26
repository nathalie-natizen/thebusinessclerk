-- Postage label / receipt copy for forwarded mail (until label buying is integrated)
alter table public.mail_items add column if not exists label_path text;
