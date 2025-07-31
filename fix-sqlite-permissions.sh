#!/bin/bash

echo "🔧 Fixing SQLite permissions and database path issues..."

# Stop all containers
echo "1. Stopping all containers..."
docker compose down --remove-orphans

# Remove volumes to start fresh
echo "2. Removing data volumes for fresh start..."
docker volume rm bookwebsite_booktracker-data bookwebsite_booktracker-backups 2>/dev/null || echo "Volumes already removed"

# Clean Docker cache
echo "3. Cleaning Docker build cache..."
docker builder prune -f

# Rebuild API container with no cache (to pick up Dockerfile changes)
echo "4. Rebuilding API container with permission fixes..."
docker compose build --no-cache booktracker-api

# Start only API container first to test database
echo "5. Starting API container with database fixes..."
docker compose up -d booktracker-api

echo ""
echo "6. Monitoring API startup (checking for database errors)..."
for i in {1..20}; do
    echo "[$i] Checking API status..."
    
    # Get container status
    status=$(docker compose ps booktracker-api --format "{{.Status}}" 2>/dev/null)
    echo "   Container: $status"
    
    # Check recent logs for database messages
    logs=$(docker compose logs booktracker-api --tail=3 2>/dev/null | grep -E "(Database|SQLite|database|📁|✅|❌)" | tail -1)
    if [[ -n "$logs" ]]; then
        echo "   Logs: $logs"
    fi
    
    # Test health endpoint
    if [[ $status == *"Up"* ]]; then
        health_response=$(curl -s http://localhost:3001/api/health 2>/dev/null)
        if echo "$health_response" | jq -e '.database.connected == true' >/dev/null 2>&1; then
            echo "✅ Database connected successfully!"
            break
        fi
    fi
    
    sleep 3
    
    if [[ $i -eq 20 ]]; then
        echo "❌ API failed to start properly. Checking detailed logs..."
        echo ""
        echo "Recent API logs:"
        docker compose logs booktracker-api --tail=15
        echo ""
        echo "Container status:"
        docker compose ps booktracker-api
        exit 1
    fi
done

echo ""
echo "7. API container is working! Starting frontend..."
docker compose up -d booktracker-app

echo ""
echo "8. Waiting for frontend to be ready..."
sleep 15

echo ""
echo "9. Final system test:"
docker compose ps

echo ""
echo "📱 Frontend test:"
frontend_response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8081/ 2>/dev/null)
if [[ $frontend_response == "200" ]]; then
    echo "✅ Frontend serving correctly (HTTP $frontend_response)"
else
    echo "❌ Frontend failed (HTTP $frontend_response)"
fi

echo ""
echo "🔗 Direct API test:"
curl -s http://localhost:3001/api/health | jq '.' && echo "✅ Direct API working" || echo "❌ Direct API failed"

echo ""
echo "🔄 API proxy test:"
curl -s http://localhost:8081/api/health | jq '.' && echo "✅ Frontend proxy working" || echo "❌ Frontend proxy failed"

echo ""
echo "📚 Books endpoint test:"
books_response=$(curl -s http://localhost:8081/api/books)
if echo "$books_response" | jq '.' >/dev/null 2>&1; then
    books_count=$(echo "$books_response" | jq 'length')
    echo "✅ Books endpoint working (Found $books_count books)"
else
    echo "❌ Books endpoint failed"
fi

echo ""
echo "🎉 SQLITE PERMISSION FIX COMPLETE!"
echo ""
echo "Key fixes applied:"
echo "  ✅ Fixed Dockerfile permissions (chmod 755 for data directory)"
echo "  ✅ Updated database.js to use DATA_DIR environment variable"
echo "  ✅ Added proper directory writability checks"
echo "  ✅ Fresh volumes to eliminate permission conflicts"
echo ""
echo "🌐 Cross-device access:"
local_ip=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "IP not found")
echo "   📱 Frontend: http://$local_ip:8081"
echo "   🔗 API:      http://$local_ip:3001"
echo ""
echo "💡 Test the fix:"
echo "   1. Open http://localhost:8081"
echo "   2. Should show 'Connected to database' status"
echo "   3. Add a book to test persistence"
echo "   4. Access from another device to verify cross-device sync"
