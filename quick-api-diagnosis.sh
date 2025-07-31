#!/bin/bash

echo "🏥 API Container Health Diagnosis"

echo ""
echo "1. Current container status:"
docker compose ps booktracker-api

echo ""
echo "2. Detailed health check history:"
docker inspect booktracker-api --format='{{range .State.Health.Log}}{{.Start}}: {{.Output}}{{end}}' 2>/dev/null

echo ""
echo "3. Container startup logs:"
docker compose logs booktracker-api

echo ""
echo "4. Check if database directory exists and has permissions:"
docker compose exec booktracker-api ls -la /app/data/ 2>/dev/null || echo "Cannot check /app/data directory"

echo ""
echo "5. Check if SQLite file was created:"
docker compose exec booktracker-api ls -la /app/data/booktracker.db 2>/dev/null || echo "SQLite database file not found"

echo ""
echo "6. Try manual health check from inside container:"
docker compose exec booktracker-api curl -f http://localhost:3001/api/health 2>/dev/null || echo "Health check failed from inside container"

echo ""
echo "7. Check if node process is running:"
docker compose exec booktracker-api pgrep -fl node 2>/dev/null || echo "Node process not found"

echo ""
echo "8. Check listening ports inside container:"
docker compose exec booktracker-api netstat -tlnp 2>/dev/null || echo "Cannot check ports"

echo ""
echo "💡 Potential issues to check:"
echo "   - Database initialization failing"
echo "   - Permission issues with /app/data directory"
echo "   - Node.js process not starting"
echo "   - Port 3001 not binding correctly"
echo "   - Missing dependencies in container"
