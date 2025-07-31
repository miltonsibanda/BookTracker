#!/bin/bash

echo "🔍 Checking current Docker state..."

echo ""
echo "1. All running containers:"
docker ps

echo ""
echo "2. All containers (including stopped):"
docker ps -a

echo ""
echo "3. Docker Compose services:"
docker compose ps

echo ""
echo "4. Networks:"
docker network ls | grep booktracker || echo "No booktracker networks found"

echo ""
echo "5. Testing if orphaned API is still responding:"
curl -s http://localhost:3001/api/health | jq '.' 2>/dev/null || echo "No API response on port 3001"

echo ""
echo "6. Checking if frontend port is in use:"
curl -s -I http://localhost:8081/ | head -1 2>/dev/null || echo "No response on port 8081"

echo ""
echo "💡 Solution: Run ./fix-containers-and-test.sh to clean up and restart properly"
