# 🚨 SOLUCIÓN INMEDIATA - Error de Cloud Build

## El Problema
El nombre de imagen generado automáticamente tiene formato inválido:
`europe-west1-docker.pkg.dev/diego-467219/cloud-run-source-deploy/hackaton-uleam-/hackataonuleam`

## ✅ Solución en 3 pasos

### PASO 1: Actualizar Cloud Build Trigger

1. Ve a: https://console.cloud.google.com/cloud-build/triggers?project=diego-467219
2. Click en el trigger de tu repositorio (el que tiene error)
3. Click en **EDIT** ✏️
4. En **Configuration** → **Type**, cambia a: **Cloud Build configuration file (yaml or json)**
5. En **Cloud Build configuration file location**, pon: `cloudbuild-fix.yaml`
6. Click en **SAVE**

### PASO 2: Commit el archivo de configuración

```powershell
# En tu terminal PowerShell
git add cloudbuild-fix.yaml
git commit -m "Fix: Cloud Build naming issue"
git push origin main
```

### PASO 3: Trigger manual (para probar)

Opción A - Desde la consola:
1. Ve a Cloud Build → Triggers
2. Click en **RUN** en tu trigger
3. Selecciona la rama `main`
4. Click en **RUN TRIGGER**

Opción B - Desde terminal:
```powershell
gcloud builds submit --config=cloudbuild-fix.yaml --project=diego-467219 --region=europe-west1
```

## 🔍 Verificar que funciona

Después de hacer push, ve a:
- **Cloud Build → History**: https://console.cloud.google.com/cloud-build/builds?project=diego-467219
- Deberías ver el build ejecutándose ✅
- Status debe ser **SUCCESS** (verde)

## 📝 Qué hace el nuevo archivo

`cloudbuild-fix.yaml`:
- ✅ Usa nombres simples sin caracteres especiales
- ✅ Usa Container Registry (gcr.io) en lugar de Artifact Registry
- ✅ Nombre de imagen: `gcr.io/diego-467219/educred:latest`
- ✅ Nombre de servicio: `educred`
- ✅ Sin variables de sustitución complejas

## 🎯 Si funciona...

Tu aplicación estará disponible en:
```
https://educred-XXXXX-ew.a.run.app
```

El link exacto lo verás en:
1. Cloud Run → Services → educred
2. O en los logs del Cloud Build

## 🔄 Para futuros deploys

Cada vez que hagas push a `main`, se desplegará automáticamente.

## ⚠️ Si sigue fallando

Ejecuta este comando y envíame el output:
```powershell
gcloud builds triggers list --project=diego-467219 --region=europe-west1
```

Y también este:
```powershell
gcloud builds list --project=diego-467219 --region=europe-west1 --limit=1
```

---

**TL;DR**: Cambia el trigger para usar `cloudbuild-fix.yaml` y haz push. ¡Listo! 🚀
