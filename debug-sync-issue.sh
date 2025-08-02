#!/bin/bash

echo "🔧 Forcing frontend to sync from server..."

echo ""
echo "📊 Current database state:"
docker exec booktracker-api sqlite3 /app/data/booktracker.db \
  "SELECT id, title, cover_image, date_modified FROM books WHERE title LIKE '%Fourth Wing%';"

echo ""
echo "🌐 What API returns:"
curl -s http://localhost:3001/api/books | jq '.[] | select(.title | contains("Fourth Wing")) | {id, title, coverImage, dateModified}'

echo ""
echo "🧹 Clearing localStorage cache to force server sync..."
echo "Open browser console and run:"
echo "localStorage.clear(); sessionStorage.clear(); location.reload();"

echo ""
echo "💡 Or open this URL to force cache refresh:"
echo "http://localhost:8081/?v=$(date +%Y%m%d%H%M%S)&forcereload=true"
