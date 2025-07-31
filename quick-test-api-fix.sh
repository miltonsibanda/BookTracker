#!/bin/bash

echo "🔧 Testing API connection fix..."

# Stop existing containers
echo "Stopping existing containers..."
docker compose down --remove-orphans

# Rebuild frontend with the API URL fix
echo "Rebuilding containers with API fix..."
docker compose up -d --build

# Wait for containers to start
echo "Waiting for containers to start..."
sleep 15

# Check container health
echo ""
echo "📊 Container status:"
docker compose ps

# Test endpoints
echo ""
echo "📡 Testing API endpoints..."

echo "1. Direct API health check:"
curl -s http://localhost:3001/api/health | jq '.' 2>/dev/null || echo "❌ Direct API connection failed"

echo ""
echo "2. Frontend proxy health check:"
curl -s http://localhost:8081/api/health | jq '.' 2>/dev/null || echo "❌ Frontend proxy failed"

echo ""
echo "3. Frontend proxy books endpoint:"
curl -s http://localhost:8081/api/books | jq '.' 2>/dev/null || echo "❌ Books endpoint failed"

# Check if frontend loads properly
echo ""
echo "4. Frontend main page:"
curl -s -I http://localhost:8081/ | head -1

echo ""
echo "🔍 Recent API logs:"
docker compose logs --tail=5 booktracker-api

echo ""
echo "🔍 Recent frontend logs:"
docker compose logs --tail=5 booktracker

echo ""
echo "✅ Test complete!"
echo ""
echo "🌐 Open your browser and test:"
echo "   Frontend: http://localhost:8081"
echo "   (Should now connect to API via nginx proxy)"
echo ""
echo "💡 Expected behavior:"
echo "   - Connection status should show 'Connected to database'"
echo "   - Books should sync from API server"
echo "   - Cross-device access should work"
