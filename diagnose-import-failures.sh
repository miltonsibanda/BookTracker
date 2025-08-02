#!/bin/bash

# Diagnose import failures for BookTracker

JSON_FILE="imported-books.json"
API_URL="http://localhost:3001"

echo "🔍 BookTracker Import Failure Diagnostic Tool"
echo "=============================================="
echo ""

# Check if JSON file exists
if [ ! -f "$JSON_FILE" ]; then
    echo "❌ JSON file '$JSON_FILE' not found"
    exit 1
fi

# Get current stats
JSON_COUNT=$(jq length "$JSON_FILE" 2>/dev/null || echo "0")
DB_COUNT=$(curl -s "${API_URL}/api/books" | jq length 2>/dev/null || echo "0")

echo "📊 Current Status:"
echo "   Books in JSON: $JSON_COUNT"
echo "   Books in DB: $DB_COUNT"
echo "   Missing: $((JSON_COUNT - DB_COUNT))"
echo ""

# Analyze the JSON structure
echo "🔬 Analyzing JSON structure..."
echo "📋 Sample book structure:"
jq '.[0]' "$JSON_FILE"
echo ""

# Check for required fields
echo "🔍 Checking required fields (title, author)..."
MISSING_TITLE=$(jq '[.[] | select(.title == null or .title == "")] | length' "$JSON_FILE")
MISSING_AUTHOR=$(jq '[.[] | select(.author == null or .author == "")] | length' "$JSON_FILE")

echo "   Books missing title: $MISSING_TITLE"
echo "   Books missing author: $MISSING_AUTHOR"

if [ $MISSING_TITLE -gt 0 ]; then
    echo "   📝 Books with missing titles:"
    jq -r '.[] | select(.title == null or .title == "") | "      • ID: " + (.id // "no-id") + " by " + (.author // "unknown")' "$JSON_FILE" | head -5
fi

if [ $MISSING_AUTHOR -gt 0 ]; then
    echo "   📝 Books with missing authors:"
    jq -r '.[] | select(.author == null or .author == "") | "      • " + (.title // "no-title") + " (ID: " + (.id // "no-id") + ")"' "$JSON_FILE" | head -5
fi

echo ""

# Test importing a few books individually to see specific errors
echo "🧪 Testing individual book imports to identify specific errors..."
echo ""

# Get books that are not in database
EXISTING_IDS=$(curl -s "${API_URL}/api/books" | jq -r '.[].id')
TEMP_EXISTING=$(mktemp)
echo "$EXISTING_IDS" > "$TEMP_EXISTING"

# Find first 5 books that haven't been imported
FAILED_BOOKS=$(jq -c '.[] | select(.id as $id | ["'"$EXISTING_IDS"'"] | index($id) == null)' "$JSON_FILE" | head -5)

if [ -z "$FAILED_BOOKS" ]; then
    echo "🤔 All books appear to be imported. Let's check for duplicates..."
    
    # Check for duplicate IDs in JSON
    DUPLICATE_COUNT=$(jq '[.[].id] | group_by(.) | map(select(length > 1)) | length' "$JSON_FILE")
    echo "   Duplicate IDs in JSON: $DUPLICATE_COUNT"
    
    if [ $DUPLICATE_COUNT -gt 0 ]; then
        echo "   📝 Duplicate IDs found:"
        jq -r '[.[].id] | group_by(.) | map(select(length > 1)) | .[] | .[0]' "$JSON_FILE" | head -5 | while read id; do
            echo "      • ID: $id (appears $(jq '[.[] | select(.id == "'"$id"'")] | length' "$JSON_FILE") times)"
        done
    fi
else
    echo "📝 Testing failed books:"
    echo "$FAILED_BOOKS" | while IFS= read -r book; do
        TITLE=$(echo "$book" | jq -r '.title // "NO TITLE"')
        AUTHOR=$(echo "$book" | jq -r '.author // "NO AUTHOR"')
        ID=$(echo "$book" | jq -r '.id // "NO ID"')
        
        echo "   🧪 Testing: $TITLE by $AUTHOR (ID: $ID)"
        
        # Try to import this specific book
        RESULT=$(curl -s -X POST "${API_URL}/api/books" \
            -H "Content-Type: application/json" \
            -d "$book" 2>&1)
        
        if echo "$RESULT" | jq -e '.id' > /dev/null 2>&1; then
            echo "      ✅ Import successful"
        else
            echo "      ❌ Import failed:"
            ERROR_MSG=$(echo "$RESULT" | jq -r '.error // "Unknown error"' 2>/dev/null || echo "$RESULT")
            echo "         Error: $ERROR_MSG"
        fi
        echo ""
    done
fi

# Clean up
rm -f "$TEMP_EXISTING"

echo ""
echo "💡 Recommendations:"
echo "   1. Check the error messages above"
echo "   2. Verify all books have required fields (title, author)"
echo "   3. Check for duplicate IDs in your JSON file"
echo "   4. Try importing the failed books one by one with: ./import-books-single.sh"
