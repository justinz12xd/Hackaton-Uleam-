# 🔧 Solución de Problemas - Cloud Build

## Error Actual

```
invalid argument "europe-west1-docker.pkg.dev/diego-467219/cloud-run-source-deploy/hackaton-uleam-/hackataonuleam:..." 
for "-t, --tag" flag: invalid reference format
```

## 🎯 Causa del problema

El nombre de la imagen tiene un formato inválido debido a:
1. Nombre del repositorio con caracteres especiales: `hackaton-uleam-/hackataonuleam`
2. Guiones al final del path
3. Posible configuración incorrecta en Cloud Build Trigger

## ✅ Solución Rápida

### Opción 1: Actualizar Cloud Build Trigger (Recomendado)

1. Ve a **Cloud Build** → **Triggers** en GCP Console
2. Encuentra el trigger para tu repositorio
3. Click en **EDIT**
4. En la sección **Cloud Build configuration file**, cambia a:
   - `cloudbuild-simple.yaml`
5. En **Substitution variables**, asegúrate de NO tener variables mal formateadas
6. **Guarda** los cambios

### Opción 2: Usar el archivo simplificado

El archivo `cloudbuild-simple.yaml` tiene una configuración limpia que usa:
- Container Registry (`gcr.io`) en lugar de Artifact Registry
- Nombres de imagen simplificados
- Sin variables de sustitución complejas

### Opción 3: Configurar manualmente el Cloud Build Trigger

```bash
# Eliminar trigger existente si hay problemas
gcloud builds triggers delete TRIGGER_NAME --region=europe-west1

# Crear nuevo trigger
gcloud builds triggers create github \
  --name="educred-deploy" \
  --repo-name="Hackaton-Uleam-" \
  --repo-owner="justinz12xd" \
  --branch-pattern="^main$" \
  --build-config="cloudbuild-simple.yaml" \
  --region="europe-west1"
```

## 📝 Pasos para aplicar la solución

### 1. Habilitar Container Registry API

```bash
gcloud services enable containerregistry.googleapis.com
```

### 2. Actualizar el repositorio

```bash
# Commit los cambios
git add cloudbuild.yaml cloudbuild-simple.yaml
git commit -m "Fix: Cloud Build configuration"
git push origin main
```

### 3. Configurar variables de entorno en Cloud Build

Ve a **Cloud Build** → **Settings** → **Substitution variables**

Agrega (si las necesitas):
```
_NEXT_PUBLIC_SUPABASE_URL = https://tu-proyecto.supabase.co
_NEXT_PUBLIC_SUPABASE_ANON_KEY = tu-anon-key
```

### 4. Test manual del build

```bash
# Desde tu proyecto local
gcloud builds submit \
  --config=cloudbuild-simple.yaml \
  --region=europe-west1
```

## 🔍 Verificar configuración actual

```bash
# Ver triggers activos
gcloud builds triggers list --region=europe-west1

# Ver detalles de un trigger específico
gcloud builds triggers describe TRIGGER_NAME --region=europe-west1
```

## 🐳 Alternative: Deploy directo sin Cloud Build

Si Cloud Build sigue dando problemas, puedes desplegar directamente:

```bash
# Build local
docker build -t gcr.io/diego-467219/educred-app:v1 .

# Push a Container Registry
docker push gcr.io/diego-467219/educred-app:v1

# Deploy a Cloud Run
gcloud run deploy educred-app \
  --image gcr.io/diego-467219/educred-app:v1 \
  --platform managed \
  --region europe-west1 \
  --allow-unauthenticated \
  --memory 512Mi \
  --port 3000
```

## 📋 Checklist de verificación

- [ ] APIs habilitadas (Container Registry, Cloud Run, Cloud Build)
- [ ] Archivo `cloudbuild-simple.yaml` existe
- [ ] Trigger configurado correctamente
- [ ] Variables de entorno configuradas (si las necesitas en build time)
- [ ] Permisos correctos en el Service Account de Cloud Build

## 🔐 Permisos del Service Account

El Service Account de Cloud Build necesita:

```bash
# Obtener el service account
PROJECT_NUMBER=$(gcloud projects describe diego-467219 --format="value(projectNumber)")
SA_EMAIL="${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com"

# Asignar roles necesarios
gcloud projects add-iam-policy-binding diego-467219 \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding diego-467219 \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/iam.serviceAccountUser"
```

## 🚀 Test después de aplicar la solución

1. Haz un push a `main`:
   ```bash
   git commit --allow-empty -m "Test: Cloud Build trigger"
   git push origin main
   ```

2. Ve a **Cloud Build** → **History** para ver el progreso

3. Si funciona, verás:
   - ✅ Build exitoso
   - ✅ Imagen pusheada
   - ✅ Service desplegado en Cloud Run

## 💡 Recomendaciones adicionales

1. **Usa nombres simples**: Evita caracteres especiales en nombres de servicios
2. **Container Registry es más simple**: Si no necesitas features avanzadas de Artifact Registry
3. **Variables en runtime**: Pasa las variables de entorno en el deploy, no en build time
4. **Logs detallados**: Activa logs completos para debug

## 📞 Si el problema persiste

1. Verifica los logs completos en Cloud Build History
2. Revisa que el Dockerfile sea válido
3. Considera usar el script `deploy.ps1` para deploy manual
4. Contacta con el log completo del error

---

**Archivo principal a usar:** `cloudbuild-simple.yaml`
**Region recomendada:** `europe-west1` (ya que estás usando esa region)
