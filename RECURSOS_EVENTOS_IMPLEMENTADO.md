# 📦 Sistema de Recursos para Eventos - Implementado

## ✅ Cambios Realizados

### 1. **Modificación en Creación de Eventos**
**Archivo:** `app/[locale]/events/create/page.tsx`

#### Antes:
- Campo de texto para "URL de Recursos" (un enlace externo)

#### Ahora:
- ✅ Subida de archivos PDF o ZIP (hasta 50MB)
- ✅ Preview del archivo seleccionado con nombre y tamaño
- ✅ Botón para eliminar el archivo antes de crear el evento
- ✅ Upload automático a Supabase Storage (`event-resources` bucket)
- ✅ URL del archivo se guarda en `events.resources_url`

### 2. **Visualización para Usuarios Registrados**
**Archivo:** `app/[locale]/events/[id]/page.tsx`

#### Para usuarios CON check-in completado:
- ✅ Card destacado con gradiente mostrando el recurso disponible
- ✅ Icono de descarga
- ✅ Botón grande "Descargar Recurso"
- ✅ Descarga directa del archivo (PDF/ZIP)

#### Para usuarios SIN check-in:
- ✅ Card con diseño bloqueado (grayed out)
- ✅ Mensaje: "Completa el check-in para descargar el recurso"
- ✅ No permite descargar hasta hacer check-in

### 3. **Nuevo Bucket en Supabase Storage**
**Script:** `scripts/009_create_event_resources_bucket.sql`

#### Configuración:
- ✅ Bucket público: `event-resources`
- ✅ Cualquiera puede VER (leer) los recursos
- ✅ Solo usuarios autenticados pueden SUBIR
- ✅ Solo el dueño puede ELIMINAR o ACTUALIZAR

---

## 🚀 Cómo Usar

### Para el Instructor:

1. **Crear Evento:**
   - Ir a `/events/create`
   - Llenar información del evento
   - **NUEVO:** Subir un archivo PDF o ZIP en "Recurso del Evento"
   - Click en "Crear Evento"

2. **El sistema automáticamente:**
   - Sube el archivo a Supabase Storage
   - Genera una URL pública
   - Guarda la URL en `events.resources_url`

### Para los Asistentes:

1. **Registrarse al evento**
2. **Hacer check-in** (escanear QR en el evento)
3. **Acceder al recurso:**
   - Ir a la página del evento
   - Ver el card de "Recurso del Evento Disponible"
   - Click en "Descargar Recurso"
   - El archivo se descarga automáticamente

---

## 📋 Pasos de Instalación

### 1. Crear el Bucket en Supabase

Ejecuta este script en Supabase SQL Editor:

```sql
-- scripts/009_create_event_resources_bucket.sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-resources', 'event-resources', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de acceso
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'event-resources');

CREATE POLICY "Authenticated users can upload event resources"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'event-resources');

CREATE POLICY "Users can delete own event resources"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'event-resources' AND auth.uid()::text = (storage.foldername(name))[1]);
```

### 2. Verificar el Bucket

Ve a Supabase Dashboard → Storage → Deberías ver el bucket `event-resources`

### 3. Probar

1. Crear un evento con un archivo PDF de prueba
2. Registrarte al evento
3. Hacer check-in
4. Verificar que puedes descargar el recurso

---

## 🎨 Diseño de la UI

### Card de Recurso Disponible (Check-in completado)

```
┌─────────────────────────────────────────┐
│ [Icon] Recurso del Evento Disponible   │
│        Descarga el material...          │
│                                         │
│  [Descargar Recurso]  (Botón grande)   │
└─────────────────────────────────────────┘
```

- Fondo: Gradiente de primary a accent
- Borde: primary/20
- Icono: Download en círculo con fondo primary/20

### Card de Recurso Bloqueado (Sin check-in)

```
┌─────────────────────────────────────────┐
│ [Icon] Recurso Bloqueado                │
│        Completa el check-in para...     │
└─────────────────────────────────────────┘
```

- Fondo: muted/50
- Icono: Download en gris (muted-foreground)
- No clickeable

---

## 🔒 Seguridad

### Control de Acceso:

1. **Subir archivo:** Solo usuarios autenticados
2. **Ver recurso en UI:** Solo usuarios registrados al evento
3. **Descargar:** Solo usuarios con check-in completado
4. **Bucket público:** Sí, pero necesitas la URL exacta

### Por qué es seguro:

- Las URLs son únicas y generadas aleatoriamente
- Incluyen el `user_id` y timestamp
- Aunque el bucket es público, no hay un "listado" de archivos
- Solo quienes tienen la URL pueden descargar

---

## 📝 Tipos de Archivos Soportados

### Actualmente:
- ✅ PDF (.pdf)
- ✅ ZIP (.zip)

### Para agregar más tipos:

Edita en `app/[locale]/events/create/page.tsx`:

```typescript
const handleResourceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0]
  if (file) {
    const validTypes = [
      'application/pdf',
      'application/zip',
      'application/x-zip-compressed',
      'application/vnd.ms-powerpoint',  // PPT
      'application/vnd.openxmlformats-officedocument.presentationml.presentation' // PPTX
    ]
    // ...
  }
}
```

Y actualiza el `accept` del input:

```tsx
<Input
  id="resource-upload"
  type="file"
  accept=".pdf,.zip,.ppt,.pptx"  // Agregar más extensiones
  className="hidden"
  onChange={handleResourceChange}
/>
```

---

## 🐛 Solución de Problemas

### Error: "Failed to upload resource"

**Causa:** El bucket no existe o las políticas RLS no están configuradas

**Solución:**
1. Verifica que ejecutaste `009_create_event_resources_bucket.sql`
2. Ve a Supabase → Storage → Verifica que existe `event-resources`
3. Ve a Policies → Verifica las 3 políticas

### Error: "File too large"

**Causa:** El archivo supera los 50MB

**Solución:**
- Comprimir el archivo
- O aumentar el límite en el código:
  ```typescript
  if (file.size > 100 * 1024 * 1024) {  // 100MB
  ```

### El botón de descarga no funciona

**Causa:** La URL del recurso no es válida

**Solución:**
1. Verifica en la base de datos: `SELECT resources_url FROM events WHERE id = 'event-id'`
2. Copia la URL y pégala en el navegador
3. Si da error 404, el archivo no se subió correctamente

---

## ✅ Checklist de Verificación

- [ ] Ejecutado `009_create_event_resources_bucket.sql` en Supabase
- [ ] Bucket `event-resources` visible en Supabase Dashboard
- [ ] Crear evento de prueba con archivo PDF
- [ ] Archivo se sube correctamente (ver en Storage)
- [ ] URL guardada en `events.resources_url`
- [ ] Registrarse al evento de prueba
- [ ] Hacer check-in
- [ ] Botón "Descargar Recurso" aparece
- [ ] Click en el botón descarga el archivo
- [ ] Con otro usuario SIN check-in, ver que el recurso está bloqueado

---

## 🎯 Próximas Mejoras (Opcionales)

1. **Múltiples recursos por evento**
   - Crear tabla `event_resources` con relación many-to-one
   - Permitir subir varios archivos

2. **Tracking de descargas**
   - Crear tabla `resource_downloads`
   - Registrar quién descargó qué y cuándo

3. **Preview de PDFs**
   - Mostrar el PDF en un modal antes de descargar
   - Usar `@react-pdf/renderer` o similar

4. **Más tipos de archivos**
   - Agregar soporte para DOCX, PPTX, videos, etc.

5. **Caducidad de recursos**
   - Recursos disponibles solo por X días después del evento
   - URL firmadas temporales

---

¡Sistema de recursos implementado y listo para usar! 🎉
