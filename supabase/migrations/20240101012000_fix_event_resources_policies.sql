-- =====================================================
-- FIX: Políticas RLS para event_resources
-- =====================================================
-- Este script corrige las políticas para que los usuarios
-- puedan ver los recursos de eventos a los que asistieron

-- Primero, eliminar las políticas existentes si hay conflicto
DROP POLICY IF EXISTS "Users can view event resources" ON event_resources;
DROP POLICY IF EXISTS "Organizers can insert resources" ON event_resources;
DROP POLICY IF EXISTS "Organizers can update resources" ON event_resources;
DROP POLICY IF EXISTS "Organizers can delete resources" ON event_resources;

-- =====================================================
-- POLÍTICA 1: Ver recursos
-- Los usuarios pueden ver recursos de eventos a los que:
-- 1. Han asistido (is_attended = true)
-- 2. Son organizadores del evento
-- =====================================================
CREATE POLICY "Users can view event resources" ON event_resources
  FOR SELECT
  USING (
    -- El usuario organizó el evento
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_resources.event_id
      AND events.organizer_id = auth.uid()
    )
    OR
    -- El usuario asistió al evento
    EXISTS (
      SELECT 1 FROM event_registrations
      WHERE event_registrations.event_id = event_resources.event_id
      AND event_registrations.user_id = auth.uid()
      AND event_registrations.is_attended = true
    )
  );

-- =====================================================
-- POLÍTICA 2: Insertar recursos
-- Solo los organizadores pueden subir recursos a sus eventos
-- =====================================================
CREATE POLICY "Organizers can insert resources" ON event_resources
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_resources.event_id
      AND events.organizer_id = auth.uid()
    )
  );

-- =====================================================
-- POLÍTICA 3: Actualizar recursos
-- Solo los organizadores pueden actualizar recursos de sus eventos
-- =====================================================
CREATE POLICY "Organizers can update resources" ON event_resources
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_resources.event_id
      AND events.organizer_id = auth.uid()
    )
  );

-- =====================================================
-- POLÍTICA 4: Eliminar recursos
-- Solo los organizadores pueden eliminar recursos de sus eventos
-- =====================================================
CREATE POLICY "Organizers can delete resources" ON event_resources
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_resources.event_id
      AND events.organizer_id = auth.uid()
    )
  );

-- =====================================================
-- VERIFICACIÓN
-- =====================================================
-- Verifica que las políticas se crearon correctamente:
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'event_resources'
ORDER BY policyname;

-- =====================================================
-- NOTAS
-- =====================================================
-- Después de ejecutar este script:
-- 1. Los organizadores pueden subir, ver, actualizar y eliminar recursos
-- 2. Los usuarios que asistieron pueden VER los recursos
-- 3. Los usuarios que no asistieron NO pueden ver los recursos
