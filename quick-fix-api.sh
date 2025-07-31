#!/bin/bash

echo "🔧 Attempting API container quick fixes..."

echo ""
echo "1. Stopping current containers..."
docker compose down

echo ""
echo "2. Removing any existing data volumes (fresh start)..."
docker volume rm bookwebsite_booktracker-data bookwebsite_booktracker-backups 2>/dev/null || echo "Volumes already removed"

echo ""
echo "3. Rebuilding API container with verbose output..."
docker compose build --no-cache booktracker-api

echo ""
echo "4. Starting API container alone first..."
docker compose up -d booktracker-api

echo ""
echo "5. Monitoring API startup (30 seconds)..."
for i in {1..15}; do
    echo -n "."
    sleep 2
    
    # Check container status
    status=$(docker compose ps booktracker-api --format "{{.Status}}" 2>/dev/null)
    echo " [$i] API Status: $status"
    
    # Check if it's running and try health check
    if [[ $status == *"Up"* ]]; then
        health_response=$(curl -s http://localhost:3001/api/health 2>/dev/null)
        if [[ -n "$health_response" ]]; then
            echo "✅ API responding! Health: $health_response"
            break
        fi
    fi
done

echo ""
echo "6. Current API logs:"
docker compose logs booktracker-api --tail=20

echo ""
echo "7. If API is working, start frontend:"
api_health=$(docker inspect booktracker-api --format='{{.State.Health.Status}}' 2>/dev/null)
if [[ $api_health == "healthy" ]]; then
    echo "API is healthy, starting frontend..."
    docker compose up -d booktracker-app
    sleep 10
    
    echo ""
    echo "8. Testing complete system:"
    docker compose ps
    
    echo ""
    echo "Frontend test:"
    curl -s -I http://localhost:8081/ | head -1
    
    echo ""
    echo "API proxy test:"
    curl -s http://localhost:8081/api/health | jq '.' 2>/dev/null || echo "Proxy test failed"
else
    echo "API is not healthy ($api_health). Check logs above for errors."
    echo ""
    echo "Common fixes to try:"
    echo "  - Check database permissions"
    echo "  - Verify all dependencies are installed"
    echo "  - Check if port 3001 is already in use"
    echo "  - Review application code for startup errors"
fi
