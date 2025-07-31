#!/bin/bash

echo "🔧 Testing fixed API connection..."

# Stop existing containers
echo "Stopping existing containers..."
docker compose down --remove-orphans

# Rebuild and start containers
echo "Rebuilding and starting containers..."
docker compose up -d --build

# Wait for containers to be healthy
echo "Waiting for containers to start..."
sleep 10

# Test API connectivity
echo ""
echo "📡 Testing API connectivity..."

# Test 1: Direct API health check
echo "1. Testing direct API health endpoint:"
curl -s http://localhost:3001/health | jq '.' || echo "Failed to connect to API directly"

# Test 2: Frontend proxy health check
echo ""
echo "2. Testing frontend proxy to API:"
curl -s http://localhost:8081/api/health | jq '.' || echo "Failed to connect through frontend proxy"

# Test 3: Books endpoint
echo ""
echo "3. Testing books endpoint:"
curl -s http://localhost:8081/api/books | jq '.' || echo "Failed to get books"

# Check container statuses
echo ""
echo "📊 Container statuses:"
docker compose ps

echo ""
echo "🔍 API container logs (last 10 lines):"
docker compose logs --tail=10 booktracker-api

echo ""
echo "🔍 Frontend container logs (last 10 lines):"
docker compose logs --tail=10 booktracker

echo ""
echo "✅ Test complete! Try accessing the application at:"
echo "   Frontend: http://localhost:8081"
echo "   API:      http://localhost:3001"
