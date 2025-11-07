-- =====================================================
-- FIX: Permitir a los administradores ver todos los certificados
-- =====================================================
-- Este script agrega una política para que los administradores
-- puedan ver todos los certificados emitidos en la plataforma

-- Eliminar la política existente
DROP POLICY IF EXISTS "certificates_select_own" ON public.certificates;

-- Crear nueva política que incluye acceso para administradores
CREATE POLICY "certificates_select_policy"
  ON public.certificates FOR SELECT
  USING (
    -- El estudiante que obtuvo el certificado puede verlo
    (SELECT student_id FROM public.microcredentials WHERE id = credential_id) = auth.uid() 
    OR
    -- El instructor del curso puede verlo
    (SELECT instructor_id FROM public.courses
     WHERE id = (SELECT course_id FROM public.microcredentials WHERE id = credential_id)
    ) = auth.uid()
    OR
    -- Los administradores pueden ver todos los certificados
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- También actualizar la política de microcredentials para que los admins puedan ver todas
DROP POLICY IF EXISTS "microcredentials_select_own" ON public.microcredentials;

CREATE POLICY "microcredentials_select_policy"
  ON public.microcredentials FOR SELECT
  USING (
    -- El estudiante puede ver sus propias microcredenciales
    student_id = auth.uid() 
    OR
    -- El instructor del curso puede verlas
    (SELECT instructor_id FROM public.courses WHERE id = course_id) = auth.uid()
    OR
    -- Los administradores pueden ver todas las microcredenciales
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- Comentario: Ahora los administradores podrán ver todos los certificados y microcredenciales
-- en la plataforma para la gestión administrativa
