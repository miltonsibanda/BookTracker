# BookTracker Docker Setup Instructions

## Prerequisites

### Install Docker

#### On macOS:
1. **Option 1: Docker Desktop (Recommended)**
   - Download Docker Desktop from: https://www.docker.com/products/docker-desktop/
   - Install and run Docker Desktop
   - Ensure Docker is running (check the Docker icon in your menu bar)

2. **Option 2: Using Homebrew**
   ```bash
   brew install --cask docker
   ```

#### On Linux (Ubuntu/Debian):
```bash
# Update package index
sudo apt update

# Install required packages
sudo apt install apt-transport-https ca-certificates curl software-properties-common

# Add Docker's official GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Add Docker repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
sudo apt update
sudo apt install docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Add your user to the docker group
sudo usermod -aG docker $USER

# Log out and back in, or run:
newgrp docker
```

#### On Windows:
- Download Docker Desktop from: https://www.docker.com/products/docker-desktop/
- Install and ensure WSL2 is enabled

## Quick Start

### 1. Verify Docker Installation
```bash
docker --version
docker-compose --version
```

### 2. Build and Run BookTracker

#### Method A: Using the build script (Easiest)
```bash
./build-docker.sh
```

#### Method B: Using Docker Compose
```bash
# For development
docker-compose up -d

# For production
docker-compose -f docker-compose.prod.yml up -d
```

#### Method C: Using Docker directly
```bash
# Build the image
docker build -t booktracker .

# Run the container
docker run -d -p 8080:80 --name booktracker-app booktracker
```

### 3. Access the Application
Open your browser and navigate to: http://localhost:8080

## Alternative: Run Without Docker

If you prefer not to use Docker, you can run BookTracker with any static web server:

### Option 1: Python HTTP Server
```bash
# Python 3
python3 -m http.server 8080

# Python 2
python -m SimpleHTTPServer 8080
```

### Option 2: Node.js HTTP Server
```bash
# Install http-server globally
npm install -g http-server

# Run the server
http-server -p 8080
```

### Option 3: PHP Built-in Server
```bash
php -S localhost:8080
```

### Option 4: Using Live Server (VS Code Extension)
1. Install the "Live Server" extension in VS Code
2. Right-click on `index.html`
3. Select "Open with Live Server"

## Docker Commands Reference

### Basic Operations
```bash
# Build image
docker build -t booktracker .

# Run container
docker run -d -p 8080:80 --name booktracker-app booktracker

# View running containers
docker ps

# View all containers
docker ps -a

# Stop container
docker stop booktracker-app

# Remove container
docker rm booktracker-app

# Remove image
docker rmi booktracker
```

### Docker Compose Operations
```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Rebuild and start
docker-compose up -d --build
```

### Debugging
```bash
# View container logs
docker logs booktracker-app

# Execute commands in container
docker exec -it booktracker-app sh

# Inspect container
docker inspect booktracker-app
```

## Customization

### Change Port
Edit `docker-compose.yml` and modify the ports section:
```yaml
ports:
  - "3000:80"  # Change to your desired port
```

### Environment Variables
Copy `.env.example` to `.env` and modify as needed:
```bash
cp .env.example .env
# Edit .env file with your preferred settings
```

## Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Find what's using the port
   lsof -i :8080
   
   # Kill the process or use a different port
   ```

2. **Docker daemon not running**
   - Start Docker Desktop on macOS/Windows
   - Start Docker service on Linux: `sudo systemctl start docker`

3. **Permission denied (Linux)**
   ```bash
   # Add user to docker group
   sudo usermod -aG docker $USER
   newgrp docker
   ```

4. **Container won't start**
   ```bash
   # Check logs
   docker logs booktracker-app
   
   # Check if image built correctly
   docker images
   ```

## Production Deployment

For production deployment, use the production configuration:

```bash
# Copy environment template
cp .env.example .env

# Edit .env with production values
# Set DOMAIN, PORT, etc.

# Deploy with production config
docker-compose -f docker-compose.prod.yml up -d
```

## Security Considerations

1. **Use HTTPS in production**
2. **Set proper environment variables**
3. **Regular security updates**
4. **Use secrets management for sensitive data**
5. **Implement proper backup strategies**
