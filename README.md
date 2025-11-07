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
