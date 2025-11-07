-- ==================================================
-- Script 004: Agregar sistema de contenido a cursos
-- ==================================================
-- Este script agrega la columna 'content' a la tabla courses
-- para almacenar la estructura del curso en formato JSONB

-- Agregar columna content a la tabla courses
ALTER TABLE public.courses 
ADD COLUMN IF NOT EXISTS content JSONB DEFAULT '{"modules": []}'::jsonb;

-- Crear índice para búsquedas eficientes en el contenido JSON
CREATE INDEX IF NOT EXISTS idx_courses_content ON public.courses USING gin (content);

-- Comentario descriptivo de la columna
COMMENT ON COLUMN public.courses.content IS 'Estructura del curso en formato JSON: módulos, lecciones, recursos y materiales';

-- Función auxiliar para validar la estructura del contenido
CREATE OR REPLACE FUNCTION validate_course_content()
RETURNS TRIGGER AS $$
BEGIN
  -- Verificar que content tenga la estructura mínima
  IF NEW.content IS NOT NULL AND NOT (NEW.content ? 'modules') THEN
    RAISE EXCEPTION 'El contenido del curso debe tener una propiedad "modules"';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para validar el contenido antes de insertar/actualizar
DROP TRIGGER IF EXISTS validate_course_content_trigger ON public.courses;
CREATE TRIGGER validate_course_content_trigger
  BEFORE INSERT OR UPDATE ON public.courses
  FOR EACH ROW
  EXECUTE FUNCTION validate_course_content();

-- ==================================================
-- Configuración de Supabase Storage
-- ==================================================
-- NOTA: Estos buckets deben crearse desde el dashboard de Supabase
-- o mediante la consola web, ya que requieren permisos especiales

-- Instrucciones para crear buckets:
-- 1. Ir a Storage en Supabase Dashboard
-- 2. Crear bucket 'course-documents' con configuración pública
-- 3. Crear bucket 'course-images' con configuración pública

-- Políticas de Storage (ejecutar desde el dashboard de Supabase):
/*
-- Para course-documents:
CREATE POLICY "Public Access for Documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'course-documents');

CREATE POLICY "Instructors can upload documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'course-documents' AND
  auth.uid() IN (
    SELECT id FROM public.profiles WHERE role IN ('instructor', 'admin')
  )
);

CREATE POLICY "Instructors can delete own documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'course-documents' AND
  auth.uid() IN (
    SELECT id FROM public.profiles WHERE role IN ('instructor', 'admin')
  )
);

-- Para course-images:
CREATE POLICY "Public Access for Images"
ON storage.objects FOR SELECT
USING (bucket_id = 'course-images');

CREATE POLICY "Instructors can upload images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'course-images' AND
  auth.uid() IN (
    SELECT id FROM public.profiles WHERE role IN ('instructor', 'admin')
  )
);
*/

-- ==================================================
-- Funciones auxiliares para gestión de progreso
-- ==================================================

-- Función para calcular el progreso de un estudiante en un curso
CREATE OR REPLACE FUNCTION calculate_course_progress(
  p_student_id UUID,
  p_course_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  total_lessons INTEGER := 0;
  completed_lessons INTEGER := 0;
  course_content JSONB;
  module_item JSONB;
  lesson_item JSONB;
BEGIN
  -- Obtener el contenido del curso
  SELECT content INTO course_content
  FROM public.courses
  WHERE id = p_course_id;
  
  -- Si no hay contenido, retornar 0
  IF course_content IS NULL OR NOT (course_content ? 'modules') THEN
    RETURN 0;
  END IF;
  
  -- Contar total de lecciones
  FOR module_item IN SELECT * FROM jsonb_array_elements(course_content->'modules')
  LOOP
    IF module_item ? 'lessons' THEN
      total_lessons := total_lessons + jsonb_array_length(module_item->'lessons');
    END IF;
  END LOOP;
  
  -- Si no hay lecciones, retornar 0
  IF total_lessons = 0 THEN
    RETURN 0;
  END IF;
  
  -- TODO: Aquí se contarían las lecciones completadas cuando se implemente
  -- el sistema de seguimiento de progreso por lección
  
  -- Por ahora retornamos 0, esto se actualizará cuando se implementen
  -- las tablas de progreso de lecciones
  RETURN 0;
END;
$$ LANGUAGE plpgsql;

-- Comentario de la función
COMMENT ON FUNCTION calculate_course_progress IS 'Calcula el porcentaje de progreso de un estudiante en un curso basado en lecciones completadas';
