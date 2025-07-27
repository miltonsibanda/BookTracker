# BookTracker Docker Management Makefile

# Variables
CONTAINER_NAME = booktracker-app
IMAGE_NAME = booktracker
VOLUME_NAME = booktracker-data
PORT = 8081

.PHONY: help build run stop clean logs dev test backup restore status

# Default target
help: ## Show this help message
	@echo "BookTracker Docker Management Commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "Data Persistence Commands:"
	@echo "  backup          Create backup of book data"
	@echo "  restore         Restore book data from backup"
	@echo "  volume-info     Show volume information"
	@echo ""

build: ## Build the BookTracker Docker image
	@echo "🏗️  Building BookTracker image..."
	docker build -t $(IMAGE_NAME) .
	@echo "✅ Build complete!"

run: ## Run BookTracker container with data persistence
	@echo "🚀 Starting BookTracker with data persistence..."
	docker-compose up -d
	@echo "✅ BookTracker is running at http://localhost:$(PORT)"
	@echo "📊 Check logs with: make logs"

dev: ## Run in development mode with hot reload
	@echo "🛠️  Starting BookTracker in development mode..."
	docker-compose -f docker-compose.yml up --build
	@echo "✅ Development server started!"

stop: ## Stop the BookTracker container
	@echo "⏹️  Stopping BookTracker..."
	docker-compose down
	@echo "✅ BookTracker stopped!"

restart: stop run ## Restart the BookTracker container

logs: ## Show container logs
	@echo "📋 BookTracker logs:"
	docker-compose logs -f --tail=50

clean: ## Remove container and image (keeps data volume)
	@echo "🧹 Cleaning up containers and images..."
	docker-compose down --rmi all --remove-orphans
	@echo "✅ Cleanup complete! Data volume preserved."

deep-clean: ## Remove everything including data volume (WARNING: destroys all book data)
	@echo "⚠️  WARNING: This will delete ALL your book data!"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		echo "🗑️  Removing everything..."; \
		docker-compose down -v --rmi all --remove-orphans; \
		echo "✅ Complete cleanup finished!"; \
	else \
		echo "❌ Cleanup cancelled."; \
	fi

status: ## Show container and volume status
	@echo "📊 BookTracker Status:"
	@echo ""
	@echo "Container Status:"
	@docker ps -a --filter name=$(CONTAINER_NAME) --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" || echo "No containers found"
	@echo ""
	@echo "Volume Status:"
	@docker volume ls --filter name=$(VOLUME_NAME) --format "table {{.Name}}\t{{.Driver}}\t{{.CreatedAt}}" || echo "No volumes found"
	@echo ""
	@echo "Image Status:"
	@docker images $(IMAGE_NAME) --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}" || echo "No images found"

backup: ## Create backup of book data
	@echo "💾 Creating backup of book data..."
	@mkdir -p ./backups
	@TIMESTAMP=$$(date +%Y%m%d_%H%M%S); \
	docker run --rm -v $(VOLUME_NAME):/data -v $$(pwd)/backups:/backup alpine \
		sh -c "if [ -f /data/books.json ]; then cp /data/books.json /backup/books_backup_$$TIMESTAMP.json && echo '✅ Backup created: books_backup_$$TIMESTAMP.json'; else echo '❌ No data file found to backup'; fi"

restore: ## Restore book data from backup (requires BACKUP_FILE=filename)
	@if [ -z "$(BACKUP_FILE)" ]; then \
		echo "❌ Please specify BACKUP_FILE=filename"; \
		echo "Available backups:"; \
		ls -la ./backups/books_backup_*.json 2>/dev/null || echo "No backups found"; \
		exit 1; \
	fi
	@echo "🔄 Restoring book data from $(BACKUP_FILE)..."
	@if [ ! -f "./backups/$(BACKUP_FILE)" ]; then \
		echo "❌ Backup file not found: $(BACKUP_FILE)"; \
		exit 1; \
	fi
	docker run --rm -v $(VOLUME_NAME):/data -v $$(pwd)/backups:/backup alpine \
		sh -c "cp /backup/$(BACKUP_FILE) /data/books.json && echo '✅ Data restored from $(BACKUP_FILE)'"
	@echo "🔄 Restarting container to load restored data..."
	@$(MAKE) restart

volume-info: ## Show detailed volume information
	@echo "📁 Volume Information:"
	@docker volume inspect $(VOLUME_NAME) 2>/dev/null || echo "Volume not found: $(VOLUME_NAME)"
	@echo ""
	@echo "📊 Volume Usage:"
	@docker run --rm -v $(VOLUME_NAME):/data alpine sh -c "ls -la /data/ && echo '' && du -sh /data/* 2>/dev/null || echo 'No data files found'"

test: ## Test the application endpoints
	@echo "🧪 Testing BookTracker endpoints..."
	@echo "Testing health endpoint..."
	@curl -s http://localhost:$(PORT)/api/health | jq . || echo "Health check failed"
	@echo ""
	@echo "Testing books API..."
	@curl -s http://localhost:$(PORT)/api/books | jq 'length' || echo "Books API failed"
	@echo "✅ Tests complete!"

prod: ## Run in production mode
	@echo "🚀 Starting BookTracker in production mode..."
	docker-compose -f docker-compose.prod.yml up -d
	@echo "✅ Production server started at http://localhost"

# Development helpers
shell: ## Open shell in running container
	docker exec -it $(CONTAINER_NAME) sh

install: build run ## Full install: build and run
	@echo "🎉 BookTracker installation complete!"
	@echo "📖 Access your book tracker at: http://localhost:$(PORT)"
	@echo "�� Your data is persistently stored and will survive container restarts"
	@echo "📊 Use 'make status' to check system status"
	@echo "📋 Use 'make logs' to view application logs"
