-- ============================================
-- Crear Bucket para Recursos de Eventos
-- ============================================

-- 1. Crear bucket público para recursos de eventos
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-resources', 'event-resources', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Política: Cualquiera puede ver los recursos
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'event-resources');

-- 3. Política: Solo usuarios autenticados pueden subir
CREATE POLICY "Authenticated users can upload event resources"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'event-resources');

-- 4. Política: Solo el dueño puede eliminar
CREATE POLICY "Users can delete own event resources"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'event-resources' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 5. Política: Solo el dueño puede actualizar
CREATE POLICY "Users can update own event resources"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'event-resources' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Verificar que el bucket se creó
SELECT * FROM storage.buckets WHERE id = 'event-resources';
