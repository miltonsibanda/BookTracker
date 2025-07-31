#!/bin/bash

echo "🧹 Fixing container conflicts and testing complete solution..."

# Stop ALL containers including orphaned ones
echo "1. Stopping ALL Docker containers..."
docker stop $(docker ps -aq) 2>/dev/null || echo "No containers to stop"

# Remove ALL containers including orphaned ones
echo "2. Removing ALL Docker containers..."
docker rm $(docker ps -aq) 2>/dev/null || echo "No containers to remove"

# Remove any conflicting networks
echo "3. Cleaning up networks..."
docker network prune -f

# Remove any dangling images and volumes
echo "4. Cleaning up Docker system..."
docker system prune -f
docker volume prune -f

# Now restart with fresh containers
echo ""
echo "5. Starting fresh containers..."
echo "   - Fixed API URL detection in frontend JavaScript"
echo "   - Added curl to frontend container for healthcheck"
echo "   - Updated healthcheck to use curl instead of wget"
docker compose up -d --build --force-recreate

# Wait for startup with better monitoring
echo ""
echo "6. Monitoring container startup..."
for i in {1..30}; do
    echo -n "."
    sleep 2
    
    # Check if containers exist and are running
    api_running=$(docker compose ps booktracker-api --format "{{.Status}}" 2>/dev/null || echo "not found")
    frontend_running=$(docker compose ps booktracker-app --format "{{.Status}}" 2>/dev/null || echo "not found")
    
    echo ""
    echo "   API: $api_running"
    echo "   Frontend: $frontend_running"
    
    if [[ $api_running == *"healthy"* ]] && [[ $frontend_running == *"healthy"* ]]; then
        echo ""
        echo "✅ Both containers are healthy!"
        break
    fi
    
    if [[ $i -eq 30 ]]; then
        echo ""
        echo "⚠️  Timeout - checking what's wrong..."
        echo ""
        echo "Container status:"
        docker compose ps
        echo ""
        echo "API logs:"
        docker compose logs booktracker-api --tail=5
        echo ""
        echo "Frontend logs:"
        docker compose logs booktracker-app --tail=5
    fi
done

echo ""
echo "7. Final verification:"
docker compose ps

echo ""
echo "8. Testing all endpoints:"

# Test frontend
echo ""
echo "📱 Frontend (http://localhost:8081):"
frontend_response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8081/ 2>/dev/null || echo "000")
if [[ $frontend_response == "200" ]]; then
    echo "✅ Frontend serving correctly (HTTP $frontend_response)"
else
    echo "❌ Frontend failed (HTTP $frontend_response)"
    echo "   Checking nginx status in container..."
    docker compose exec booktracker-app ps aux | grep nginx || echo "   nginx not running"
fi

# Test API direct
echo ""
echo "🔗 Direct API (http://localhost:3001/api/health):"
curl -s http://localhost:3001/api/health 2>/dev/null | jq '.' && echo "✅ Direct API working" || echo "❌ Direct API failed"

# Test API through frontend proxy
echo ""
echo "🔄 API via frontend proxy (http://localhost:8081/api/health):"
curl -s http://localhost:8081/api/health 2>/dev/null | jq '.' && echo "✅ Frontend proxy working" || echo "❌ Frontend proxy failed"

# Test books endpoint
echo ""
echo "📚 Books endpoint (http://localhost:8081/api/books):"
books_response=$(curl -s http://localhost:8081/api/books 2>/dev/null)
if echo "$books_response" | jq '.' >/dev/null 2>&1; then
    books_count=$(echo "$books_response" | jq 'length' 2>/dev/null || echo "unknown")
    echo "✅ Books endpoint working (Found $books_count books)"
else
    echo "❌ Books endpoint failed"
    echo "Response: $books_response"
fi

echo ""
echo "9. Cross-device access information:"
# Fix hostname command for macOS
if command -v ipconfig >/dev/null 2>&1; then
    # macOS
    local_ip=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "IP not found")
elif command -v hostname >/dev/null 2>&1; then
    # Linux
    local_ip=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "IP not found")
else
    local_ip="IP not found"
fi

echo "   🌐 Access from other devices on your network:"
echo "   📱 Frontend: http://$local_ip:8081"
echo "   🔗 API:      http://$local_ip:3001"

echo ""
echo "10. Final health summary:"
api_health=$(docker inspect booktracker-api --format='{{.State.Health.Status}}' 2>/dev/null || echo "not found")
frontend_health=$(docker inspect booktracker-app --format='{{.State.Health.Status}}' 2>/dev/null || echo "not found")
echo "    📡 API Container: $api_health"
echo "    📱 Frontend Container: $frontend_health"

if [[ $api_health == "healthy" ]] && [[ $frontend_health == "healthy" ]]; then
    echo ""
    echo "🎉 SUCCESS! All systems are operational!"
    echo ""
    echo "🚀 Ready to test cross-device persistence:"
    echo "   1. Open http://localhost:8081 in your browser"
    echo "   2. Look for green 'Connected to database' status"
    echo "   3. Add a test book"
    echo "   4. Access from another device: http://$local_ip:8081"
    echo "   5. Verify the book appears on the other device"
else
    echo ""
    echo "❌ Issues detected. Check container logs for details:"
    echo "   docker compose logs booktracker-api"
    echo "   docker compose logs booktracker-app"
fi
