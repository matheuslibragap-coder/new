-- =====================================================================
-- 0006 Storage: bucket privado; o primeiro segmento do caminho é o escritorio_id
-- =====================================================================
insert into storage.buckets (id, name, public)
values ('documentos', 'documentos', false)
on conflict (id) do nothing;

create policy "documentos_select" on storage.objects for select
  using (bucket_id = 'documentos' and public.is_membro(((storage.foldername(name))[1])::uuid));
create policy "documentos_insert" on storage.objects for insert
  with check (bucket_id = 'documentos' and public.is_membro(((storage.foldername(name))[1])::uuid));
create policy "documentos_update" on storage.objects for update
  using (bucket_id = 'documentos' and public.is_membro(((storage.foldername(name))[1])::uuid));
create policy "documentos_delete" on storage.objects for delete
  using (bucket_id = 'documentos' and public.is_membro(((storage.foldername(name))[1])::uuid));
