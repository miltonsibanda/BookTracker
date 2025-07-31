#!/bin/bash

echo "🧪 Testing Docker Compose detection..."

# Test Docker Compose V2
if docker compose version >/dev/null 2>&1; then
    echo "✅ Docker Compose V2 detected: $(docker compose version --short)"
    COMPOSE_CMD="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
    echo "✅ Docker Compose V1 detected: $(docker-compose --version)"
    COMPOSE_CMD="docker-compose"
else
    echo "❌ No Docker Compose found"
    COMPOSE_CMD=""
fi

echo "🔧 Compose command to use: '$COMPOSE_CMD'"

# Test basic Docker
if command -v docker >/dev/null 2>&1; then
    echo "✅ Docker detected: $(docker --version)"
else
    echo "❌ Docker not found"
fi

echo ""
echo "🚀 You should now be able to run: make run"
