-- =====================================================
-- FIX: Prevenir certificados duplicados
-- =====================================================
-- Este script asegura que cada credencial tenga solo UN certificado
-- y limpia cualquier duplicado existente

-- Paso 1: PRIMERO limpiar duplicados existentes (mantener solo el más reciente)
-- Crear una tabla temporal con los certificados a mantener
CREATE TEMP TABLE certificates_to_keep AS
SELECT DISTINCT ON (credential_id) id
FROM public.certificates
ORDER BY credential_id, issue_date DESC, created_at DESC;

-- Mostrar cuántos duplicados se van a eliminar
DO 
DECLARE
  total_before INTEGER;
  total_to_keep INTEGER;
  total_to_delete INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_before FROM public.certificates;
  SELECT COUNT(*) INTO total_to_keep FROM certificates_to_keep;
  total_to_delete := total_before - total_to_keep;
  
  RAISE NOTICE '=== ANTES DE LIMPIAR ===';
  RAISE NOTICE '  - Total de certificados: %', total_before;
  RAISE NOTICE '  - Certificados a mantener: %', total_to_keep;
  RAISE NOTICE '  - Certificados duplicados a eliminar: %', total_to_delete;
END ;

-- Eliminar todos los certificados duplicados (mantener solo el más reciente de cada credencial)
DELETE FROM public.certificates
WHERE id NOT IN (SELECT id FROM certificates_to_keep);

-- Paso 2: AHORA sí agregar el constraint para prevenir duplicados futuros
-- Solo puede haber UN certificado por credential_id
ALTER TABLE public.certificates 
DROP CONSTRAINT IF EXISTS certificates_credential_id_unique;

ALTER TABLE public.certificates 
ADD CONSTRAINT certificates_credential_id_unique UNIQUE (credential_id);

-- Paso 3: Mostrar estadísticas
DO 
DECLARE
  total_certificates INTEGER;
  total_credentials INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_certificates FROM public.certificates;
  SELECT COUNT(DISTINCT credential_id) INTO total_credentials FROM public.certificates;
  
  RAISE NOTICE 'Limpieza completada:';
  RAISE NOTICE '  - Total de certificados: %', total_certificates;
  RAISE NOTICE '  - Total de credenciales únicas: %', total_credentials;
  
  IF total_certificates = total_credentials THEN
    RAISE NOTICE '  ✓ No hay duplicados';
  ELSE
    RAISE WARNING '  ⚠ Aún hay duplicados: % certificados para % credenciales', 
      total_certificates, total_credentials;
  END IF;
END ;

-- Comentario: Ahora cada credencial tendrá exactamente UN certificado
-- y el constraint prevendrá duplicados futuros
