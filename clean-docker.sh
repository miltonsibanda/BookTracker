#!/bin/bash

echo "🧹 Cleaning up Docker resources for fresh start..."

# Stop all BookTracker containers
echo "Stopping containers..."
docker stop booktracker-api booktracker-frontend 2>/dev/null || true
docker rm booktracker-api booktracker-frontend 2>/dev/null || true

# Also clean up any compose containers
docker compose down 2>/dev/null || true

# Remove networks (both standalone and compose versions)
echo "Cleaning networks..."
docker network rm booktracker-network 2>/dev/null || true
docker network rm bookwebsite_booktracker-network 2>/dev/null || true

# Clean up images to force rebuild
echo "Removing old images..."
docker rmi booktracker-api:latest booktracker-frontend:latest 2>/dev/null || true

echo "✅ Cleanup complete! Now run: make run"
