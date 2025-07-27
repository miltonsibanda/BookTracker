#!/bin/bash

# BookTracker Proxmox LXC Container Setup Script
# This script sets up a new LXC container for the BookTracker application

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
CONTAINER_ID=200  # Default container ID
CONTAINER_NAME="booktracker"
TEMPLATE="ubuntu-22.04-standard_22.04-1_amd64.tar.xz"
STORAGE="local-lvm"  # Change to your storage
PASSWORD="booktracker123"  # Change this password
MEMORY=512
DISK_SIZE=4
CORES=1
BRIDGE="vmbr0"  # Change to your bridge
IP_ADDRESS=""  # Leave empty for DHCP, or set like "192.168.1.100/24"
GATEWAY=""     # Set if using static IP

# Function to print colored output
print_status() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Help function
show_help() {
    echo "BookTracker Proxmox LXC Container Setup"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -i, --id <id>           Container ID (default: 200)"
    echo "  -n, --name <name>       Container name (default: booktracker)"
    echo "  -s, --storage <storage> Storage name (default: local-lvm)"
    echo "  -p, --password <pass>   Root password (default: booktracker123)"
    echo "  -m, --memory <mb>       Memory in MB (default: 512)"
    echo "  -d, --disk <gb>         Disk size in GB (default: 4)"
    echo "  -c, --cores <cores>     CPU cores (default: 1)"
    echo "  -b, --bridge <bridge>   Network bridge (default: vmbr0)"
    echo "  --ip <ip/mask>          Static IP address (default: DHCP)"
    echo "  --gateway <gateway>     Gateway IP (required for static IP)"
    echo "  -h, --help              Show this help"
    echo ""
    echo "Examples:"
    echo "  $0                      # Create with defaults"
    echo "  $0 -i 201 -n webapp    # Custom ID and name"
    echo "  $0 --ip 192.168.1.100/24 --gateway 192.168.1.1"
    echo ""
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -i|--id)
            CONTAINER_ID="$2"
            shift 2
            ;;
        -n|--name)
            CONTAINER_NAME="$2"
            shift 2
            ;;
        -s|--storage)
            STORAGE="$2"
            shift 2
            ;;
        -p|--password)
            PASSWORD="$2"
            shift 2
            ;;
        -m|--memory)
            MEMORY="$2"
            shift 2
            ;;
        -d|--disk)
            DISK_SIZE="$2"
            shift 2
            ;;
        -c|--cores)
            CORES="$2"
            shift 2
            ;;
        -b|--bridge)
            BRIDGE="$2"
            shift 2
            ;;
        --ip)
            IP_ADDRESS="$2"
            shift 2
            ;;
        --gateway)
            GATEWAY="$2"
            shift 2
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            print_error "Unknown option $1"
            show_help
            exit 1
            ;;
    esac
done

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "This script must be run as root on the Proxmox host"
    exit 1
fi

print_status "Setting up BookTracker LXC Container"
print_status "Container ID: $CONTAINER_ID"
print_status "Container Name: $CONTAINER_NAME"
print_status "Storage: $STORAGE"
print_status "Memory: ${MEMORY}MB"
print_status "Disk: ${DISK_SIZE}GB"
print_status "Cores: $CORES"

# Check if container ID already exists
if pct list | grep -q "^$CONTAINER_ID"; then
    print_error "Container ID $CONTAINER_ID already exists"
    exit 1
fi

# Check if template is available
if ! pveam list local | grep -q "$TEMPLATE"; then
    print_warning "Template $TEMPLATE not found locally. Downloading..."
    pveam download local $TEMPLATE
fi

# Build network configuration
if [ -n "$IP_ADDRESS" ]; then
    if [ -z "$GATEWAY" ]; then
        print_error "Gateway is required when using static IP"
        exit 1
    fi
    NET_CONFIG="name=eth0,bridge=$BRIDGE,ip=$IP_ADDRESS,gw=$GATEWAY"
    print_status "Network: Static IP $IP_ADDRESS via $GATEWAY on $BRIDGE"
else
    NET_CONFIG="name=eth0,bridge=$BRIDGE,ip=dhcp"
    print_status "Network: DHCP on $BRIDGE"
fi

# Create the container
print_status "Creating LXC container..."
pct create $CONTAINER_ID local:vztmpl/$TEMPLATE \
    --hostname $CONTAINER_NAME \
    --password $PASSWORD \
    --memory $MEMORY \
    --rootfs $STORAGE:$DISK_SIZE \
    --cores $CORES \
    --net0 $NET_CONFIG \
    --unprivileged 1 \
    --onboot 1 \
    --features nesting=1

if [ $? -eq 0 ]; then
    print_success "Container created successfully"
else
    print_error "Failed to create container"
    exit 1
fi

# Start the container
print_status "Starting container..."
pct start $CONTAINER_ID
sleep 5

# Wait for container to be ready
print_status "Waiting for container to be ready..."
for i in {1..30}; do
    if pct exec $CONTAINER_ID -- systemctl is-system-running --quiet 2>/dev/null; then
        break
    fi
    sleep 2
done

# Update system
print_status "Updating system packages..."
pct exec $CONTAINER_ID -- apt update
pct exec $CONTAINER_ID -- apt upgrade -y

# Install nginx and required packages
print_status "Installing Nginx and dependencies..."
pct exec $CONTAINER_ID -- apt install -y nginx curl wget unzip

# Enable and start nginx
print_status "Configuring Nginx..."
pct exec $CONTAINER_ID -- systemctl enable nginx
pct exec $CONTAINER_ID -- systemctl start nginx

# Create application directory
pct exec $CONTAINER_ID -- mkdir -p /var/www/booktracker

# Set up nginx configuration
print_status "Setting up Nginx configuration..."
pct exec $CONTAINER_ID -- tee /etc/nginx/sites-available/booktracker > /dev/null << 'NGINX_EOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    
    root /var/www/booktracker;
    index index.html;
    
    server_name _;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Cache static assets
    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Security headers
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options DENY;
    add_header X-XSS-Protection "1; mode=block";
}
NGINX_EOF

# Enable the site
pct exec $CONTAINER_ID -- ln -sf /etc/nginx/sites-available/booktracker /etc/nginx/sites-enabled/
pct exec $CONTAINER_ID -- rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
pct exec $CONTAINER_ID -- nginx -t

# Create a simple index page
pct exec $CONTAINER_ID -- tee /var/www/booktracker/index.html > /dev/null << 'HTML_EOF'
<!DOCTYPE html>
<html>
<head>
    <title>BookTracker Container Setup</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; margin-top: 50px; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .success { color: #28a745; }
        .info { color: #17a2b8; background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <h1 class="success">✅ BookTracker LXC Container Ready!</h1>
        <div class="info">
            <h3>Next Steps:</h3>
            <p>1. Upload your BookTracker application files to <code>/var/www/booktracker/</code></p>
            <p>2. Use the deployment script to install the application</p>
            <p>3. Access your application via this container's IP address</p>
        </div>
        <p><strong>Container ID:</strong> $CONTAINER_ID</p>
        <p><strong>Container Name:</strong> $CONTAINER_NAME</p>
    </div>
</body>
</html>
HTML_EOF

# Set correct permissions
pct exec $CONTAINER_ID -- chown -R www-data:www-data /var/www/booktracker
pct exec $CONTAINER_ID -- chmod -R 755 /var/www/booktracker

# Reload nginx
pct exec $CONTAINER_ID -- systemctl reload nginx

# Get container IP
CONTAINER_IP=$(pct exec $CONTAINER_ID -- hostname -I | awk '{print $1}')

print_success "BookTracker LXC container setup completed!"
print_status ""
print_status "Container Details:"
print_status "  ID: $CONTAINER_ID"
print_status "  Name: $CONTAINER_NAME"
print_status "  IP Address: $CONTAINER_IP"
print_status "  Root Password: $PASSWORD"
print_status ""
print_status "Next steps:"
print_status "1. Upload BookTracker files to the container:"
print_status "   scp -r index.html script.js styles.css root@$CONTAINER_IP:/var/www/booktracker/"
print_status ""
print_status "2. Or use the deployment script:"
print_status "   ./deploy-to-lxc.sh $CONTAINER_ID"
print_status ""
print_status "3. Access your application at: http://$CONTAINER_IP"
print_status ""
print_status "Container management commands:"
print_status "  Start:   pct start $CONTAINER_ID"
print_status "  Stop:    pct stop $CONTAINER_ID"
print_status "  Console: pct console $CONTAINER_ID"
print_status "  Enter:   pct enter $CONTAINER_ID"
print_status "  Status:  pct status $CONTAINER_ID"

