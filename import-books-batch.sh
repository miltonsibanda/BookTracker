#!/bin/bash

# Import books from JSON file to database (batch method)

JSON_FILE="imported-books.json"
API_URL="http://localhost:3001"
BATCH_SIZE=50  # Import 50 books at a time

echo "📚 BookTracker JSON Import Tool (Batch Mode)"
echo "============================================="
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
echo "📦 Batch size: $BATCH_SIZE books per request"
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

echo "🚀 Starting batch import..."
echo ""

IMPORTED_COUNT=0
FAILED_COUNT=0
BATCH_COUNT=0

# Calculate number of batches
TOTAL_BATCHES=$(( (JSON_COUNT + BATCH_SIZE - 1) / BATCH_SIZE ))

# Process books in batches
for ((start=0; start<JSON_COUNT; start+=BATCH_SIZE)); do
    ((BATCH_COUNT++))
    end=$((start + BATCH_SIZE))
    if [ $end -gt $JSON_COUNT ]; then
        end=$JSON_COUNT
    fi
    
    echo "📦 Processing batch $BATCH_COUNT/$TOTAL_BATCHES (books $((start+1))-$end)..."
    
    # Create batch of books
    BATCH_JSON=$(jq ".[$start:$end]" "$JSON_FILE")
    
    # Import batch
    RESULT=$(curl -s -X POST "${API_URL}/api/books/sync" \
        -H "Content-Type: application/json" \
        -d "{\"books\": $BATCH_JSON}" 2>/dev/null)
    
    # Check if batch was successful
    if echo "$RESULT" | jq -e '.success' > /dev/null 2>&1; then
        BATCH_IMPORTED=$(echo "$RESULT" | jq -r '.count // 0')
        IMPORTED_COUNT=$((IMPORTED_COUNT + BATCH_IMPORTED))
        echo "   ✅ Imported $BATCH_IMPORTED books in this batch"
    else
        BATCH_SIZE_ACTUAL=$((end - start))
        FAILED_COUNT=$((FAILED_COUNT + BATCH_SIZE_ACTUAL))
        echo "   ❌ Batch failed: $(echo "$RESULT" | jq -r '.error // "Unknown error"')"
    fi
    
    # Small delay to be nice to the server
    sleep 0.1
done

echo ""
echo "🎉 Import process completed!"
echo "📊 Final Results:"
echo "   Total books processed: $JSON_COUNT"
echo "   Successfully imported: $IMPORTED_COUNT"
echo "   Failed imports: $FAILED_COUNT"

if [ $IMPORTED_COUNT -gt 0 ]; then
    echo "   Success rate: $(( (IMPORTED_COUNT * 100) / JSON_COUNT ))%"
    
    # Get final database count
    FINAL_DB_COUNT=$(curl -s "${API_URL}/api/books" | jq length 2>/dev/null || echo "unknown")
    echo "   Total books in database: $FINAL_DB_COUNT"
    
    echo ""
    echo "✅ You can now:"
    echo "   • View books at: http://localhost:8081"
    echo "   • Check status: ./check-books.sh"
else
    echo ""
    echo "❌ No books were imported. Check the error messages above."
    exit 1
fi
