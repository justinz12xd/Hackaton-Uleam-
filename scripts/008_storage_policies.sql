-- =====================================================
-- POLÍTICAS DE STORAGE PARA BUCKET: Recursos-Eventos
-- =====================================================
-- Ejecutar estas políticas en el Dashboard de Supabase
-- Storage > Recursos-Eventos > Policies

-- 1. Permitir a todos ver los recursos (SELECT/READ)
CREATE POLICY "Public can view event resources"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'Recursos-Eventos');

-- 2. Permitir a usuarios autenticados subir archivos (INSERT)
CREATE POLICY "Authenticated users can upload resources"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'Recursos-Eventos' 
  AND auth.role() = 'authenticated'
);

-- 3. Permitir a los organizadores actualizar sus archivos (UPDATE)
CREATE POLICY "Users can update their own resources"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'Recursos-Eventos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 4. Permitir a los organizadores eliminar sus archivos (DELETE)
CREATE POLICY "Users can delete their own resources"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'Recursos-Eventos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- =====================================================
-- VERIFICACIÓN DEL BUCKET
-- =====================================================
-- Ejecutar esta consulta para verificar que el bucket existe:
-- SELECT * FROM storage.buckets WHERE name = 'Recursos-Eventos';

-- =====================================================
-- NOTAS IMPORTANTES
-- =====================================================
-- 1. El bucket debe ser PÚBLICO (public = true)
-- 2. Las políticas deben aplicarse en: Storage > Policies (no en Database > Policies)
-- 3. Verificar que no haya políticas conflictivas
-- 4. Los archivos se guardan con la estructura: {event_id}/{timestamp}-{filename}
