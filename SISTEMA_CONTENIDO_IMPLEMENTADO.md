# ✅ Sistema de Contenido de Cursos - IMPLEMENTADO

## 🎉 ¿Qué se ha implementado?

Se ha creado un **sistema completo de gestión de contenido de cursos** que permite a los instructores:

1. ✅ Crear módulos y lecciones para sus cursos
2. ✅ Subir archivos (PDFs, documentos, imágenes) a Supabase Storage  
3. ✅ Enlazar videos de YouTube/Vimeo
4. ✅ Agregar contenido de texto/markdown
5. ✅ Agregar recursos descargables a las lecciones
6. ✅ Guardar todo en formato JSON en la columna `content` de la tabla `courses`

---

## 📋 Archivos Creados

### 1. Base de Datos
- ✅ `scripts/004_add_course_content.sql` - Script SQL para agregar columna `content` y configurar Storage

### 2. Utilidades y Tipos
- ✅ `lib/storage.ts` - Funciones para subir/eliminar archivos de Supabase Storage
- ✅ `lib/types/course-content.ts` - Tipos TypeScript para módulos, lecciones y recursos

### 3. API Routes
- ✅ `app/api/courses/[id]/content/route.ts` - GET/PUT para obtener y actualizar contenido
- ✅ `app/api/courses/[id]/upload/route.ts` - POST/DELETE para subir y eliminar archivos

### 4. Componentes UI
- ✅ `components/file-uploader.tsx` - Componente para subir archivos
- ✅ `components/course-content-editor.tsx` - Editor completo de contenido del curso

### 5. Páginas
- ✅ `app/instructor/[id]/content/page.tsx` - Página del editor de contenido

---

## 🚀 PASOS PARA ACTIVAR EL SISTEMA

### PASO 1: Actualizar la Base de Datos

```bash
# Opción A: Desde Supabase Dashboard (Recomendado)
# 1. Ir a https://app.supabase.com
# 2. Seleccionar tu proyecto
# 3. Ir a "SQL Editor"
# 4. Copiar y pegar el contenido de: scripts/004_add_course_content.sql
# 5. Click en "Run"
```

```sql
-- O ejecutar directamente este comando mínimo:
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS content JSONB DEFAULT '{"modules": []}'::jsonb;
```

### PASO 2: Crear Buckets en Supabase Storage

```bash
# Ir a https://app.supabase.com
# 1. Click en "Storage" en el menú lateral
# 2. Click en "Create a new bucket"

# Crear bucket 1:
Name: course-documents
Public: ✅ (marcar como público)

# Crear bucket 2:
Name: course-images  
Public: ✅ (marcar como público)
```

### PASO 3: Configurar Políticas de Storage (Opcional pero Recomendado)

```sql
-- En Supabase SQL Editor, ejecutar:

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
```

### PASO 4: Actualizar Variables de Entorno

```bash
# En tu archivo .env.local, asegúrate de tener:
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key
NEXT_PUBLIC_APP_URL=http://localhost:3000  # o tu dominio en producción
```

### PASO 5: Instalar Dependencias (Si es necesario)

```bash
# Verificar que tengas sonner para las notificaciones
pnpm add sonner

# Si no tienes los componentes de UI necesarios:
npx shadcn-ui@latest add accordion
npx shadcn-ui@latest add progress
```

### PASO 6: Reiniciar el Servidor

```bash
pnpm dev
```

---

## 🎯 CÓMO USAR EL SISTEMA

### Para Instructores:

1. **Crear un curso** (si no lo has hecho):
   - Ve a `/instructor/create`
   - Llena el formulario básico
   - Click en "Create Course"

2. **Agregar contenido al curso**:
   - Ve a tu dashboard de instructor
   - Encuentra tu curso
   - Click en el botón "Editar Contenido" (debes agregarlo al dashboard)
   - O navega directamente a: `/instructor/[id-del-curso]/content`

3. **Crear módulos**:
   - Click en "Agregar Módulo"
   - Escribe el título y descripción del módulo
   - Expande el módulo para agregar lecciones

4. **Agregar lecciones**:
   - Dentro de un módulo, click en "Agregar Lección"
   - Selecciona el tipo de contenido:
     - **📹 Video**: Pega URL de YouTube o Vimeo
     - **📝 Texto**: Escribe contenido directo
     - **📄 PDF**: Sube un documento PDF
     - **❓ Quiz**: Para evaluaciones (futuro)
   - Define la duración en minutos

5. **Subir archivos**:
   - Para lecciones tipo PDF: usa el uploader integrado
   - Para recursos adicionales: click en "Agregar" en la sección de recursos
   - Arrastra o selecciona archivos (max 10MB)

6. **Guardar cambios**:
   - Click en "Guardar Cambios" en el header
   - Los cambios se guardan en la base de datos
   
---

## 🔗 Agregar Botón al Dashboard del Instructor

Para que los instructores puedan acceder fácilmente al editor, debes agregar un botón en el dashboard del instructor.

Busca el archivo que muestra la lista de cursos del instructor y agrega:

```tsx
// En la card de cada curso, agregar:
<Link href={`/instructor/${course.id}/content`}>
  <Button variant="outline" size="sm">
    <FileText className="w-3 h-3 mr-2" />
    Editar Contenido
  </Button>
</Link>
```

---

## 🎨 Estructura del Contenido JSON

Así se ve el contenido guardado en la base de datos:

```json
{
  "modules": [
    {
      "id": "module-1699123456789-abc123",
      "title": "Introducción a Next.js",
      "description": "Fundamentos del framework",
      "order": 0,
      "lessons": [
        {
          "id": "lesson-1699123456789-xyz789",
          "title": "¿Qué es Next.js?",
          "description": "Introducción al framework",
          "contentType": "video",
          "videoUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
          "duration": 15,
          "order": 0,
          "isFree": true,
          "resources": [
            {
              "id": "resource-1699123456789-def456",
              "title": "Slides de la clase",
              "type": "pdf",
              "url": "https://storage-url.com/file.pdf",
              "filePath": "course-id/timestamp-file.pdf"
            }
          ]
        }
      ]
    }
  ]
}
```

---

## 📊 Funcionalidades Implementadas

### ✅ Editor de Contenido
- [x] Crear/editar/eliminar módulos
- [x] Crear/editar/eliminar lecciones
- [x] Soporta videos de YouTube/Vimeo
- [x] Soporta contenido de texto
- [x] Soporta PDFs y documentos
- [x] Agregar recursos descargables
- [x] Reordenar módulos y lecciones (con UI de arrastrar)
- [x] Estadísticas en tiempo real (módulos, lecciones, duración)
- [x] Autoguardado manual con botón

### ✅ Subida de Archivos
- [x] Validación de tipo de archivo
- [x] Validación de tamaño (max 10MB documentos, 5MB imágenes)
- [x] Barra de progreso durante la subida
- [x] Nombres de archivo únicos
- [x] Almacenamiento en Supabase Storage
- [x] URLs públicas para acceso

### ✅ Seguridad
- [x] Solo instructores pueden editar sus cursos
- [x] Admins pueden editar cualquier curso
- [x] Validación de autenticación en API
- [x] Validación de permisos en API
- [x] Row Level Security en Storage

---

## 🚧 PRÓXIMOS PASOS (Para estudiantes)

Ahora que los instructores pueden agregar contenido, necesitas crear:

1. **Página de visualización del curso** (`/courses/[id]/learn`)
   - Mostrar lista de módulos en sidebar
   - Reproductor de video para lecciones
   - Visor de contenido de texto
   - Links de descarga para recursos

2. **Sistema de progreso**
   - Tabla `lesson_progress` para trackear lecciones completadas
   - Calcular porcentaje de progreso del curso
   - Botón "Marcar como completada" en cada lección

3. **Generar certificado al 100%**
   - Cuando progress_percentage = 100, mostrar botón
   - Llamar a API de generación de certificados

---

## 🐛 Troubleshooting

### Error: "Bucket does not exist"
**Solución**: Crear los buckets en Supabase Storage (ver PASO 2)

### Error: "Permission denied"
**Solución**: Configurar las políticas de Storage (ver PASO 3)

### Error: "Column 'content' does not exist"
**Solución**: Ejecutar el script SQL (ver PASO 1)

### Los archivos no se suben
**Solución**: 
1. Verificar que los buckets existen
2. Verificar que son públicos
3. Ver console del navegador para errores específicos

---

## 📝 Notas Importantes

1. **Los archivos se almacenan en Supabase Storage**, no en el servidor
2. **El contenido se guarda en formato JSON** en la columna `content`
3. **Los videos NO se suben**, solo se enlazan desde YouTube/Vimeo
4. **Límites de tamaño**: 10MB documentos, 5MB imágenes
5. **Los cambios NO se guardan automáticamente**, hay que hacer click en "Guardar"

---

## 🎓 Estructura Recomendada de un Curso

```
Curso: "Introducción a Next.js"
│
├── Módulo 1: Fundamentos
│   ├── Lección 1: ¿Qué es Next.js? (Video, 10 min)
│   ├── Lección 2: Instalación (Video, 15 min)
│   │   └── Recurso: guia-instalacion.pdf
│   └── Lección 3: Tu primera app (Texto)
│
├── Módulo 2: Routing
│   ├── Lección 1: App Router (Video, 20 min)
│   ├── Lección 2: Dynamic Routes (Video, 15 min)
│   └── Lección 3: Práctica (PDF)
│       └── Recurso: ejercicios.zip
│
└── Módulo 3: Deployment
    ├── Lección 1: Vercel (Video, 12 min)
    └── Lección 2: Otras opciones (Texto)
```

---

## ✨ Características Destacadas

- ✅ **Interfaz drag & drop** para reordenar (con iconos de agarre)
- ✅ **Validación de archivos** antes de subir
- ✅ **Feedback visual** con toasts y barras de progreso
- ✅ **Autodetección de URLs** de YouTube/Vimeo
- ✅ **Cálculo automático** de duración total del curso
- ✅ **Contador de lecciones** en tiempo real
- ✅ **Responsive** - funciona en mobile y desktop

---

## 🎯 Para el Hackathon

Este sistema cumple con:
- ✅ Permitir a instructores subir contenido
- ✅ Almacenamiento de materiales académicos
- ✅ Estructura modular y profesional
- ✅ Soporte para múltiples tipos de contenido
- ✅ Preparado para sistema de progreso
- ✅ Preparado para emisión de certificados

**¡El sistema de contenido está COMPLETO y LISTO PARA USAR!** 🚀
