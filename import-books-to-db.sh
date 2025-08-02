#!/bin/bash

# Import books from JSON file to database

JSON_FILE="imported-books.json"
API_URL="http://localhost:3001"

echo "📚 BookTracker JSON Import Tool"
echo "==============================="
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

if [ "$DB_COUNT" -gt 0 ]; then
    echo "⚠️  Database already contains $DB_COUNT books."
    read -p "Do you want to continue? This will add more books. (y/N): " confirm
    if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
        echo "❌ Import cancelled"
        exit 0
    fi
    echo ""
fi

echo "🚀 Starting import..."
echo ""

# Import books one by one to avoid argument length limits
echo "📤 Importing books to database..."
IMPORTED_COUNT=0
FAILED_COUNT=0
TOTAL_BOOKS=$JSON_COUNT

# Create temporary file for processing
TEMP_FILE=$(mktemp)

# Process books one by one
jq -c '.[]' "$JSON_FILE" | while IFS= read -r book; do
    ((CURRENT++))
    
    # Show progress every 10 books
    if [ $((CURRENT % 10)) -eq 0 ] || [ $CURRENT -eq 1 ]; then
        echo "� Processing book $CURRENT of $TOTAL_BOOKS..."
    fi
    
    # Import single book
    RESULT=$(curl -s -X POST "${API_URL}/api/books" \
        -H "Content-Type: application/json" \
        -d "$book" 2>/dev/null)
    
    if echo "$RESULT" | jq -e '.id' > /dev/null 2>&1; then
        ((IMPORTED_COUNT++))
        echo "$RESULT" >> "$TEMP_FILE"
    else
        ((FAILED_COUNT++))
        # Extract book title for error reporting
        TITLE=$(echo "$book" | jq -r '.title // "Unknown"')
        echo "⚠️  Failed to import: $TITLE" >&2
    fi
done

# Read final counts (since the while loop runs in a subshell)
IMPORTED_COUNT=$(wc -l < "$TEMP_FILE" 2>/dev/null || echo "0")
FAILED_COUNT=$((TOTAL_BOOKS - IMPORTED_COUNT))

echo ""
if [ "$IMPORTED_COUNT" -gt 0 ]; then
    echo "✅ Import completed!"
    echo "📊 Results:"
    echo "   Books imported: $IMPORTED_COUNT"
    echo "   Failed imports: $FAILED_COUNT"
    echo "   Success rate: $(( (IMPORTED_COUNT * 100) / TOTAL_BOOKS ))%"
    echo ""
    
    # Show some sample books
    echo "📋 Sample imported books:"
    head -5 "$TEMP_FILE" | jq -r '"   • " + .title + " by " + .author'
    
    if [ "$IMPORTED_COUNT" -gt 5 ]; then
        echo "   ... and $((IMPORTED_COUNT - 5)) more books"
    fi
else
    echo "❌ Import failed - no books were imported"
    rm -f "$TEMP_FILE"
    exit 1
fi

# Clean up
rm -f "$TEMP_FILE"

echo ""
echo "🎉 Import complete! You can now:"
echo "   • View books at: http://localhost:8081"
echo "   • Check status: ./check-books.sh"
