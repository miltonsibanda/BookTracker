#!/bin/bash

# BookTracker Docker Build Script
set -e

echo "🔥 Building BookTracker Docker Container..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker first."
    exit 1
fi

# Build the application
print_status "Building BookTracker Docker image..."
docker build -t booktracker:latest .

if [ $? -eq 0 ]; then
    print_success "Docker image built successfully!"
else
    print_error "Failed to build Docker image"
    exit 1
fi

# Check if container is already running
if docker ps -q -f name=booktracker-app | grep -q .; then
    print_warning "BookTracker container is already running. Stopping it first..."
    docker stop booktracker-app
    docker rm booktracker-app
fi

# Run the container
print_status "Starting BookTracker container..."
docker run -d -p 8080:80 --name booktracker-app booktracker:latest

if [ $? -eq 0 ]; then
    print_success "BookTracker is now running!"
    print_status "Access your application at: http://localhost:8080"
    print_status ""
    print_status "Useful commands:"
    echo "  - View logs: docker logs -f booktracker-app"
    echo "  - Stop app:  docker stop booktracker-app"
    echo "  - Remove:    docker rm booktracker-app"
    print_status ""
    print_status "Container status:"
    docker ps --filter name=booktracker-app --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
else
    print_error "Failed to start BookTracker container"
    exit 1
fi
