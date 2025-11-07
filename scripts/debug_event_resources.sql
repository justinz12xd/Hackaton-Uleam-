-- Script para verificar recursos de eventos
-- Ejecuta esto en Supabase SQL Editor para ver qué eventos tienen recursos

-- Ver todos los eventos con sus recursos
SELECT 
  id,
  title,
  resources_url,
  CASE 
    WHEN resources_url IS NULL THEN '❌ Sin recurso'
    WHEN resources_url LIKE '%.pdf' THEN '📄 PDF'
    WHEN resources_url LIKE '%.zip' THEN '📦 ZIP'
    ELSE '📎 Otro archivo'
  END as tipo_recurso,
  created_at
FROM events
ORDER BY created_at DESC
LIMIT 10;

-- Ver el evento más reciente (probablemente el que creaste)
SELECT 
  id,
  title,
  resources_url,
  image_url,
  organizer_id,
  created_at
FROM events
ORDER BY created_at DESC
LIMIT 1;

-- Si necesitas agregar un recurso manualmente a un evento:
-- UPDATE events 
-- SET resources_url = 'https://tu-url-del-recurso-aqui.pdf'
-- WHERE id = 'ID-DEL-EVENTO';
