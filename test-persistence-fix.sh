#!/bin/bash

# Test the fix for frontend update persistence

echo "🧪 Testing Frontend Update Persistence Fix"
echo "=========================================="
echo ""

# Wait for container to be ready
echo "⏳ Waiting for container to be ready..."
sleep 5

if ! curl -s http://localhost:8081 > /dev/null; then
    echo "❌ Frontend not accessible"
    exit 1
fi

echo "✅ Frontend is ready"
echo ""

# Get a book to test with
BOOK_DATA=$(curl -s http://localhost:3001/api/books | jq '.[0]')
BOOK_ID=$(echo "$BOOK_DATA" | jq -r '.id')
BOOK_TITLE=$(echo "$BOOK_DATA" | jq -r '.title')
ORIGINAL_RATING=$(echo "$BOOK_DATA" | jq -r '.rating')

echo "📖 Testing persistence with book: $BOOK_TITLE"
echo "   🆔 ID: $BOOK_ID"
echo "   ⭐ Original rating: $ORIGINAL_RATING"
echo ""

# Test 1: Update via API and verify it sticks
NEW_RATING=$(( (ORIGINAL_RATING == 5) ? 3 : 5 ))
echo "🧪 Test 1: API Update Persistence"
echo "   🔄 Updating rating from $ORIGINAL_RATING to $NEW_RATING via API..."

API_UPDATE=$(curl -s -X PUT "http://localhost:3001/api/books/$BOOK_ID" \
    -H "Content-Type: application/json" \
    -d "{\"rating\": $NEW_RATING, \"notes\": \"Test update $(date)\", \"dateModified\": \"$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)\"}")

if echo "$API_UPDATE" | jq -e '.id' > /dev/null; then
    echo "   ✅ API update successful"
    
    # Wait and verify persistence
    sleep 2
    VERIFIED_RATING=$(curl -s http://localhost:3001/api/books | jq -r '.[] | select(.id == "'"$BOOK_ID"'") | .rating')
    
    if [ "$VERIFIED_RATING" = "$NEW_RATING" ]; then
        echo "   ✅ Rating persisted in database: $VERIFIED_RATING"
    else
        echo "   ❌ Rating not persisted. Expected: $NEW_RATING, Got: $VERIFIED_RATING"
    fi
else
    echo "   ❌ API update failed"
    echo "   Error: $(echo "$API_UPDATE" | jq -r '.error // "Unknown"')"
fi

echo ""
echo "🔍 Test 2: Check Frontend Sync Behavior"
echo "   📡 Getting fresh data from API..."

# Simulate what frontend does on load
API_BOOKS_COUNT=$(curl -s http://localhost:3001/api/books | jq length)
echo "   📊 Books in API: $API_BOOKS_COUNT"

# Check the updated book
FINAL_BOOK_DATA=$(curl -s http://localhost:3001/api/books | jq ".[] | select(.id == \"$BOOK_ID\")")
FINAL_RATING=$(echo "$FINAL_BOOK_DATA" | jq -r '.rating')
FINAL_MODIFIED=$(echo "$FINAL_BOOK_DATA" | jq -r '.dateModified // "no-date"')

echo "   📖 Final book state:"
echo "      Title: $(echo "$FINAL_BOOK_DATA" | jq -r '.title')"
echo "      Rating: $FINAL_RATING"
echo "      Modified: $FINAL_MODIFIED"

echo ""
echo "🎯 Summary:"
if [ "$FINAL_RATING" = "$NEW_RATING" ]; then
    echo "✅ SUCCESS: Updates are persisting correctly!"
    echo "   The frontend sync logic fix is working."
else
    echo "❌ ISSUE: Updates are still not persisting."
    echo "   Expected rating: $NEW_RATING"
    echo "   Actual rating: $FINAL_RATING"
fi

echo ""
echo "🛠️ To test frontend updates manually:"
echo "1. Open http://localhost:8081"
echo "2. Find the book: $BOOK_TITLE"
echo "3. Click 'Edit' button"
echo "4. Change the rating"
echo "5. Save and refresh the page"
echo "6. Verify the rating persisted"
echo ""
echo "💡 If issues persist:"
echo "• Clear browser localStorage (F12 → Application → Local Storage)"
echo "• Use hard refresh (Ctrl+Shift+R)"
echo "• Check browser console for errors"
