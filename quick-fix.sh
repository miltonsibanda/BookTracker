#!/bin/bash

echo "🔧 BookTracker Quick Fix - Resolving Docker Network Issues"
echo ""

# Clean up any problematic containers
echo "1. Stopping any existing containers..."
docker stop booktracker-api booktracker-frontend 2>/dev/null || true
docker rm booktracker-api booktracker-frontend 2>/dev/null || true

# Clean up any problematic networks
echo "2. Cleaning up networks..."
docker network rm booktracker-network 2>/dev/null || true
docker network rm bookwebsite_booktracker-network 2>/dev/null || true

# Clean up and recreate with proper naming
echo "3. Recreating fresh resources..."
docker network create booktracker-network 2>/dev/null || true
docker volume create booktracker-data 2>/dev/null || true

echo "4. Building images..."
docker build -t booktracker-api:latest ./backend
docker build -t booktracker-frontend:latest .

echo "5. Starting containers..."
docker run -d \
    --name booktracker-api \
    --network booktracker-network \
    -p 3001:3001 \
    -v booktracker-data:/app/data \
    -e NODE_ENV=production \
    booktracker-api:latest

sleep 3

docker run -d \
    --name booktracker-frontend \
    --network booktracker-network \
    -p 8081:80 \
    booktracker-frontend:latest

echo ""
echo "✅ BookTracker should now be running!"
echo "🌐 Access it at: http://localhost:8081"
echo ""
echo "To check status: docker ps"
echo "To view logs: docker logs booktracker-api && docker logs booktracker-frontend"
