# BookTracker Docker Setup

This directory contains the Docker configuration files to containerize the BookTracker application.

## Files

- `Dockerfile` - Docker build configuration
- `docker-compose.yml` - Docker Compose configuration for easy deployment
- `nginx.conf` - Nginx web server configuration
- `.dockerignore` - Files to exclude from Docker build context

## Quick Start

### Option 1: Using Docker Compose (Recommended)

```bash
# Build and run the application
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the application
docker-compose down
```

### Option 2: Using Docker directly

```bash
# Build the image
docker build -t booktracker .

# Run the container
docker run -d -p 8080:80 --name booktracker-app booktracker

# Stop the container
docker stop booktracker-app
docker rm booktracker-app
```

## Access the Application

Once running, open your browser and go to:
- http://localhost:8080

## Features

- **Nginx Alpine**: Lightweight web server for serving static files
- **Gzip Compression**: Enabled for better performance
- **Security Headers**: Basic security headers included
- **Health Check**: Container health monitoring
- **Restart Policy**: Automatically restarts unless manually stopped

## Customization

### Changing the Port

Edit the `docker-compose.yml` file and change the port mapping:

```yaml
ports:
  - "3000:80"  # Change 8080 to your desired port
```

### SSL/HTTPS

To add SSL support, you would need to:

1. Add SSL certificates to the container
2. Update the nginx configuration
3. Expose port 443

### Persistent Data

The current setup stores all data in localStorage, which persists in the browser. If you want to add server-side data persistence in the future, you can uncomment the volumes section in `docker-compose.yml`.

## Development

For development, you can mount the source files as volumes:

```yaml
# Add this to the booktracker service in docker-compose.yml
volumes:
  - ./index.html:/usr/share/nginx/html/index.html
  - ./script.js:/usr/share/nginx/html/script.js
  - ./styles.css:/usr/share/nginx/html/styles.css
```

## Troubleshooting

### Container won't start
- Check if port 8080 is already in use: `netstat -tulpn | grep :8080`
- View container logs: `docker logs booktracker-app`

### Application not loading
- Verify the container is running: `docker ps`
- Check the nginx configuration: `docker exec booktracker-app cat /etc/nginx/nginx.conf`

### Performance Issues
- Monitor container resources: `docker stats booktracker-app`
- Adjust nginx worker processes if needed

## Production Deployment

For production deployment, consider:

1. **Environment Variables**: Set appropriate environment variables
2. **Reverse Proxy**: Use a reverse proxy like Traefik or nginx-proxy
3. **SSL Certificates**: Use Let's Encrypt or your SSL provider
4. **Monitoring**: Add monitoring and logging solutions
5. **Backup Strategy**: Implement backup for user data if server-side storage is added

## Building for Different Architectures

To build for different architectures (e.g., ARM64 for Apple Silicon or ARM servers):

```bash
# Build for multiple architectures
docker buildx build --platform linux/amd64,linux/arm64 -t booktracker .
```
