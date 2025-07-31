#!/bin/bash

# BookTracker Cross-Device Setup Verification Script

echo "🚀 BookTracker Cross-Device Persistence Setup"
echo "============================================="
echo ""

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo "📋 Checking Prerequisites..."

if command_exists docker; then
    echo "✅ Docker is installed"
    docker --version
else
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if command_exists docker-compose; then
    echo "✅ Docker Compose is installed"
    docker-compose --version
else
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

if command_exists make; then
    echo "✅ Make is available"
else
    echo "❌ Make is not available. Please install make command."
    exit 1
fi

echo ""

# Check if BookTracker is already running
echo "🔍 Checking Current Status..."

if docker ps | grep -q booktracker; then
    echo "⚠️  BookTracker containers are already running"
    echo "   Use 'make stop' to stop them first, or 'make restart' to restart"
else
    echo "✅ No BookTracker containers currently running"
fi

echo ""

# Show available commands
echo "🛠️  Available Commands:"
echo "   make run          - Start BookTracker with database persistence"
echo "   make stop         - Stop BookTracker (preserves data)"
echo "   make status       - Check container and database status"
echo "   make network-info - Show network access URLs"
echo "   make test         - Test application health"
echo "   make logs         - View application logs"
echo "   make backup       - Create database backup"
echo ""

# Show network information
echo "🌐 Network Setup Information:"
echo ""
echo "📱 Local Access:"
echo "   Frontend: http://localhost:8081"
echo "   API:      http://localhost:3001"
echo ""

echo "🌍 Network Access (for other devices):"
# Get network IP addresses
if command_exists hostname; then
    for ip in $(hostname -I 2>/dev/null | tr ' ' '\n' | grep -E '^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$' | head -3); do
        echo "   Frontend: http://$ip:8081"
        echo "   API:      http://$ip:3001"
    done
elif command_exists ifconfig; then
    for ip in $(ifconfig | grep 'inet ' | grep -v '127.0.0.1' | awk '{print $2}' | head -3); do
        echo "   Frontend: http://$ip:8081"
        echo "   API:      http://$ip:3001"
    done
else
    echo "   Run 'make network-info' after starting to see network URLs"
fi

echo ""

# Show quick start instructions
echo "🚀 Quick Start Instructions:"
echo ""
echo "1. Start BookTracker:"
echo "   make run"
echo ""
echo "2. Open in browser:"
echo "   http://localhost:8081"
echo ""
echo "3. Access from other devices:"
echo "   Use the network URLs shown above"
echo ""
echo "4. Verify everything works:"
echo "   make test"
echo ""

# Show database features
echo "💾 Database Features:"
echo "   ✅ SQLite database for reliable persistence"
echo "   ✅ Cross-device synchronization"
echo "   ✅ Automatic data migration from localStorage"
echo "   ✅ Built-in backup and restore"
echo "   ✅ Real-time updates across all devices"
echo ""

echo "📚 For detailed setup instructions, see:"
echo "   README-CrossDevice-Persistence.md"
echo ""

echo "🎉 Setup verification complete!"
echo "   Run 'make run' to start BookTracker with cross-device persistence!"
