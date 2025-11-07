# 🚀 Guía de Despliegue en Google Cloud

Esta guía te ayudará a desplegar la aplicación EduCred en Google Cloud usando Docker y CI/CD.

## 📋 Requisitos previos

1. **Cuenta de Google Cloud Platform (GCP)**
2. **Proyecto de GCP creado**
3. **APIs habilitadas:**
   - Cloud Run API
   - Cloud Build API
   - Container Registry API

## 🔧 Configuración inicial

### 1. Instalar Google Cloud SDK (local)

```bash
# Windows (PowerShell)
(New-Object Net.WebClient).DownloadFile("https://dl.google.com/dl/cloudsdk/channels/rapid/GoogleCloudSDKInstaller.exe", "$env:Temp\GoogleCloudSDKInstaller.exe")
& $env:Temp\GoogleCloudSDKInstaller.exe

# Después de instalar, inicializa:
gcloud init
```

### 2. Configurar proyecto

```bash
# Autenticarse
gcloud auth login

# Configurar proyecto
gcloud config set project YOUR_PROJECT_ID

# Habilitar APIs necesarias
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable containerregistry.googleapis.com
```

### 3. Crear Service Account para CI/CD

```bash
# Crear service account
gcloud iam service-accounts create github-actions \
  --display-name="GitHub Actions"

# Obtener el PROJECT_ID
export PROJECT_ID=$(gcloud config get-value project)

# Asignar roles necesarios
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:github-actions@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:github-actions@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/storage.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:github-actions@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/cloudbuild.builds.builder"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:github-actions@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"

# Crear y descargar key
gcloud iam service-accounts keys create key.json \
  --iam-account=github-actions@$PROJECT_ID.iam.gserviceaccount.com
```

### 4. Configurar Secrets en GitHub

Ve a tu repositorio en GitHub → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Agrega los siguientes secrets:

| Secret Name | Descripción | Ejemplo |
|------------|-------------|---------|
| `GCP_PROJECT_ID` | ID de tu proyecto GCP | `educred-prod-123456` |
| `GCP_SA_KEY` | Contenido del archivo `key.json` | `{ "type": "service_account", ...}` |
| `NEXT_PUBLIC_SUPABASE_URL` | URL de tu proyecto Supabase | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key de Supabase | `eyJhbGciOiJIUzI1...` |

## 🐳 Despliegue Manual (Testing)

### Opción 1: Build y deploy local

```bash
# Build de la imagen
docker build -t educred-app .

# Test local
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL="your-url" \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY="your-key" \
  educred-app

# Accede a http://localhost:3000
```

### Opción 2: Deploy directo a Cloud Run

```bash
# Build y push a Container Registry
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/educred-app

# Deploy a Cloud Run
gcloud run deploy educred-app \
  --image gcr.io/YOUR_PROJECT_ID/educred-app \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="NEXT_PUBLIC_SUPABASE_URL=your-url,NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key"
```

## 🔄 CI/CD Automático

### Método 1: GitHub Actions (Recomendado)

El workflow `.github/workflows/deploy-gcp.yml` se ejecutará automáticamente cuando:
- Hagas push a la rama `main`
- Abras o actualices un Pull Request
- Lo ejecutes manualmente desde GitHub Actions

**Proceso automático:**
1. ✅ Checkout del código
2. 🔐 Autenticación con GCP
3. 🐳 Build de la imagen Docker
4. ⬆️ Push a Container Registry
5. 🚀 Deploy a Cloud Run
6. 📝 Comentario en PR con URL de despliegue

### Método 2: Cloud Build Triggers

1. Ve a **Cloud Build** → **Triggers** en GCP Console
2. Click en **Create Trigger**
3. Configura:
   - **Name:** `deploy-educred`
   - **Event:** Push to branch
   - **Branch:** `^main$`
   - **Configuration:** Cloud Build configuration file
   - **Location:** `/cloudbuild.yaml`
4. En **Substitution variables**, agrega:
   - `_NEXT_PUBLIC_SUPABASE_URL`: tu URL de Supabase
   - `_NEXT_PUBLIC_SUPABASE_ANON_KEY`: tu anon key
5. Click en **Create**

## 📊 Monitoreo y Logs

```bash
# Ver logs en tiempo real
gcloud run services logs tail educred-app --region us-central1

# Ver logs históricos
gcloud run services logs read educred-app --region us-central1 --limit 50

# Ver métricas
gcloud run services describe educred-app \
  --region us-central1 \
  --format="table(status.url, status.conditions)"
```

## 🔧 Configuración de Next.js para standalone

Agrega a tu `next.config.mjs`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // ... resto de tu configuración
}

export default nextConfig
```

## 🌐 Configurar dominio personalizado

```bash
# Mapear dominio a Cloud Run
gcloud run domain-mappings create \
  --service educred-app \
  --domain www.tudominio.com \
  --region us-central1
```

## 💰 Estimación de costos

Cloud Run usa pricing por uso:
- **Requests:** $0.40 por millón de requests
- **CPU:** $0.00002400 por vCPU-segundo
- **Memory:** $0.00000250 por GiB-segundo
- **Tier gratuito:** 2 millones de requests/mes

**Estimación mensual (tráfico moderado):**
- 100K requests/mes
- 512MB RAM, 1 vCPU
- **~$5-10 USD/mes**

## 🔒 Seguridad

### Variables de entorno sensibles

Usa Secret Manager para variables sensibles:

```bash
# Crear secret
echo -n "tu-secret-value" | gcloud secrets create supabase-key --data-file=-

# Dar acceso a Cloud Run
gcloud secrets add-iam-policy-binding supabase-key \
  --member="serviceAccount:YOUR_PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

# Deploy con secrets
gcloud run deploy educred-app \
  --set-secrets="SUPABASE_KEY=supabase-key:latest"
```

## 🚨 Troubleshooting

### Error: "Permission denied"
```bash
# Verificar permisos del service account
gcloud projects get-iam-policy YOUR_PROJECT_ID \
  --flatten="bindings[].members" \
  --filter="bindings.members:serviceAccount:github-actions@*"
```

### Error: "Build timeout"
Aumenta el timeout en `cloudbuild.yaml`:
```yaml
timeout: 3600s  # 1 hora
```

### Error: "Memory limit exceeded"
Aumenta la memoria en el deploy:
```bash
gcloud run deploy educred-app --memory 1Gi
```

## 📚 Recursos adicionales

- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Next.js Docker Deployment](https://nextjs.org/docs/deployment#docker-image)
- [GitHub Actions with GCP](https://github.com/google-github-actions)

## 🎯 Checklist de despliegue

- [ ] APIs de GCP habilitadas
- [ ] Service Account creado y configurado
- [ ] Secrets en GitHub configurados
- [ ] `next.config.mjs` con `output: 'standalone'`
- [ ] Variables de entorno de Supabase correctas
- [ ] Bucket de Storage configurado (Event-pictures)
- [ ] Políticas RLS de Supabase aplicadas
- [ ] Primer despliegue manual exitoso
- [ ] CI/CD automático funcionando
- [ ] Health check respondiendo en `/api/health`

¡Listo para producción! 🚀
