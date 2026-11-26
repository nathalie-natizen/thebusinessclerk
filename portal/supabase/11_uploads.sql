-- Files clients attach to orders (logos, replies). Clients upload into their own company's folder.
insert into storage.buckets (id, name, public) values ('uploads', 'uploads', false) on conflict do nothing;
drop policy if exists s_up_read on storage.objects;
create policy s_up_read on storage.objects for select using (bucket_id = 'uploads' and (public.is_staff() or public.is_member(((storage.foldername(name))[1])::uuid)));
drop policy if exists s_up_insert on storage.objects;
create policy s_up_insert on storage.objects for insert with check (bucket_id = 'uploads' and (public.is_staff() or public.is_member(((storage.foldername(name))[1])::uuid)));
drop policy if exists s_up_delete on storage.objects;
create policy s_up_delete on storage.objects for delete using (bucket_id = 'uploads' and public.is_staff());
