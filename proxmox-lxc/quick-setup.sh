#!/bin/bash

# BookTracker Proxmox LXC Quick Setup
# This script provides a streamlined setup process

set -e

echo "🚀 BookTracker Proxmox LXC Quick Setup"
echo "======================================"
echo ""

# Check if running on Proxmox
if ! command -v pct &> /dev/null; then
    echo "❌ Error: This script must be run on a Proxmox VE host"
    echo "   Please copy this directory to your Proxmox host and run again."
    exit 1
fi

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "❌ Error: This script must be run as root"
    exit 1
fi

echo "🔍 Checking prerequisites..."

# Check for Ubuntu template
if ! pveam list local | grep -q "ubuntu-22.04"; then
    echo "📥 Downloading Ubuntu 22.04 template..."
    pveam update
    pveam download local ubuntu-22.04-standard_22.04-1_amd64.tar.xz
fi

# Ask for basic configuration
echo ""
echo "📋 Configuration:"
read -p "Container ID (default: 200): " CONTAINER_ID
CONTAINER_ID=${CONTAINER_ID:-200}

read -p "Container name (default: booktracker): " CONTAINER_NAME
CONTAINER_NAME=${CONTAINER_NAME:-booktracker}

read -p "Memory in MB (default: 512): " MEMORY
MEMORY=${MEMORY:-512}

read -p "Disk size in GB (default: 4): " DISK
DISK=${DISK:-4}

echo ""
echo "🌐 Network configuration:"
echo "1) DHCP (automatic IP)"
echo "2) Static IP"
read -p "Choose network option (1 or 2): " NET_CHOICE

if [ "$NET_CHOICE" = "2" ]; then
    read -p "IP address (e.g., 192.168.1.100/24): " IP_ADDRESS
    read -p "Gateway (e.g., 192.168.1.1): " GATEWAY
    NETWORK_ARGS="--ip $IP_ADDRESS --gateway $GATEWAY"
else
    NETWORK_ARGS=""
fi

echo ""
echo "📝 Summary:"
echo "  Container ID: $CONTAINER_ID"
echo "  Name: $CONTAINER_NAME"
echo "  Memory: ${MEMORY}MB"
echo "  Disk: ${DISK}GB"
if [ "$NET_CHOICE" = "2" ]; then
    echo "  Network: Static IP $IP_ADDRESS via $GATEWAY"
else
    echo "  Network: DHCP"
fi

echo ""
read -p "Proceed with setup? (y/N): " CONFIRM
if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
    echo "Setup cancelled."
    exit 0
fi

echo ""
echo "🏗️  Creating container..."

# Run the main setup script
./setup-booktracker-lxc.sh \
    -i "$CONTAINER_ID" \
    -n "$CONTAINER_NAME" \
    -m "$MEMORY" \
    -d "$DISK" \
    $NETWORK_ARGS

echo ""
echo "✅ Container setup completed!"
echo ""
echo "📂 Next steps:"
echo "1. Copy your BookTracker application files to this directory"
echo "2. Run: ./deploy-to-lxc.sh $CONTAINER_ID"
echo "3. Access your application via the container's IP address"
echo ""

# Get container IP
CONTAINER_IP=$(pct exec $CONTAINER_ID -- hostname -I | awk '{print $1}' 2>/dev/null || echo "Check container status")
echo "🌍 Container IP: $CONTAINER_IP"
echo "🔗 Application URL: http://$CONTAINER_IP"
echo ""
echo "🛠️  Management commands:"
echo "  Start:    pct start $CONTAINER_ID"
echo "  Stop:     pct stop $CONTAINER_ID"
echo "  Console:  pct console $CONTAINER_ID"
echo "  Status:   pct status $CONTAINER_ID"

