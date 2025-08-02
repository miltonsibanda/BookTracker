#!/bin/bash

# Browser Cache Management Tool for BookTracker

echo "🗂️ BookTracker Cache Management Tool"
echo "===================================="
echo ""

show_menu() {
    echo "Select an option:"
    echo "1. 🔄 Force refresh containers (rebuilds with no cache)"
    echo "2. 🆕 Update cache-busting version numbers"
    echo "3. 🧹 Clear browser cache instructions"
    echo "4. 🔍 Check current cache headers"
    echo "5. 📱 Open app with cache-busting URL"
    echo "6. ❌ Exit"
    echo ""
}

force_refresh_containers() {
    echo "🔄 Forcing container refresh..."
    echo "   Stopping containers..."
    docker-compose down
    
    echo "   Rebuilding with no cache..."
    docker-compose build --no-cache
    
    echo "   Starting fresh containers..."
    docker-compose up -d
    
    echo "   Waiting for services to be ready..."
    sleep 10
    
    echo "✅ Containers refreshed successfully!"
    echo "   Frontend: http://localhost:8081"
    echo "   API: http://localhost:3001"
}

update_cache_busting() {
    echo "🆕 Updating cache-busting version numbers..."
    
    # Generate new version based on current timestamp
    NEW_VERSION=$(date +"%Y%m%d%H%M")
    
    # Update HTML file
    if [ -f "index.html" ]; then
        sed -i.bak "s/\?v=[0-9]*/\?v=$NEW_VERSION/g" index.html
        echo "   ✅ Updated index.html with version: $NEW_VERSION"
    fi
    
    # Update any other files that reference versioned assets
    if [ -f "script.js" ]; then
        # Update any internal cache references in JS if they exist
        echo "   ✅ JavaScript file found"
    fi
    
    echo "   📝 New cache-busting version: $NEW_VERSION"
    echo "   🔄 You may need to restart containers to apply changes"
}

show_cache_instructions() {
    echo "🧹 Browser Cache Clearing Instructions"
    echo "======================================"
    echo ""
    echo "📌 Manual Browser Cache Clearing:"
    echo ""
    echo "🔷 Chrome/Edge:"
    echo "   • Press Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)"
    echo "   • Or F12 → Network tab → right-click → 'Empty Cache and Hard Reload'"
    echo "   • Or Settings → Privacy → Clear browsing data"
    echo ""
    echo "🦊 Firefox:"
    echo "   • Press Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)"
    echo "   • Or F12 → Network tab → settings icon → 'Disable cache'"
    echo ""
    echo "🧭 Safari:"
    echo "   • Press Cmd+Option+R"
    echo "   • Or Develop menu → Empty Caches"
    echo ""
    echo "🔧 Developer Tools Method (All browsers):"
    echo "   1. Open Developer Tools (F12)"
    echo "   2. Right-click the refresh button"
    echo "   3. Select 'Empty Cache and Hard Reload'"
    echo ""
    echo "🌐 Alternative: Open in Private/Incognito mode"
}

check_cache_headers() {
    echo "🔍 Checking current cache headers..."
    echo ""
    
    if ! curl -s http://localhost:8081 > /dev/null; then
        echo "❌ Frontend not accessible. Make sure containers are running."
        return 1
    fi
    
    echo "📄 HTML Cache Headers:"
    curl -s -I http://localhost:8081/ | grep -i cache
    
    echo ""
    echo "📄 CSS Cache Headers:"
    curl -s -I http://localhost:8081/styles.css | grep -i cache
    
    echo ""
    echo "📄 JavaScript Cache Headers:"
    curl -s -I http://localhost:8081/script.js | grep -i cache
    
    echo ""
    echo "🔗 API Headers:"
    curl -s -I http://localhost:3001/health | grep -i cache
}

open_with_cache_busting() {
    echo "📱 Opening BookTracker with cache-busting parameters..."
    
    # Generate cache-busting URL
    TIMESTAMP=$(date +%s)
    CACHE_BUST_URL="http://localhost:8081/?cb=$TIMESTAMP&nocache=true"
    
    echo "🌐 Cache-busting URL: $CACHE_BUST_URL"
    echo ""
    echo "💡 Tips:"
    echo "   • This URL includes cache-busting parameters"
    echo "   • Copy this URL and open in your browser"
    echo "   • Or bookmark it for development use"
    
    # Try to open in default browser (Linux)
    if command -v xdg-open > /dev/null; then
        echo "   🚀 Attempting to open in browser..."
        xdg-open "$CACHE_BUST_URL" 2>/dev/null &
    fi
}

# Main menu loop
while true; do
    echo ""
    show_menu
    read -p "Enter your choice (1-6): " choice
    echo ""
    
    case $choice in
        1)
            force_refresh_containers
            ;;
        2)
            update_cache_busting
            ;;
        3)
            show_cache_instructions
            ;;
        4)
            check_cache_headers
            ;;
        5)
            open_with_cache_busting
            ;;
        6)
            echo "👋 Goodbye!"
            exit 0
            ;;
        *)
            echo "❌ Invalid option. Please choose 1-6."
            ;;
    esac
    
    echo ""
    read -p "Press Enter to continue..."
done
