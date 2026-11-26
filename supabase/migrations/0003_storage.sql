-- Segunda Oportunidad · buckets de Storage
--  prendas       público  → fotos de las prendas (cualquiera las ve)
--  documentos    privado  → fotos de la cédula de vendedores (dueño y admin)
--  comprobantes  privado  → comprobantes de transferencia (dueño y admin)
-- Cada usuario sube solo dentro de su carpeta: <user_id>/archivo.jpg

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('prendas', 'prendas', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('documentos', 'documentos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('comprobantes', 'comprobantes', false, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
on conflict (id) do nothing;

-- prendas (público para leer)
create policy "prendas: leer" on storage.objects for select
  using (bucket_id = 'prendas');
create policy "prendas: subir en su carpeta" on storage.objects for insert to authenticated
  with check (bucket_id = 'prendas' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "prendas: borrar lo propio" on storage.objects for delete to authenticated
  using (bucket_id = 'prendas' and (storage.foldername(name))[1] = auth.uid()::text);

-- documentos (privado)
create policy "documentos: leer propio o admin" on storage.objects for select to authenticated
  using (bucket_id = 'documentos' and ((storage.foldername(name))[1] = auth.uid()::text or public.es_admin()));
create policy "documentos: subir en su carpeta" on storage.objects for insert to authenticated
  with check (bucket_id = 'documentos' and (storage.foldername(name))[1] = auth.uid()::text);

-- comprobantes (privado)
create policy "comprobantes: leer propio o admin" on storage.objects for select to authenticated
  using (bucket_id = 'comprobantes' and ((storage.foldername(name))[1] = auth.uid()::text or public.es_admin()));
create policy "comprobantes: subir en su carpeta" on storage.objects for insert to authenticated
  with check (bucket_id = 'comprobantes' and (storage.foldername(name))[1] = auth.uid()::text);
