-- Add progress tracking tables and functions
-- Este script debe ejecutarse DESPUÉS del script 004_add_course_content.sql

-- Tabla para tracking de progreso de lecciones
CREATE TABLE IF NOT EXISTS lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  module_id TEXT NOT NULL, -- ID del módulo en el JSON
  lesson_id TEXT NOT NULL, -- ID de la lección en el JSON
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Evitar duplicados
  UNIQUE(student_id, course_id, module_id, lesson_id)
);

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_lesson_progress_student ON lesson_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_course ON lesson_progress(course_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_completed ON lesson_progress(completed);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_lesson_progress_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Eliminar el trigger si existe
DROP TRIGGER IF EXISTS lesson_progress_updated_at ON lesson_progress;

CREATE TRIGGER lesson_progress_updated_at
  BEFORE UPDATE ON lesson_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_lesson_progress_timestamp();

-- RLS Policies para lesson_progress
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Users can view own progress" ON lesson_progress;
DROP POLICY IF EXISTS "Users can insert own progress" ON lesson_progress;
DROP POLICY IF EXISTS "Users can update own progress" ON lesson_progress;
DROP POLICY IF EXISTS "Instructors can view course progress" ON lesson_progress;
DROP POLICY IF EXISTS "Admins can view all progress" ON lesson_progress;

-- Los estudiantes solo pueden ver y editar su propio progreso
CREATE POLICY "Users can view own progress"
  ON lesson_progress
  FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Users can insert own progress"
  ON lesson_progress
  FOR INSERT
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Users can update own progress"
  ON lesson_progress
  FOR UPDATE
  USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);

-- Los instructores pueden ver el progreso de sus cursos
CREATE POLICY "Instructors can view course progress"
  ON lesson_progress
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = lesson_progress.course_id
      AND courses.instructor_id = auth.uid()
    )
  );

-- Los admins pueden ver todo
CREATE POLICY "Admins can view all progress"
  ON lesson_progress
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Función para calcular el progreso de un curso
-- Eliminar la función existente si existe
DROP FUNCTION IF EXISTS calculate_course_progress(UUID, UUID);

CREATE FUNCTION calculate_course_progress(
  p_student_id UUID,
  p_course_id UUID
)
RETURNS TABLE (
  total_lessons INTEGER,
  completed_lessons INTEGER,
  progress_percentage NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INTEGER as total_lessons,
    COUNT(*) FILTER (WHERE completed = true)::INTEGER as completed_lessons,
    ROUND(
      (COUNT(*) FILTER (WHERE completed = true)::NUMERIC / 
       NULLIF(COUNT(*)::NUMERIC, 0) * 100),
      2
    ) as progress_percentage
  FROM lesson_progress
  WHERE student_id = p_student_id
    AND course_id = p_course_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para marcar lección como completada
-- Eliminar la función existente si existe
DROP FUNCTION IF EXISTS mark_lesson_complete(UUID, UUID, TEXT, TEXT);

CREATE OR REPLACE FUNCTION mark_lesson_complete(
  p_student_id UUID,
  p_course_id UUID,
  p_module_id TEXT,
  p_lesson_id TEXT
)
RETURNS JSON AS $$
DECLARE
  v_progress RECORD;
  v_total INTEGER;
  v_completed INTEGER;
  v_percentage NUMERIC;
BEGIN
  -- Insert o update del progreso
  INSERT INTO lesson_progress (student_id, course_id, module_id, lesson_id, completed, completed_at)
  VALUES (p_student_id, p_course_id, p_module_id, p_lesson_id, true, now())
  ON CONFLICT (student_id, course_id, module_id, lesson_id)
  DO UPDATE SET
    completed = true,
    completed_at = now(),
    updated_at = now();
  
  -- Calcular progreso total
  SELECT * INTO v_progress
  FROM calculate_course_progress(p_student_id, p_course_id);
  
  v_total := v_progress.total_lessons;
  v_completed := v_progress.completed_lessons;
  v_percentage := v_progress.progress_percentage;
  
  -- Retornar resultado
  RETURN json_build_object(
    'success', true,
    'total_lessons', v_total,
    'completed_lessons', v_completed,
    'progress_percentage', v_percentage,
    'course_completed', v_percentage >= 100
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentarios
COMMENT ON TABLE lesson_progress IS 'Tracking del progreso de estudiantes en las lecciones de cada curso';
COMMENT ON FUNCTION calculate_course_progress IS 'Calcula el porcentaje de progreso de un estudiante en un curso';
COMMENT ON FUNCTION mark_lesson_complete IS 'Marca una lección como completada y retorna el progreso actualizado';
