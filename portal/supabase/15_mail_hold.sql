-- Mail with no instruction: notice sent after 30 days; ordinary mail may be shredded 15 days later
alter table public.mail_items add column if not exists hold_notice_at timestamptz;
