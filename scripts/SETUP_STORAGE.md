# Configuración del Storage de Supabase para Recursos de Eventos

## Crear el Bucket de Storage

1. Ve al Dashboard de Supabase: https://app.supabase.com
2. Selecciona tu proyecto
3. Ve a la sección "Storage" en el menú lateral
4. Haz clic en "Create a new bucket"
5. Configura el bucket:
   - **Name:** `event-resources`
   - **Public bucket:** ✅ Activado (para que los recursos sean accesibles públicamente)
   - **File size limit:** 50 MB (o el límite que prefieras)
   - **Allowed MIME types:** Deja vacío para permitir todos los tipos

## Políticas de Acceso (RLS Policies)

Después de crear el bucket, agrega las siguientes políticas en la sección "Policies":

### 1. Policy: "Anyone can view event resources"
```sql
-- Tipo: SELECT
-- Target roles: public

bucket_id = 'event-resources'
```

### 2. Policy: "Authenticated users can upload event resources"
```sql
-- Tipo: INSERT
-- Target roles: authenticated

bucket_id = 'event-resources' AND auth.role() = 'authenticated'
```

### 3. Policy: "Users can update their own event resources"
```sql
-- Tipo: UPDATE
-- Target roles: authenticated

bucket_id = 'event-resources' AND auth.uid() = owner
```

### 4. Policy: "Users can delete their own event resources"
```sql
-- Tipo: DELETE
-- Target roles: authenticated

bucket_id = 'event-resources' AND auth.uid() = owner
```

## Verificación

Para verificar que el bucket está correctamente configurado:

1. Ve a Storage > event-resources
2. Intenta subir un archivo de prueba
3. Verifica que puedas acceder a la URL pública del archivo
4. Prueba subir un recurso desde la aplicación

## Tipos de Archivos Soportados

La aplicación está configurada para aceptar:
- **Fotos:** .jpg, .jpeg, .png, .gif, .webp
- **PDFs:** .pdf
- **Documentos:** .doc, .docx, .xls, .xlsx, .ppt, .pptx, .txt

## Notas Importantes

- Los archivos se organizan por event_id: `{event_id}/{timestamp}-{filename}`
- El límite de tamaño se muestra en la interfaz al subir archivos
- Los recursos solo son accesibles para usuarios que hayan asistido al evento
- Los organizadores pueden ver todos los recursos de sus eventos
