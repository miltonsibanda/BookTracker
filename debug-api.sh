#!/bin/bash

echo "🔍 Debugging BookTracker API Connection"
echo ""

# Check if containers are running
echo "1. Checking running containers..."
docker ps --filter "name=booktracker" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "2. Testing API endpoints..."

# Test frontend
echo "Frontend (port 8081):"
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" http://localhost:8081 || echo "Frontend not accessible"

echo ""
echo "API (port 3001):"
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" http://localhost:3001/api/health || echo "API not accessible"

echo ""
echo "3. Testing API health endpoint..."
curl -s http://localhost:3001/api/health 2>/dev/null | python3 -m json.tool 2>/dev/null || echo "API health check failed"

echo ""
echo "4. Testing API books endpoint..."
curl -s http://localhost:3001/api/books 2>/dev/null | python3 -m json.tool 2>/dev/null || echo "Books endpoint failed"

echo ""
echo "5. Container logs (last 10 lines)..."
echo "=== API Logs ==="
docker logs booktracker-api --tail 10 2>/dev/null || echo "No API container logs"

echo ""
echo "=== Frontend Logs ==="
docker logs booktracker-frontend --tail 10 2>/dev/null || echo "No frontend container logs"
