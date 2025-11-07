# 🚀 Guía de Despliegue en Google Cloud

## 📋 Método Recomendado: Cloud Build Trigger (Simple)

Este es el método más fácil y no requiere configurar GitHub Actions.

### 1. Conectar repositorio a Cloud Build

```bash
# Ir a Cloud Build en GCP Console
https://console.cloud.google.com/cloud-build/triggers
```

### 2. Crear Trigger

1. Click en **"CREATE TRIGGER"**
2. Configura:
   - **Name:** `deploy-educred`
   - **Event:** Push to a branch
   - **Source:** Selecciona tu repositorio GitHub
   - **Branch:** `^main$`
   - **Configuration:** Cloud Build configuration file (yaml or json)
   - **Location:** `cloudbuild.yaml`
3. Click **"CREATE"**

### 3. ¡Listo! 

Cada push a `main` desplegará automáticamente tu aplicación.

---

## 🔧 Método Alternativo: Deploy Manual

### Opción 1: Script PowerShell (Windows)

```powershell
.\deploy.ps1
```

El script:
- Verificará autenticación
- Habilitará APIs necesarias
- Hará build de la imagen
- Desplegará a Cloud Run
- Mostrará la URL de la aplicación

### Opción 2: Comandos manuales

```bash
# 1. Configurar proyecto
gcloud config set project TU_PROJECT_ID

# 2. Build con Cloud Build
gcloud builds submit --config=cloudbuild.yaml --region=europe-west1

# La URL de tu app aparecerá al final del proceso
```
