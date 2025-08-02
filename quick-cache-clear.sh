#!/bin/bash

# Quick cache clearing script

echo "🚀 Quick Cache Clear for BookTracker"
echo "==================================="
echo ""

# Update version numbers
NEW_VERSION=$(date +"%Y%m%d%H%M%S")
echo "📅 New cache version: $NEW_VERSION"

# Update HTML cache-busting
if [ -f "index.html" ]; then
    sed -i.bak "s/\?v=[0-9]*/?v=$NEW_VERSION/g" index.html
    echo "✅ Updated index.html cache version"
fi

# Update JavaScript cache version
if [ -f "script.js" ]; then
    sed -i.bak "s/window.CACHE_VERSION = '[0-9]*'/window.CACHE_VERSION = '$NEW_VERSION'/g" script.js
    echo "✅ Updated script.js cache version"
fi

# Restart containers to apply changes
echo ""
echo "🔄 Restarting containers to apply changes..."
docker-compose restart booktracker

echo ""
echo "⏳ Waiting for container to be ready..."
sleep 5

# Check if it's working
if curl -s http://localhost:8081 > /dev/null; then
    echo "✅ BookTracker is ready with new cache version!"
    echo ""
    echo "🌐 Access your app:"
    echo "   • Regular URL: http://localhost:8081"
    echo "   • Cache-busted: http://localhost:8081/?v=$NEW_VERSION"
    echo ""
    echo "💡 Tips to ensure you see changes:"
    echo "   • Press Ctrl+Shift+R (or Cmd+Shift+R on Mac) for hard reload"
    echo "   • Or open in incognito/private mode"
    echo "   • Or use developer tools with cache disabled"
else
    echo "❌ Container not ready yet. Try again in a moment."
fi

echo ""
echo "📋 Cache troubleshooting:"
echo "   • Run: ./cache-manager.sh for more options"
echo "   • Check headers: curl -I http://localhost:8081/"
echo "   • Clear browser data manually if needed"
