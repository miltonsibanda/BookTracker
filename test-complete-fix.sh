#!/bin/bash

echo "🔧 Testing complete API connection fix..."

# Stop existing containers
echo "1. Stopping existing containers..."
docker compose down --remove-orphans

# Clean up any orphaned containers or networks
echo "2. Cleaning up Docker environment..."
docker system prune -f >/dev/null 2>&1

# Rebuild with all fixes
echo "3. Rebuilding containers with fixes..."
echo "   - Fixed API URL detection in frontend JavaScript"
echo "   - Added curl to frontend container for healthcheck"
echo "   - Updated healthcheck to use curl instead of wget"
docker compose up -d --build

# Wait for startup
echo ""
echo "4. Waiting for containers to initialize..."
for i in {1..30}; do
    echo -n "."
    sleep 2
    
    # Check if both containers are running
    api_status=$(docker compose ps booktracker-api --format "{{.Status}}" 2>/dev/null)
    frontend_status=$(docker compose ps booktracker-app --format "{{.Status}}" 2>/dev/null)
    
    if [[ $api_status == *"healthy"* ]] && [[ $frontend_status == *"healthy"* ]]; then
        echo ""
        echo "✅ Both containers are healthy!"
        break
    fi
    
    if [[ $i -eq 30 ]]; then
        echo ""
        echo "⚠️  Timeout waiting for containers to be healthy"
    fi
done

echo ""
echo "5. Final container status:"
docker compose ps

echo ""
echo "6. Testing all endpoints:"

# Test frontend
echo ""
echo "📱 Frontend (http://localhost:8081):"
frontend_response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8081/)
if [[ $frontend_response == "200" ]]; then
    echo "✅ Frontend serving correctly (HTTP $frontend_response)"
else
    echo "❌ Frontend failed (HTTP $frontend_response)"
fi

# Test API direct
echo ""
echo "🔗 Direct API (http://localhost:3001/api/health):"
curl -s http://localhost:3001/api/health | jq '.' 2>/dev/null && echo "✅ Direct API working" || echo "❌ Direct API failed"

# Test API through frontend proxy
echo ""
echo "🔄 API via frontend proxy (http://localhost:8081/api/health):"
curl -s http://localhost:8081/api/health | jq '.' 2>/dev/null && echo "✅ Frontend proxy working" || echo "❌ Frontend proxy failed"

# Test books endpoint
echo ""
echo "📚 Books endpoint (http://localhost:8081/api/books):"
books_response=$(curl -s http://localhost:8081/api/books)
if echo "$books_response" | jq '.' >/dev/null 2>&1; then
    books_count=$(echo "$books_response" | jq 'length')
    echo "✅ Books endpoint working (Found $books_count books)"
else
    echo "❌ Books endpoint failed"
fi

echo ""
echo "7. Cross-device access information:"
echo "   🌐 Access from other devices on your network:"
echo "   📱 Frontend: http://$(hostname -I | awk '{print $1}'):8081"
echo "   🔗 API:      http://$(hostname -I | awk '{print $1}'):3001"

echo ""
echo "8. Quick container health summary:"
api_health=$(docker inspect booktracker-api --format='{{.State.Health.Status}}' 2>/dev/null || echo "unknown")
frontend_health=$(docker inspect booktracker-app --format='{{.State.Health.Status}}' 2>/dev/null || echo "unknown")
echo "   📡 API Container: $api_health"
echo "   📱 Frontend Container: $frontend_health"

echo ""
echo "🎉 TESTING COMPLETE!"
echo ""
echo "💡 Next steps:"
echo "   1. Open http://localhost:8081 in your browser"
echo "   2. Check that connection status shows 'Connected to database'"
echo "   3. Add a book and verify it persists"
echo "   4. Test from another device using your IP address"
echo ""
echo "📊 Expected behavior:"
echo "   - Frontend loads without errors"
echo "   - Connection indicator shows green 'Connected'"
echo "   - Books can be added/edited/deleted"
echo "   - Data persists in SQLite database"
echo "   - Cross-device access works properly"
