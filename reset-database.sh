#!/bin/bash

# Script to completely reset BookTracker database

echo "🛑 This will completely reset the BookTracker database!"
echo "⚠️  All books will be permanently deleted."
echo ""
read -p "Are you sure? (type 'yes' to confirm): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Operation cancelled"
    exit 0
fi

echo "🔄 Stopping containers..."
docker-compose down

echo "🗑️ Removing database volume..."
docker volume rm booktracker_booktracker-data 2>/dev/null || echo "Volume may not exist"

echo "🚀 Starting containers with fresh database..."
docker-compose up -d

echo "⏳ Waiting for containers to be ready..."
sleep 10

echo "✅ Database reset complete!"
echo "📊 Checking status..."
curl -s http://localhost:3001/health | jq '.'
