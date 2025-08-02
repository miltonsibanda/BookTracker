#!/bin/bash

# Diagnose frontend update persistence issues

echo "🔍 BookTracker Update Persistence Diagnostic"
echo "============================================"
echo ""

# Test API directly first
echo "📡 Testing API Update (Direct)..."
BOOK_ID=$(curl -s http://localhost:3001/api/books | jq -r '.[0].id')
BOOK_TITLE=$(curl -s http://localhost:3001/api/books | jq -r '.[] | select(.id == "'"$BOOK_ID"'") | .title')
ORIGINAL_RATING=$(curl -s http://localhost:3001/api/books | jq -r '.[] | select(.id == "'"$BOOK_ID"'") | .rating')

echo "   📖 Testing with: $BOOK_TITLE"
echo "   🌟 Original rating: $ORIGINAL_RATING"

# Update via API
NEW_RATING=$(( (ORIGINAL_RATING == 5) ? 3 : 5 ))
echo "   🔄 Updating to rating: $NEW_RATING"

API_RESULT=$(curl -s -X PUT "http://localhost:3001/api/books/$BOOK_ID" \
    -H "Content-Type: application/json" \
    -d "{\"rating\": $NEW_RATING}")

if echo "$API_RESULT" | jq -e '.id' > /dev/null; then
    echo "   ✅ API update successful"
    
    # Wait a moment and verify
    sleep 1
    VERIFIED_RATING=$(curl -s http://localhost:3001/api/books | jq -r '.[] | select(.id == "'"$BOOK_ID"'") | .rating')
    echo "   ✅ Verified rating: $VERIFIED_RATING"
else
    echo "   ❌ API update failed"
    echo "   Error: $(echo "$API_RESULT" | jq -r '.error // "Unknown"')"
fi

echo ""
echo "🔧 Possible Issues & Solutions:"
echo ""
echo "1. 📱 Frontend Cache Conflict:"
echo "   • localStorage might be overriding server data"
echo "   • Solution: Clear browser data or disable localStorage sync"
echo ""

echo "2. 🔄 Sync Timing Issue:"
echo "   • Frontend updates localStorage but server sync fails"
echo "   • Check browser console for sync errors"
echo ""

echo "3. 🌐 API Connection Issue:"
echo "   • Frontend thinks it's offline"
echo "   • Check api.isOnline status"
echo ""

echo "🛠️ Debugging Steps:"
echo "1. Open browser DevTools (F12)"
echo "2. Go to Application tab → Local Storage"
echo "3. Clear 'bookTracker_books' entry"
echo "4. Refresh page and try updating again"
echo "5. Check Console tab for errors"
echo "6. Check Network tab for failed API calls"
echo ""

echo "🔗 Quick Fixes:"
echo "• Hard refresh: Ctrl+Shift+R"
echo "• Clear localStorage: ./quick-cache-clear.sh"
echo "• Check API: curl http://localhost:3001/api/books"

echo ""
echo "📊 Current API Status:"
curl -s http://localhost:3001/health | jq '{status: .status, totalBooks: .database.totalBooks}'
