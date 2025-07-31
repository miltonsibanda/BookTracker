#!/bin/bash

echo "🔍 Diagnosing Frontend Container Issue..."

echo ""
echo "1. Testing frontend container directly:"
curl -I http://localhost:8081/ 2>/dev/null | head -5

echo ""
echo "2. Testing if frontend serves files:"
curl -s http://localhost:8081/index.html | head -10

echo ""
echo "3. Testing API proxy through frontend:"
curl -s http://localhost:8081/api/health | jq '.' 2>/dev/null || echo "API proxy failed"

echo ""
echo "4. Checking frontend container details:"
docker inspect booktracker-app --format='{{.State.Health.Status}}: {{range .State.Health.Log}}{{.Output}}{{end}}'

echo ""
echo "5. Testing container startup:"
docker compose logs booktracker-app

echo ""
echo "6. Checking if nginx is running in container:"
docker compose exec booktracker-app ps aux | grep nginx || echo "nginx not found"

echo ""
echo "7. Checking container filesystem:"
docker compose exec booktracker-app ls -la /usr/share/nginx/html/ | head -10
