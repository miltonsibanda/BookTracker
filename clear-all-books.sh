#!/bin/bash

# Script to clear all books from BookTracker database via API

API_URL="http://localhost:3001"

echo "🔍 Checking API status..."
if ! curl -s "${API_URL}/health" > /dev/null; then
    echo "❌ API is not responding. Make sure containers are running."
    exit 1
fi

echo "📚 Getting list of all books..."
BOOK_IDS=$(curl -s "${API_URL}/api/books" | jq -r '.[].id' 2>/dev/null)

if [ -z "$BOOK_IDS" ]; then
    echo "📭 No books found in database."
    exit 0
fi

BOOK_COUNT=$(echo "$BOOK_IDS" | wc -l)
echo "📖 Found $BOOK_COUNT books to delete"

echo "🗑️ Deleting all books..."
for id in $BOOK_IDS; do
    echo "  Deleting book: $id"
    curl -s -X DELETE "${API_URL}/api/books/${id}" > /dev/null
    if [ $? -eq 0 ]; then
        echo "    ✅ Deleted"
    else
        echo "    ❌ Failed to delete"
    fi
done

echo "✅ All books cleared from database"

# Verify
REMAINING=$(curl -s "${API_URL}/api/books" | jq length 2>/dev/null)
echo "📊 Books remaining: $REMAINING"
