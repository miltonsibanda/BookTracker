#!/bin/bash

# BookTracker Application Deployment to Proxmox LXC Container
# This script deploys the BookTracker application to an existing LXC container

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default configuration
CONTAINER_ID=""
SOURCE_DIR="../"
TARGET_DIR="/var/www/booktracker"

# Function to print colored output
print_status() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Help function
show_help() {
    echo "BookTracker Application Deployment to LXC Container"
    echo ""
    echo "Usage: $0 <container_id> [OPTIONS]"
    echo ""
    echo "Arguments:"
    echo "  container_id            LXC Container ID (required)"
    echo ""
    echo "Options:"
    echo "  -s, --source <dir>      Source directory (default: ../)"
    echo "  -t, --target <dir>      Target directory in container (default: /var/www/booktracker)"
    echo "  -h, --help              Show this help"
    echo ""
    echo "Examples:"
    echo "  $0 200                  # Deploy to container 200 with defaults"
    echo "  $0 201 -s /path/to/app  # Deploy from custom source directory"
    echo ""
}

# Parse command line arguments
if [ $# -eq 0 ]; then
    show_help
    exit 1
fi

CONTAINER_ID="$1"
shift

while [[ $# -gt 0 ]]; do
    case $1 in
        -s|--source)
            SOURCE_DIR="$2"
            shift 2
            ;;
        -t|--target)
            TARGET_DIR="$2"
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

# Validate container ID
if [ -z "$CONTAINER_ID" ]; then
    print_error "Container ID is required"
    show_help
    exit 1
fi

# Check if running as root or if we can access pct
if ! command -v pct &> /dev/null; then
    print_error "pct command not found. This script must be run on a Proxmox host."
    exit 1
fi

# Check if container exists and is running
if ! pct list | grep -q "^$CONTAINER_ID"; then
    print_error "Container $CONTAINER_ID does not exist"
    exit 1
fi

if [ "$(pct status $CONTAINER_ID | awk '{print $2}')" != "running" ]; then
    print_error "Container $CONTAINER_ID is not running"
    exit 1
fi

print_status "Deploying BookTracker to LXC Container $CONTAINER_ID"
print_status "Source: $SOURCE_DIR"
print_status "Target: $TARGET_DIR"

# Check if source files exist
REQUIRED_FILES=("index.html" "script.js" "styles.css")
for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$SOURCE_DIR/$file" ]; then
        print_error "Required file not found: $SOURCE_DIR/$file"
        exit 1
    fi
done

# Create target directory if it doesn't exist
print_status "Preparing target directory..."
pct exec $CONTAINER_ID -- mkdir -p $TARGET_DIR

# Copy application files
print_status "Copying application files..."
for file in "${REQUIRED_FILES[@]}"; do
    print_status "  Copying $file"
    cat "$SOURCE_DIR/$file" | pct exec $CONTAINER_ID -- tee "$TARGET_DIR/$file" > /dev/null
done

# Copy any additional files if they exist
OPTIONAL_FILES=("imported-books.json" "favicon.ico" "manifest.json")
for file in "${OPTIONAL_FILES[@]}"; do
    if [ -f "$SOURCE_DIR/$file" ]; then
        print_status "  Copying optional file: $file"
        cat "$SOURCE_DIR/$file" | pct exec $CONTAINER_ID -- tee "$TARGET_DIR/$file" > /dev/null
    fi
done

# Set correct permissions
print_status "Setting file permissions..."
pct exec $CONTAINER_ID -- chown -R www-data:www-data $TARGET_DIR
pct exec $CONTAINER_ID -- chmod -R 755 $TARGET_DIR

# Test nginx configuration
print_status "Testing Nginx configuration..."
if pct exec $CONTAINER_ID -- nginx -t; then
    print_success "Nginx configuration is valid"
else
    print_error "Nginx configuration test failed"
    exit 1
fi

# Reload nginx
print_status "Reloading Nginx..."
pct exec $CONTAINER_ID -- systemctl reload nginx

# Get container IP
CONTAINER_IP=$(pct exec $CONTAINER_ID -- hostname -I | awk '{print $1}')

# Test if the application is accessible
print_status "Testing application accessibility..."
if pct exec $CONTAINER_ID -- curl -s -o /dev/null -w "%{http_code}" http://localhost | grep -q "200"; then
    print_success "Application is responding correctly"
else
    print_warning "Application may not be responding correctly"
fi

print_success "BookTracker deployment completed!"
print_status ""
print_status "Application Details:"
print_status "  Container ID: $CONTAINER_ID"
print_status "  Container IP: $CONTAINER_IP"
print_status "  Application URL: http://$CONTAINER_IP"
print_status ""
print_status "Management Commands:"
print_status "  View logs: pct exec $CONTAINER_ID -- tail -f /var/log/nginx/access.log"
print_status "  Restart Nginx: pct exec $CONTAINER_ID -- systemctl restart nginx"
print_status "  Container shell: pct enter $CONTAINER_ID"
print_status ""
print_status "Application is now ready for use!"

