# Script de despliegue rápido para Google Cloud Run
# Uso: .\deploy.ps1 [project-id] [region]

param(
    [Parameter(Mandatory=$false)]
    [string]$ProjectId = "",
    
    [Parameter(Mandatory=$false)]
    [string]$Region = "us-central1",
    
    [Parameter(Mandatory=$false)]
    [string]$ServiceName = "educred-app"
)

Write-Host "🚀 Iniciando despliegue de EduCred a Google Cloud Run" -ForegroundColor Green
Write-Host ""

# Verificar si gcloud está instalado
if (-not (Get-Command gcloud -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Error: Google Cloud SDK no está instalado" -ForegroundColor Red
    Write-Host "Descárgalo desde: https://cloud.google.com/sdk/docs/install" -ForegroundColor Yellow
    exit 1
}

# Obtener el Project ID actual si no se proporciona
if ([string]::IsNullOrEmpty($ProjectId)) {
    $ProjectId = gcloud config get-value project 2>$null
    if ([string]::IsNullOrEmpty($ProjectId)) {
        Write-Host "❌ Error: No se pudo obtener el Project ID" -ForegroundColor Red
        Write-Host "Ejecuta: gcloud config set project YOUR_PROJECT_ID" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host "📋 Configuración:" -ForegroundColor Cyan
Write-Host "   Project ID: $ProjectId"
Write-Host "   Region: $Region"
Write-Host "   Service: $ServiceName"
Write-Host ""

# Confirmar
$confirmation = Read-Host "¿Continuar con el despliegue? (s/n)"
if ($confirmation -ne 's') {
    Write-Host "❌ Despliegue cancelado" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "🔐 Verificando autenticación..." -ForegroundColor Cyan
gcloud auth application-default print-access-token >$null 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Autenticación requerida" -ForegroundColor Yellow
    gcloud auth login
}

Write-Host "✅ Autenticación exitosa" -ForegroundColor Green
Write-Host ""

# Habilitar APIs necesarias
Write-Host "🔧 Verificando APIs habilitadas..." -ForegroundColor Cyan
$apis = @(
    "run.googleapis.com",
    "cloudbuild.googleapis.com",
    "containerregistry.googleapis.com"
)

foreach ($api in $apis) {
    Write-Host "   Habilitando $api..."
    gcloud services enable $api --project=$ProjectId 2>$null
}

Write-Host "✅ APIs habilitadas" -ForegroundColor Green
Write-Host ""

# Build de la imagen
Write-Host "🐳 Construyendo imagen Docker..." -ForegroundColor Cyan
$imageName = "gcr.io/$ProjectId/$ServiceName"

gcloud builds submit --tag $imageName --project=$ProjectId

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error al construir la imagen" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Imagen construida exitosamente" -ForegroundColor Green
Write-Host ""

# Obtener variables de entorno desde .env.local si existe
$envVars = "NODE_ENV=production"
$envFile = ".env.local"

if (Test-Path $envFile) {
    Write-Host "📝 Leyendo variables de entorno desde $envFile..." -ForegroundColor Cyan
    
    $envContent = Get-Content $envFile | Where-Object { $_ -match "^NEXT_PUBLIC_" -and $_ -notmatch "^#" }
    
    foreach ($line in $envContent) {
        if ($line -match "^([^=]+)=(.+)$") {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            $envVars += ",$key=$value"
        }
    }
}

Write-Host "✅ Variables de entorno configuradas" -ForegroundColor Green
Write-Host ""

# Deploy a Cloud Run
Write-Host "🚀 Desplegando a Cloud Run..." -ForegroundColor Cyan

gcloud run deploy $ServiceName `
    --image $imageName `
    --platform managed `
    --region $Region `
    --allow-unauthenticated `
    --memory 512Mi `
    --cpu 1 `
    --max-instances 10 `
    --min-instances 0 `
    --port 3000 `
    --set-env-vars="$envVars" `
    --timeout 300 `
    --project=$ProjectId

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error al desplegar" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ ¡Despliegue exitoso!" -ForegroundColor Green
Write-Host ""

# Obtener URL del servicio
Write-Host "🌐 Obteniendo URL del servicio..." -ForegroundColor Cyan
$serviceUrl = gcloud run services describe $ServiceName `
    --platform managed `
    --region $Region `
    --format "value(status.url)" `
    --project=$ProjectId

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host "🎉 ¡Aplicación desplegada exitosamente!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host ""
Write-Host "📍 URL de la aplicación:" -ForegroundColor Cyan
Write-Host "   $serviceUrl" -ForegroundColor White
Write-Host ""
Write-Host "📊 Ver logs:" -ForegroundColor Cyan
Write-Host "   gcloud run services logs tail $ServiceName --region $Region" -ForegroundColor White
Write-Host ""
Write-Host "🔧 Ver detalles del servicio:" -ForegroundColor Cyan
Write-Host "   gcloud run services describe $ServiceName --region $Region" -ForegroundColor White
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
