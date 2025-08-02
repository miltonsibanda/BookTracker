#!/bin/bash

# Import books one by one (slower but more reliable)

JSON_FILE="imported-books.json"
API_URL="http://localhost:3001"

echo "📚 BookTracker Single-Book Import Tool"
echo "======================================"
echo ""

# Check if JSON file exists
if [ ! -f "$JSON_FILE" ]; then
    echo "❌ JSON file '$JSON_FILE' not found"
    exit 1
fi

# Check API status
echo "🔍 Checking API status..."
if ! curl -s "${API_URL}/health" > /dev/null; then
    echo "❌ API is not responding. Make sure containers are running."
    exit 1
fi

# Get counts
JSON_COUNT=$(jq length "$JSON_FILE" 2>/dev/null || echo "0")
DB_COUNT=$(curl -s "${API_URL}/api/books" | jq length 2>/dev/null || echo "0")

echo "✅ API is responding"
echo "📁 Books in JSON file: $JSON_COUNT"
echo "📖 Books in database: $DB_COUNT"
echo ""

if [ "$JSON_COUNT" -eq 0 ]; then
    echo "❌ No books found in JSON file"
    exit 1
fi

echo "🚀 Starting one-by-one import..."
echo "⏳ This will take a while for $JSON_COUNT books..."
echo ""

IMPORTED_COUNT=0
FAILED_COUNT=0

# Process each book individually
jq -c '.[]' "$JSON_FILE" | {
    CURRENT=0
    while IFS= read -r book; do
        ((CURRENT++))
        
        # Show progress
        if [ $((CURRENT % 20)) -eq 0 ] || [ $CURRENT -eq 1 ]; then
            echo "📖 Processing book $CURRENT of $JSON_COUNT..."
        fi
        
        # Get book title for logging
        TITLE=$(echo "$book" | jq -r '.title // "Unknown"')
        AUTHOR=$(echo "$book" | jq -r '.author // "Unknown"')
        
        # Import single book
        RESULT=$(curl -s -X POST "${API_URL}/api/books" \
            -H "Content-Type: application/json" \
            -d "$book" 2>/dev/null)
        
        if echo "$RESULT" | jq -e '.id' > /dev/null 2>&1; then
            ((IMPORTED_COUNT++))
            if [ $((CURRENT % 50)) -eq 0 ]; then
                echo "   ✅ Imported: $TITLE by $AUTHOR"
            fi
        else
            ((FAILED_COUNT++))
            echo "   ❌ Failed: $TITLE by $AUTHOR"
        fi
        
        # Small delay to be nice to the server
        sleep 0.05
    done
    
    echo ""
    echo "🎉 Import completed!"
    echo "📊 Results:"
    echo "   Total processed: $JSON_COUNT"
    echo "   Successfully imported: $IMPORTED_COUNT"
    echo "   Failed: $FAILED_COUNT"
    
    if [ $IMPORTED_COUNT -gt 0 ]; then
        echo "   Success rate: $(( (IMPORTED_COUNT * 100) / JSON_COUNT ))%"
        
        # Get final count
        FINAL_COUNT=$(curl -s "${API_URL}/api/books" | jq length 2>/dev/null || echo "unknown")
        echo "   Total books in database: $FINAL_COUNT"
        
        echo ""
        echo "✅ Import successful! You can now view your books at: http://localhost:8081"
    else
        echo ""
        echo "❌ No books were imported successfully."
    fi
}
