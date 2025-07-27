# BookTracker Docker Makefile

.PHONY: help build run stop clean logs shell dev prod test

# Default target
help:
	@echo "BookTracker Docker Commands:"
	@echo ""
	@echo "  build    - Build the Docker image"
	@echo "  run      - Run the container in development mode"
	@echo "  prod     - Run the container in production mode"
	@echo "  stop     - Stop the running container"
	@echo "  clean    - Stop and remove container and image"
	@echo "  logs     - View container logs"
	@echo "  shell    - Open a shell in the running container"
	@echo "  test     - Test the application"
	@echo "  dev      - Run with development settings"
	@echo ""

# Build the Docker image
build:
	@echo "🔨 Building BookTracker Docker image..."
	docker build -t booktracker:latest .
	@echo "✅ Build complete!"

# Run in development mode
run: build
	@echo "🚀 Starting BookTracker container..."
	@if docker ps -q -f name=booktracker-app | grep -q .; then \
		echo "⚠️  Container already running. Stopping first..."; \
		docker stop booktracker-app; \
		docker rm booktracker-app; \
	fi
	docker run -d -p 8080:80 --name booktracker-app booktracker:latest
	@echo "✅ BookTracker is running at http://localhost:8080"

# Run in production mode
prod:
	@echo "🏭 Starting BookTracker in production mode..."
	docker-compose -f docker-compose.prod.yml up -d
	@echo "✅ BookTracker production instance is running"

# Run with Docker Compose (development)
dev:
	@echo "🛠️  Starting BookTracker with Docker Compose (development)..."
	docker-compose up -d
	@echo "✅ BookTracker development instance is running at http://localhost:8080"

# Stop the container
stop:
	@echo "🛑 Stopping BookTracker container..."
	@if docker ps -q -f name=booktracker-app | grep -q .; then \
		docker stop booktracker-app; \
		echo "✅ Container stopped"; \
	else \
		echo "ℹ️  No running container found"; \
	fi

# Clean up everything
clean: stop
	@echo "🧹 Cleaning up Docker resources..."
	@if docker ps -a -q -f name=booktracker-app | grep -q .; then \
		docker rm booktracker-app; \
	fi
	@if docker images -q booktracker | grep -q .; then \
		docker rmi booktracker; \
	fi
	@echo "✅ Cleanup complete!"

# View logs
logs:
	@echo "📋 Viewing BookTracker logs..."
	docker logs -f booktracker-app

# Open shell in container
shell:
	@echo "🐚 Opening shell in BookTracker container..."
	docker exec -it booktracker-app sh

# Test the application
test:
	@echo "🧪 Testing BookTracker application..."
	@if curl -s -o /dev/null -w "%{http_code}" http://localhost:8080 | grep -q "200"; then \
		echo "✅ Application is responding correctly"; \
	else \
		echo "❌ Application test failed"; \
	fi

# Show container status
status:
	@echo "📊 BookTracker Container Status:"
	@if docker ps -q -f name=booktracker-app | grep -q .; then \
		docker ps --filter name=booktracker-app --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"; \
	else \
		echo "ℹ️  No BookTracker container is running"; \
	fi

# Quick restart
restart: stop run

# View all Docker resources
docker-info:
	@echo "🐳 Docker Information:"
	@echo ""
	@echo "Images:"
	@docker images booktracker
	@echo ""
	@echo "Containers:"
	@docker ps -a --filter name=booktracker
