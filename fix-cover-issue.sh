#!/bin/bash

echo "🔍 Investigating cover URL issue..."

echo ""
echo "📚 All Fourth Wing books in database:"
docker exec booktracker-api sqlite3 /app/data/booktracker.db \
  "SELECT id, title, author, cover_image, date_added FROM books WHERE title LIKE '%Fourth Wing%';"

echo ""
echo "🔄 Let's remove the duplicate without cover image..."
echo "Deleting the empty cover image entry (198678a875a24w5njpl)..."

docker exec booktracker-api sqlite3 /app/data/booktracker.db \
  "DELETE FROM books WHERE id = '198678a875a24w5njpl';"

echo ""
echo "✅ After cleanup - remaining Fourth Wing books:"
docker exec booktracker-api sqlite3 /app/data/booktracker.db \
  "SELECT id, title, author, cover_image FROM books WHERE title LIKE '%Fourth Wing%';"

echo ""
echo "🧹 Cache clear to refresh frontend..."
cd /tmp/BookTracker && ./quick-cache-clear.sh
