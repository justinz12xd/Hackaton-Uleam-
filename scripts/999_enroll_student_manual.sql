-- Script para inscribir manualmente un estudiante en un curso
-- SOLO PARA PRUEBAS - En producción esto se hace desde la UI

-- 1. Primero, encuentra el ID del estudiante y del curso
-- Ejecuta esto para ver los usuarios:
SELECT id, email, raw_user_meta_data->>'full_name' as name 
FROM auth.users 
LIMIT 10;

-- Ejecuta esto para ver los cursos:
SELECT id, title, instructor_id 
FROM courses 
LIMIT 10;

-- 2. Luego, inscribe al estudiante en el curso
-- REEMPLAZA 'STUDENT_ID' y 'COURSE_ID' con los IDs reales

INSERT INTO course_enrollments (
  student_id,
  course_id,
  enrollment_date,
  progress_percentage
)
VALUES (
  'STUDENT_ID',     -- Reemplaza con el ID del estudiante
  'COURSE_ID',      -- Reemplaza con el ID del curso
  NOW(),
  0
)
ON CONFLICT (student_id, course_id) DO NOTHING;

-- Ejemplo:
-- INSERT INTO course_enrollments (student_id, course_id, enrollment_date, progress_percentage)
-- VALUES ('550e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440111', NOW(), 0)
-- ON CONFLICT (student_id, course_id) DO NOTHING;

-- 3. Verifica que se inscribió correctamente
SELECT 
  ce.*,
  c.title as course_title,
  u.email as student_email
FROM course_enrollments ce
JOIN courses c ON c.id = ce.course_id
JOIN auth.users u ON u.id = ce.student_id
WHERE ce.student_id = 'STUDENT_ID';  -- Reemplaza con el ID del estudiante
