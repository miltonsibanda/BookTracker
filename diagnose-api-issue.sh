#!/bin/bash

echo "🔍 Diagnosing API container issue..."

echo ""
echo "1. API Container detailed status:"
docker inspect booktracker-api --format='{{.State.Health.Status}}: {{range .State.Health.Log}}{{.Output}}{{end}}' 2>/dev/null || echo "Container not found"

echo ""
echo "2. API Container logs (last 20 lines):"
docker compose logs booktracker-api --tail=20

echo ""
echo "3. API Container environment:"
docker compose exec booktracker-api env | grep -E "(NODE|PORT|DATA)" 2>/dev/null || echo "Cannot access container environment"

echo ""
echo "4. Checking if API process is running:"
docker compose exec booktracker-api ps aux 2>/dev/null || echo "Cannot access container processes"

echo ""
echo "5. Checking API container filesystem:"
docker compose exec booktracker-api ls -la /app/ 2>/dev/null || echo "Cannot access container filesystem"

echo ""
echo "6. Testing API health from within the network:"
docker compose exec booktracker-app curl -s http://booktracker-api:3001/api/health 2>/dev/null || echo "Cannot test internal API connection"

echo ""
echo "7. Checking if API port is listening:"
docker compose exec booktracker-api netstat -tlnp 2>/dev/null | grep 3001 || echo "Port 3001 not listening or netstat not available"

echo ""
echo "8. Manual API container restart attempt:"
echo "Restarting API container..."
docker compose restart booktracker-api

echo ""
echo "Waiting 10 seconds for restart..."
sleep 10

echo ""
echo "9. Post-restart status:"
docker compose ps

echo ""
echo "10. Post-restart logs:"
docker compose logs booktracker-api --tail=10

echo ""
echo "11. Testing API after restart:"
curl -s http://localhost:3001/api/health 2>/dev/null | jq '.' && echo "✅ API working after restart" || echo "❌ API still failing"
