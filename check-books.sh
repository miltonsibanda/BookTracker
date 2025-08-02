#!/bin/bash

# BookTracker Database Inspector Script

echo "📚 BookTracker Database Inspector"
echo "================================="
echo ""

# Check API status
echo "🔍 Checking API status..."
if ! curl -s http://localhost:3001/health > /dev/null; then
    echo "❌ API is not responding. Make sure containers are running with: docker-compose up -d"
    exit 1
fi

echo "✅ API is responding"
echo ""

# Get database stats
echo "📊 Database Statistics:"
curl -s http://localhost:3001/health | jq -r '
  "   Status: " + .status,
  "   Connected: " + (.database.connected | tostring),
  "   Total Books: " + (.database.totalBooks | tostring),
  "   Database Size: " + ((.database.size / 1024) | floor | tostring) + " KB",
  "   Last Check: " + .timestamp
'
echo ""

# Get book count from API
BOOK_COUNT=$(curl -s http://localhost:3001/api/books | jq length 2>/dev/null || echo "0")
echo "📖 Books in Database: $BOOK_COUNT"

if [ "$BOOK_COUNT" -gt 0 ]; then
    echo ""
    echo "📋 Book List (first 10):"
    curl -s http://localhost:3001/api/books | jq -r '.[0:10][] | "   • " + .title + " by " + .author'
    
    if [ "$BOOK_COUNT" -gt 10 ]; then
        echo "   ... and $((BOOK_COUNT - 10)) more books"
    fi
    
    echo ""
    echo "📊 Books by Status:"
    curl -s http://localhost:3001/api/books | jq -r '
      group_by(.status) | 
      .[] | 
      "   " + (.[0].status | gsub("-"; " ") | ascii_upcase) + ": " + (length | tostring)
    '
fi

echo ""

# Check JSON file
if [ -f "imported-books.json" ]; then
    JSON_COUNT=$(jq length imported-books.json 2>/dev/null || echo "0")
    echo "📁 Books in imported-books.json: $JSON_COUNT"
    
    if [ "$JSON_COUNT" -gt 0 ] && [ "$BOOK_COUNT" -eq 0 ]; then
        echo ""
        echo "💡 Tip: You have books in your JSON file but none in the database."
        echo "   You can import them using: ./import-books-to-db.sh"
    fi
fi

echo ""
echo "🔗 Quick Commands:"
echo "   View all books:     curl -s http://localhost:3001/api/books | jq ."
echo "   Check health:       curl -s http://localhost:3001/health | jq ."
echo "   View in browser:    http://localhost:8081"
