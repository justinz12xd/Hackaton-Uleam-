<<<<<<< HEAD
# 🧱 Adaptación del Sistema a Eventos con Recursos Opcionales

## 🎯 Objetivo General
Permitir que los **instructores creen eventos o talleres académicos** y, de forma opcional, puedan asociarles **recursos digitales** (videos, guías, PDFs, presentaciones) accesibles únicamente para los participantes que hayan sido validados y cuenten con una microcredencial emitida.

---

## 🧩 Nueva estructura lógica

1. **Evento/Taller (principal)**  
   - Representa la actividad académica registrada en el sistema.  
   - Es la base para el registro de asistencia y la emisión de microcredenciales.

2. **Microcredencial (verificación)**  
   - Se emite automáticamente tras validar la asistencia del participante.  
   - Contiene código único y código QR verificable públicamente.  
   - Está vinculada al evento o taller correspondiente.

3. **Recursos del evento (opcional)**  
   - Son materiales digitales complementarios que el instructor puede asociar al evento.  
   - Se gestionan desde un editor tipo Udemy.  
   - Solo son accesibles por usuarios con microcredencial válida para ese evento.

---

## ⚙️ Flujo general del sistema

1. **Creación del evento**
   - El instructor registra un nuevo evento o taller.  
   - Define título, descripción, fechas y modalidad.

2. **Registro de participantes**
   - Los usuarios se inscriben o son añadidos por el administrador.  
   - El sistema asocia los datos del estudiante al evento.

3. **Ejecución del evento**
   - Se lleva a cabo el taller o curso (presencial o virtual).  
   - El instructor registra la asistencia real de los participantes.

4. **Validación de asistencia**
   - Solo los participantes con asistencia válida son marcados como “Aprobados”.

5. **Emisión de microcredenciales**
   - El sistema genera la microcredencial para cada asistente validado.  
   - Se incluye un código único y un QR que lleva a la página pública de verificación.

6. **(Opcional) Asociación de recursos**
   - El instructor puede subir materiales adicionales del evento:  
     - Videos (enlaces YouTube/Vimeo)  
     - Documentos (PDF, DOCX, PPTX)  
     - Archivos comprimidos (ZIP)  
   - Estos recursos se almacenan en Supabase Storage y se registran en la columna `content` del evento.

7. **Acceso a los recursos**
   - Los estudiantes con microcredencial válida pueden acceder a `/resources/[evento_id]`.  
   - Allí podrán ver y descargar los materiales complementarios.

8. **Verificación pública**
   - Cualquier persona puede validar la autenticidad de una microcredencial desde la página `/verify/[codigo]`.

---

## 🔐 Condiciones de acceso

| Tipo de usuario | Acceso a recursos | Descripción |
|-----------------|------------------|--------------|
| **Instructor** | Total | Puede crear eventos y subir recursos |
| **Estudiante con microcredencial** | Permitido | Puede ver y descargar materiales del evento |
| **Estudiante sin microcredencial** | Denegado | Debe haber sido validado primero |
| **Administrador** | Total | Puede ver, editar y verificar todo |

---

## 🧱 Estructura de datos simplificada

- **Tabla `events` (antes `courses`)**  
  - id  
  - instructor_id  
  - title  
  - description  
  - date_start  
  - date_end  
  - is_published  
  - content (JSONB opcional con recursos)

- **Tabla `microcredentials`**  
  - id  
  - event_id  
  - student_id  
  - status (issued, revoked)  
  - qr_code_url  
  - verification_code  

---

## 🧠 Ejemplo de uso

1. El docente **crea el evento “Introducción a la IA aplicada”**.  
2. Durante el evento, registra los asistentes.  
3. Al finalizar, valida asistencia y el sistema emite microcredenciales.  
4. Luego decide subir materiales: diapositivas y un video resumen.  
5. Los asistentes pueden ingresar a la plataforma, validar su microcredencial y acceder a los materiales.

---

## 📦 Beneficios de esta adaptación

- Se alinea con los requerimientos de **emisión, validación y consulta** de microcredenciales.  
- El módulo tipo Udemy se convierte en un **valor agregado** para los talleres.  
- Los recursos digitales fomentan el aprendizaje posterior y mejoran la experiencia del participante.  
- Todo se mantiene dentro del ecosistema de **Supabase (Auth + DB + Storage)**.  
- Permite futuras extensiones, como incluir evaluaciones o foros.

---

## 🏁 Resultado esperado
El sistema final ofrecerá:

1. **Módulo principal tipo Luma** (hecho por tu compañero)  
   - Registro, validación y emisión de microcredenciales.

2. **Módulo complementario tipo Udemy** (tu parte adaptada)  
   - Recursos digitales asociados a los eventos.  
   - Acceso exclusivo para usuarios validados.

Ambos módulos compartirán base de datos y autenticación, funcionando como partes integradas de un solo sistema.
=======
# 🎓 EduCred - Plataforma de Eventos y Microcredenciales

Plataforma educativa para gestión de eventos con sistema de QR de asistencia y otorgamiento de microcredenciales.

## 🚀 Características

- ✅ **Sistema de eventos** estilo Luma con QR para check-in
- ✅ **Microcredenciales** y certificados digitales
- ✅ **Multiidioma** (Español/English) con next-intl
- ✅ **Autenticación** con Supabase Auth
- ✅ **Storage** para imágenes de eventos en Supabase
- ✅ **Búsqueda** de usuarios y cursos con filtros
- ✅ **Panel de administración** para gestión de contenido
- ✅ **Tema claro/oscuro** adaptable

## 🛠️ Stack Tecnológico

- **Framework:** Next.js 16.0.0 (Turbopack)
- **UI:** React 19.2.0 + Tailwind CSS
- **Backend:** Supabase (PostgreSQL + Auth + Storage)
- **i18n:** next-intl 4.4.0
- **QR Codes:** qrcode 1.5.4
- **Components:** shadcn/ui
- **Deployment:** Docker + Google Cloud Run

## 📋 Requisitos

- Node.js 20+
- pnpm (o npm/yarn)
- Cuenta de Supabase
- Docker (para deployment)
- Google Cloud SDK (para deployment en GCP)

## 🚀 Inicio Rápido

### 1. Clonar el repositorio

```bash
git clone https://github.com/justinz12xd/Hackaton-Uleam-.git
cd Hackaton-Uleam-
```

### 2. Instalar dependencias

```bash
pnpm install
```

### 3. Configurar variables de entorno

Crea un archivo `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

### 4. Configurar Supabase

Ejecuta los scripts SQL en tu proyecto de Supabase (SQL Editor):

```bash
scripts/001_create_tables.sql
scripts/002_rls_policies.sql
scripts/003_trigger_create_profile.sql
scripts/004_create_events_tables.sql
scripts/005_storage_policies.sql
```

### 5. Crear bucket de Storage

En Supabase Dashboard → Storage:
- Crear bucket: `Event-pictures` (público)

### 6. Ejecutar en desarrollo

```bash
pnpm dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 🐳 Docker

### Build local

```bash
docker build -t educred-app .
```

### Ejecutar localmente

```bash
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL="tu-url" \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY="tu-key" \
  educred-app
```

### Con Docker Compose

```bash
docker-compose up
```

## ☁️ Despliegue en Google Cloud

### Opción 1: Script automático (recomendado)

```powershell
# Windows PowerShell
.\deploy.ps1

# Linux/Mac
chmod +x deploy.sh
./deploy.sh
```

### Opción 2: Comandos manuales

```bash
# Configurar proyecto
gcloud config set project TU_PROJECT_ID

# Build y push
gcloud builds submit --tag gcr.io/TU_PROJECT_ID/educred-app

# Deploy
gcloud run deploy educred-app \
  --image gcr.io/TU_PROJECT_ID/educred-app \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

### Opción 3: CI/CD automático con GitHub Actions

1. Configura secrets en GitHub (ver `DEPLOYMENT.md`)
2. Push a la rama `main`
3. GitHub Actions desplegará automáticamente

Ver guía completa en [`DEPLOYMENT.md`](./DEPLOYMENT.md)

## 📁 Estructura del Proyecto

```
├── app/
│   ├── [locale]/           # Páginas con internacionalización
│   │   ├── events/         # Sistema de eventos
│   │   ├── courses/        # Cursos y microcredenciales
│   │   ├── admin/          # Panel de administración
│   │   └── auth/           # Autenticación
│   └── api/                # API routes
├── components/             # Componentes React
│   └── ui/                # shadcn/ui components
├── lib/
│   ├── supabase/          # Cliente Supabase
│   └── i18n/              # Configuración i18n
├── messages/              # Traducciones (es/en)
├── scripts/               # Scripts SQL
├── .github/workflows/     # GitHub Actions CI/CD
└── Dockerfile             # Configuración Docker

```

## 🌍 Internacionalización

Idiomas soportados:
- 🇪🇸 Español (por defecto)
- 🇬🇧 English

Cambiar idioma: Usa el switcher en el navbar o visita `/es` o `/en`

## 🔒 Seguridad

- Row Level Security (RLS) en todas las tablas
- Políticas de Storage para Event-pictures
- Autenticación requerida para operaciones sensibles
- Variables de entorno para secrets

## 📊 Base de Datos

### Tablas principales:

- `profiles` - Perfiles de usuario
- `courses` - Cursos disponibles
- `certificates` - Certificados otorgados
- `events` - Eventos creados
- `event_registrations` - Registros a eventos
- `enrollments` - Inscripciones a cursos

### Storage Buckets:

- `Event-pictures` - Imágenes de eventos (público)

## 🧪 Testing Local

### Makefile commands (Linux/Mac):

```bash
make build      # Build imagen
make run        # Ejecutar contenedor
make test       # Test imagen
make logs       # Ver logs
make clean      # Limpiar
```

## 📝 Scripts Disponibles

```bash
pnpm dev          # Desarrollo con Turbopack
pnpm build        # Build de producción
pnpm start        # Ejecutar build
pnpm lint         # Linter
```

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama: `git checkout -b feature/nueva-funcionalidad`
3. Commit: `git commit -m 'Agrega nueva funcionalidad'`
4. Push: `git push origin feature/nueva-funcionalidad`
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la licencia MIT.

## 👥 Equipo

Desarrollado para el Hackathon ULEAM 2025

## 🐛 Reportar Issues

Si encuentras algún bug o tienes sugerencias, por favor abre un [issue](https://github.com/justinz12xd/Hackaton-Uleam-/issues).

## 📚 Documentación Adicional

- [Guía de Despliegue](./DEPLOYMENT.md)
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Cloud Run Documentation](https://cloud.google.com/run/docs)

## 🔗 Enlaces Útiles

- [Demo en vivo](#) (próximamente)
- [Documentación API](#) (próximamente)
- [Roadmap](#) (próximamente)

---

⭐ Si te gusta este proyecto, considera darle una estrella en GitHub!
>>>>>>> c38bf004ab91ffefc3e611f2ba991816f9caec6d
