# Makefile para comandos Docker y deployment
.PHONY: help build run stop clean deploy logs test

help: ## Mostrar ayuda
	@echo "Comandos disponibles:"
	@echo "  make build         - Construir imagen Docker"
	@echo "  make run          - Ejecutar contenedor localmente"
	@echo "  make stop         - Detener contenedor"
	@echo "  make clean        - Limpiar imágenes y contenedores"
	@echo "  make deploy       - Desplegar a Google Cloud Run"
	@echo "  make logs         - Ver logs del contenedor"
	@echo "  make test         - Probar la imagen localmente"
	@echo "  make push         - Push imagen a GCR"

build: ## Construir imagen Docker
	@echo "🐳 Construyendo imagen Docker..."
	docker build -t educred-app:latest .

run: ## Ejecutar contenedor localmente
	@echo "🚀 Ejecutando contenedor..."
	docker run -d \
		--name educred-app \
		-p 3000:3000 \
		--env-file .env.local \
		educred-app:latest
	@echo "✅ Aplicación corriendo en http://localhost:3000"

stop: ## Detener contenedor
	@echo "🛑 Deteniendo contenedor..."
	docker stop educred-app || true
	docker rm educred-app || true

clean: stop ## Limpiar imágenes y contenedores
	@echo "🧹 Limpiando..."
	docker rmi educred-app:latest || true
	docker system prune -f

test: build ## Probar imagen localmente
	@echo "🧪 Probando imagen..."
	docker run --rm \
		-p 3000:3000 \
		--env-file .env.local \
		educred-app:latest

push: ## Push a Google Container Registry
	@echo "⬆️  Subiendo imagen a GCR..."
	@if [ -z "$(PROJECT_ID)" ]; then \
		echo "❌ Error: Define PROJECT_ID"; \
		echo "Uso: make push PROJECT_ID=tu-project-id"; \
		exit 1; \
	fi
	docker tag educred-app:latest gcr.io/$(PROJECT_ID)/educred-app:latest
	docker push gcr.io/$(PROJECT_ID)/educred-app:latest

deploy: ## Desplegar a Cloud Run
	@echo "🚀 Desplegando a Google Cloud Run..."
	@if [ -f "deploy.sh" ]; then \
		chmod +x deploy.sh; \
		./deploy.sh; \
	else \
		echo "❌ Error: deploy.sh no encontrado"; \
		exit 1; \
	fi

logs: ## Ver logs del contenedor
	docker logs -f educred-app

shell: ## Acceder al shell del contenedor
	docker exec -it educred-app sh

health: ## Verificar health check
	@curl -s http://localhost:3000/api/health | jq .

compose-up: ## Ejecutar con Docker Compose
	docker-compose up -d

compose-down: ## Detener Docker Compose
	docker-compose down

compose-logs: ## Ver logs de Docker Compose
	docker-compose logs -f
