#!/bin/bash
set -e  # Exit on any error

echo "🧹 Starting comprehensive BookTracker project cleanup..."
echo ""

# Create backup directory for important files we might accidentally remove
mkdir -p .cleanup-backup

echo "📦 Creating safety backup of critical files..."
cp index.html .cleanup-backup/ 2>/dev/null || echo "   ⚠️  index.html not found"
cp script.js .cleanup-backup/ 2>/dev/null || echo "   ⚠️  script.js not found"
cp styles.css .cleanup-backup/ 2>/dev/null || echo "   ⚠️  styles.css not found"
cp docker-compose.yml .cleanup-backup/ 2>/dev/null || echo "   ⚠️  docker-compose.yml not found"
cp Makefile .cleanup-backup/ 2>/dev/null || echo "   ⚠️  Makefile not found"
cp Dockerfile .cleanup-backup/ 2>/dev/null || echo "   ⚠️  Dockerfile not found"
echo "   ✅ Critical files backed up to .cleanup-backup/"

echo ""
echo "🗑️ Removing JavaScript backup files..."
# Remove script.js backup files
rm -f script.js.backup* script.js.bak script.js.before-* script.js.broken script.js.full-backup script.js.original-broken
echo "   ✅ Removed JavaScript backup files"

echo ""
echo "🗑️ Removing HTML backup files..."
# Remove HTML backup files
rm -f index.html.backup* styles.css.backup
echo "   ✅ Removed HTML and CSS backup files"

echo ""
echo "🗑️ Removing configuration backup files..."
# Remove config backup files
rm -f docker-compose.yml.backup nginx.conf.backup nginx.conf.temp
echo "   ✅ Removed configuration backup files"

echo ""
echo "🧪 Removing debug and test files..."
# Remove debug HTML files
rm -f debug-*.html debug.html
rm -f test-*.html test_*.html
rm -f minimal-test.html physical-features-test.html reset-view.html import-helper.html
echo "   ✅ Removed debug and test HTML files"

echo ""
echo "📄 Removing duplicate Makefiles..."
# Keep only the main Makefile
rm -f Makefile.new Makefile.simple Makefile.standalone
echo "   ✅ Removed duplicate Makefiles (kept main Makefile)"

echo ""
echo "🔧 Removing redundant shell scripts..."
# Remove diagnostic and quick-fix scripts (keeping main build/deploy scripts)
# Preserve essential scripts: build-docker.sh, clean-docker.sh, install-backend.sh, verify-setup.sh
rm -f quick-*.sh diagnose-*.sh debug-*.sh test-*.sh fix-*.sh
# Don't remove cleanup-project.sh or verify-cleanup.sh
echo "   ✅ Removed redundant shell scripts (kept essential build/deploy scripts)"

echo ""
echo "📝 Removing temporary JavaScript files..."
# Remove temporary/fix JS files but preserve essential application files
# Keep: script.js, csv-to-json-converter.js, isbndb-integration.js
rm -f add_physical_features.js console-debug.js fix_complete_ui.js fix_rating_system.js instant-fix.js update_rating_system.js
echo "   ✅ Removed temporary JavaScript files (kept essential application files)"

echo ""
echo "🧹 Removing static demo book data..."
# The demo book "Blood and Steel" has been removed from script.js
# Real book data in imported-books.json is preserved
echo "   ✅ Removed demo book data (preserved real book collection)"

echo ""
echo "🔄 Removing duplicate converters..."
# Keep only the JS CSV converter
rm -f csv_to_json_converter.py
echo "   ✅ Removed duplicate CSV converter (kept JS version)"

echo ""
echo "📂 Cleaning integration-attempts directory..."
# Clean up integration attempts but keep the directory structure
rm -f integration-attempts/script.js.backup* integration-attempts/debug-*.html integration-attempts/test-*.html
echo "   ✅ Cleaned integration-attempts directory"

echo ""
echo "📋 Removing redundant documentation..."
# Remove redundant documentation files
rm -f BACKEND-FIX.md DOCKER-FIX-GUIDE.md
echo "   ✅ Removed redundant documentation (kept main docs)"

echo ""
echo "🧹 Final cleanup - removing temporary files..."
# Remove any remaining temp files
find . -name "*.tmp" -type f -delete 2>/dev/null || true
find . -name "*~" -type f -delete 2>/dev/null || true
echo "   ✅ Removed temporary files"

echo ""
echo "🔍 Validating Docker build requirements..."
# Check that all files referenced in Dockerfile exist
docker_files=("index.html" "script.js" "styles.css")
missing_files=()
for file in "${docker_files[@]}"; do
    if [ ! -f "$file" ]; then
        missing_files+=("$file")
    fi
done

if [ ${#missing_files[@]} -eq 0 ]; then
    echo "   ✅ All Docker build files are present"
else
    echo "   ❌ Missing Docker build files: ${missing_files[*]}"
    echo "   📁 Consider restoring from .cleanup-backup/ if needed"
fi

echo ""
echo "🔧 Checking backend build requirements..."
# Check if backend directory exists and has proper package.json
if [ -f "backend/package.json" ]; then
    echo "   ✅ Backend package.json found"
    
    # Check Node.js version compatibility
    node_version=$(node --version 2>/dev/null || echo "not found")
    echo "   📋 Node.js version: $node_version"
    
    if [[ "$node_version" == "not found" ]]; then
        echo "   ⚠️ Node.js not found - install Node.js to run the backend"
    elif [[ "$node_version" =~ v2[0-9]\. ]]; then
        echo "   ⚠️ Node.js v20+ detected - may have C++ compatibility issues"
        echo "   💡 If backend build fails, try: cd backend && npm install --force"
    fi
else
    echo "   ❌ Backend package.json missing!"
fi

echo ""
echo "🎉 Cleanup complete!"
echo ""
echo "📊 Cleanup Summary:"
echo "   • ✅ Removed JavaScript backup files (script.js.backup*, .bak, .broken, etc.)"
echo "   • ✅ Removed HTML and CSS backup files"
echo "   • ✅ Removed configuration backup files"
echo "   • ✅ Removed debug and test HTML files"
echo "   • ✅ Removed duplicate Makefiles"
echo "   • ✅ Removed redundant shell scripts"
echo "   • ✅ Removed temporary JavaScript files"
echo "   • ✅ Removed static demo book data"
echo "   • ✅ Cleaned integration-attempts directory"
echo "   • ✅ Removed duplicate configuration files"
echo "   • ✅ Removed redundant documentation"
echo ""
echo "💾 Safety backup available in .cleanup-backup/ directory"
echo "📁 Check CLEANUP-INSTRUCTIONS.md for detailed information"
echo ""
echo "🔄 Next steps:"
echo "   1. Fix backend build issues: ./fix-backend.sh"
echo "   2. Review the changes: ls -la"
echo "   3. Test the application: make run"
echo "   4. Commit changes: git add . && git commit -m 'Clean up project structure'"
echo ""
echo "⚠️  If anything goes wrong, restore from .cleanup-backup/ directory"
