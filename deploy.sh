#!/bin/bash
# Script de despliegue rápido para Google Cloud Run (Linux/Mac)
# Uso: ./deploy.sh [project-id] [region]

set -e

PROJECT_ID=${1:-$(gcloud config get-value project 2>/dev/null)}
REGION=${2:-"us-central1"}
SERVICE_NAME="educred-app"

echo "🚀 Iniciando despliegue de EduCred a Google Cloud Run"
echo ""

# Verificar si gcloud está instalado
if ! command -v gcloud &> /dev/null; then
    echo "❌ Error: Google Cloud SDK no está instalado"
    echo "Descárgalo desde: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Verificar Project ID
if [ -z "$PROJECT_ID" ]; then
    echo "❌ Error: No se pudo obtener el Project ID"
    echo "Ejecuta: gcloud config set project YOUR_PROJECT_ID"
    exit 1
fi

echo "📋 Configuración:"
echo "   Project ID: $PROJECT_ID"
echo "   Region: $REGION"
echo "   Service: $SERVICE_NAME"
echo ""

# Confirmar
read -p "¿Continuar con el despliegue? (s/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo "❌ Despliegue cancelado"
    exit 0
fi

echo ""
echo "🔐 Verificando autenticación..."
if ! gcloud auth application-default print-access-token &> /dev/null; then
    echo "⚠️  Autenticación requerida"
    gcloud auth login
fi

echo "✅ Autenticación exitosa"
echo ""

# Habilitar APIs necesarias
echo "🔧 Verificando APIs habilitadas..."
gcloud services enable run.googleapis.com --project=$PROJECT_ID
gcloud services enable cloudbuild.googleapis.com --project=$PROJECT_ID
gcloud services enable containerregistry.googleapis.com --project=$PROJECT_ID

echo "✅ APIs habilitadas"
echo ""

# Build de la imagen
echo "🐳 Construyendo imagen Docker..."
IMAGE_NAME="gcr.io/$PROJECT_ID/$SERVICE_NAME"

gcloud builds submit --tag $IMAGE_NAME --project=$PROJECT_ID

echo "✅ Imagen construida exitosamente"
echo ""

# Obtener variables de entorno desde .env.local si existe
ENV_VARS="NODE_ENV=production"
if [ -f ".env.local" ]; then
    echo "📝 Leyendo variables de entorno desde .env.local..."
    
    while IFS='=' read -r key value; do
        if [[ $key == NEXT_PUBLIC_* ]] && [[ ! $key =~ ^# ]]; then
            ENV_VARS="$ENV_VARS,$key=$value"
        fi
    done < .env.local
fi

echo "✅ Variables de entorno configuradas"
echo ""

# Deploy a Cloud Run
echo "🚀 Desplegando a Cloud Run..."

gcloud run deploy $SERVICE_NAME \
    --image $IMAGE_NAME \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --memory 512Mi \
    --cpu 1 \
    --max-instances 10 \
    --min-instances 0 \
    --port 3000 \
    --set-env-vars="$ENV_VARS" \
    --timeout 300 \
    --project=$PROJECT_ID

echo ""
echo "✅ ¡Despliegue exitoso!"
echo ""

# Obtener URL del servicio
echo "🌐 Obteniendo URL del servicio..."
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
    --platform managed \
    --region $REGION \
    --format "value(status.url)" \
    --project=$PROJECT_ID)

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 ¡Aplicación desplegada exitosamente!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📍 URL de la aplicación:"
echo "   $SERVICE_URL"
echo ""
echo "📊 Ver logs:"
echo "   gcloud run services logs tail $SERVICE_NAME --region $REGION"
echo ""
echo "🔧 Ver detalles del servicio:"
echo "   gcloud run services describe $SERVICE_NAME --region $REGION"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
