# 📚 BookTracker

A modern, responsive web application for managing your personal book collection with advanced rating features and multiple deployment options.

![BookTracker Screenshot](https://img.shields.io/badge/Status-Production%20Ready-green)
![Docker](https://img.shields.io/badge/Docker-Supported-blue)
![Proxmox](https://img.shields.io/badge/Proxmox%20LXC-Supported-orange)
![License](https://img.shields.io/badge/License-MIT-blue)

## ✨ Features

- 📖 **Book Management** - Add, edit, delete, and organize your book collection
- ⭐ **Half-Star Rating System** - Precise rating with half-star increments (0.5 to 5.0)
- 📱 **Responsive Design** - Works perfectly on desktop, tablet, and mobile devices
- 💾 **Local Storage** - Data persists in your browser's local storage
- 🔍 **Search & Filter** - Find books quickly with built-in search functionality
- 📊 **Collection Stats** - View statistics about your reading habits
- 🎨 **Modern UI** - Clean, intuitive interface with smooth animations
- 🚀 **Multiple Deployment Options** - Docker, Proxmox LXC, or static hosting

## 🚀 Quick Start

### Option 1: Docker (Recommended for Development)

```bash
# Clone the repository
git clone https://github.com/miltonsibanda/BookTracker.git
cd BookTracker

# Start with Docker Compose
docker compose up -d

# Access the application
open http://localhost:8081
```

### Option 2: Proxmox LXC (Recommended for Production)

```bash
# Copy to Proxmox host
scp -r proxmox-lxc/ root@your-proxmox-host:/root/

# SSH to Proxmox and run setup
ssh root@your-proxmox-host
cd /root/proxmox-lxc/
./quick-setup.sh

# Deploy application
./deploy-to-lxc.sh 200
```

### Option 3: Static File Server (Quick Testing)

```bash
# Clone and serve
git clone https://github.com/miltonsibanda/BookTracker.git
cd BookTracker
python3 -m http.server 8080

# Access at http://localhost:8080
```

## 📋 Requirements

### For Docker Deployment
- Docker and Docker Compose
- 512MB RAM (recommended)
- Modern web browser

### For Proxmox LXC Deployment
- Proxmox VE 7.0+
- Ubuntu 22.04 LXC template
- 512MB RAM minimum
- 4GB storage minimum

### For Static Deployment
- Web server (Nginx, Apache, or built-in)
- Modern web browser
- No additional dependencies

## 🛠️ Installation & Deployment

### Docker Deployment

The application includes a complete Docker setup with optimized Nginx configuration:

```bash
# Using Docker Compose (recommended)
docker compose up -d

# Using Docker directly
docker build -t booktracker .
docker run -d -p 8081:80 --name booktracker-app booktracker

# Using the build script
./build-docker.sh

# Using Makefile
make run
```

#### Docker Features
- ✅ Nginx Alpine base image (lightweight)
- ✅ Gzip compression enabled
- ✅ Security headers configured
- ✅ Health checks included
- ✅ Production and development configurations
- ✅ Automated build scripts

### Proxmox LXC Deployment

For production deployments on Proxmox VE infrastructure:

```bash
# Interactive setup
cd proxmox-lxc/
./quick-setup.sh

# Manual setup
./setup-booktracker-lxc.sh -i 200 -n booktracker -m 512 -d 4

# Deploy application
./deploy-to-lxc.sh 200
```

#### Proxmox LXC Features
- ✅ Ultra-low resource overhead (~50MB RAM)
- ✅ Live migration support
- ✅ Built-in backup and snapshots
- ✅ Proxmox GUI integration
- ✅ Enterprise-grade high availability

### Manual Installation

For custom deployments or development:

1. **Clone the repository**
   ```bash
   git clone https://github.com/miltonsibanda/BookTracker.git
   cd BookTracker
   ```

2. **Configure web server** (Nginx example)
   ```bash
   sudo cp nginx.conf /etc/nginx/sites-available/booktracker
   sudo ln -s /etc/nginx/sites-available/booktracker /etc/nginx/sites-enabled/
   sudo systemctl reload nginx
   ```

3. **Copy application files**
   ```bash
   sudo cp -r * /var/www/booktracker/
   sudo chown -R www-data:www-data /var/www/booktracker/
   ```

## 📖 Usage

### Adding Books

1. Click the **"Add New Book"** button
2. Fill in the book details:
   - Title (required)
   - Author (required)
   - Genre
   - Publication Year
   - Rating (0.5 to 5.0 stars)
   - Personal notes

3. Click **"Add Book"** to save

### Rating System

BookTracker features a precise half-star rating system:
- ⭐⭐⭐⭐⭐ 5.0 stars (Outstanding)
- ⭐⭐⭐⭐☆ 4.5 stars (Excellent)
- ⭐⭐⭐⭐ 4.0 stars (Very Good)
- ⭐⭐⭐☆ 3.5 stars (Good)
- ⭐⭐⭐ 3.0 stars (Average)
- And so on...

### Managing Your Collection

- **Edit Books**: Click the edit icon next to any book
- **Delete Books**: Click the delete icon (with confirmation)
- **Search**: Use the search bar to find specific books
- **Filter**: Filter by genre, rating, or other criteria
- **Sort**: Sort by title, author, rating, or date added

## 🔧 Configuration

### Environment Variables

For production deployments, you can configure:

```bash
# Docker environment
NGINX_HOST=localhost
NGINX_PORT=80
APP_VERSION=1.0.0

# Proxmox LXC environment
CONTAINER_ID=200
CONTAINER_NAME=booktracker
MEMORY=512
DISK_SIZE=4
```

### Nginx Configuration

The included Nginx configuration provides:
- Gzip compression
- Static file caching
- Security headers
- SSL/TLS ready
- Performance optimization

### Customization

You can customize the application by modifying:
- `styles.css` - Visual appearance and themes
- `script.js` - Functionality and features
- `nginx.conf` - Web server configuration
- Docker configurations for deployment options

## 📊 Performance

### Resource Usage

| Deployment Method | RAM Usage | Storage | Startup Time |
|-------------------|-----------|---------|--------------|
| Docker Container | ~150MB | 100MB | 2-5 seconds |
| Proxmox LXC | ~50MB | 300MB | 1-3 seconds |
| Static Server | ~20MB | 10MB | <1 second |

### Browser Compatibility

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## 🐳 Docker Details

### Images and Tags

```bash
# Build locally
docker build -t booktracker:latest .

# Run with custom port
docker run -d -p 3000:80 booktracker:latest

# Use Docker Compose for development
docker compose up -d

# Use production configuration
docker compose -f docker-compose.prod.yml up -d
```

### Docker Compose Services

- **booktracker**: Main application container
- **nginx**: Web server (Alpine-based)
- **healthcheck**: Application health monitoring

### Volumes and Networking

- Application files are copied into the container
- No persistent volumes needed (data stored in browser)
- Configurable port mapping
- Network bridge support

## 📦 Proxmox LXC Details

### Container Specifications

- **Base**: Ubuntu 22.04 LTS
- **Type**: Unprivileged container
- **Features**: Nesting enabled
- **Network**: Bridge mode with optional static IP
- **Storage**: Configurable (local-lvm, ZFS, etc.)

### Management Commands

```bash
# Container lifecycle
pct start 200           # Start container
pct stop 200            # Stop container
pct restart 200         # Restart container

# Access container
pct console 200         # Console access
pct enter 200           # Shell access

# Monitoring
pct status 200          # Show status
pct list                # List all containers
```

### Backup and Snapshots

```bash
# Create backup
vzdump 200 --storage local --mode snapshot

# Create snapshot
pct snapshot 200 before-update

# Rollback snapshot
pct rollback 200 before-update
```

## 🔒 Security

### Docker Security Features

- Non-root user execution
- Read-only filesystem options
- Security headers in Nginx
- Container isolation
- Regular security updates

### Proxmox LXC Security Features

- Unprivileged containers by default
- AppArmor and seccomp protection
- cgroups resource isolation
- Proxmox firewall integration
- Regular security updates

### Web Application Security

- XSS protection headers
- Content-Type-Options headers
- Frame-Options headers
- Input sanitization
- Local storage only (no server data)

## 🧪 Development

### Local Development Setup

```bash
# Clone repository
git clone https://github.com/miltonsibanda/BookTracker.git
cd BookTracker

# Start development server
python3 -m http.server 8080

# Or use live-server for auto-reload
npm install -g live-server
live-server --port=8080
```

### Project Structure

```
BookTracker/
├── index.html              # Main application file
├── script.js               # Application logic and functionality
├── styles.css              # Styling and responsive design
├── nginx.conf              # Nginx configuration
├── Dockerfile              # Docker container definition
├── docker-compose.yml      # Docker Compose configuration
├── docker-compose.prod.yml # Production Docker Compose
├── Makefile               # Build and management commands
├── build-docker.sh        # Docker build script
├── proxmox-lxc/           # Proxmox LXC deployment files
│   ├── setup-booktracker-lxc.sh
│   ├── deploy-to-lxc.sh
│   ├── quick-setup.sh
│   └── README-Proxmox.md
├── DEPLOYMENT-OPTIONS.md   # Deployment comparison guide
├── DOCKER-DEPLOYMENT-SUMMARY.md
└── README.md              # This file
```

### Testing

The application includes test files for development:
- `test_rating.html` - Rating system testing
- `test_book_rating.html` - Book rating integration testing

### Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📚 Documentation

### Complete Documentation

- **[DEPLOYMENT-OPTIONS.md](DEPLOYMENT-OPTIONS.md)** - Comprehensive deployment comparison
- **[DOCKER-DEPLOYMENT-SUMMARY.md](DOCKER-DEPLOYMENT-SUMMARY.md)** - Docker-specific documentation
- **[proxmox-lxc/README-Proxmox.md](proxmox-lxc/README-Proxmox.md)** - Proxmox LXC documentation
- **[SETUP-INSTRUCTIONS.md](SETUP-INSTRUCTIONS.md)** - Detailed setup instructions

### API Reference

BookTracker uses browser localStorage API:
- `localStorage.setItem('books', JSON.stringify(books))`
- `localStorage.getItem('books')`
- Automatic backup and restore functionality

## 🤝 Support

### Getting Help

- 📖 **Documentation**: Check the comprehensive docs in this repository
- 🐛 **Issues**: Report bugs or request features via GitHub Issues
- �� **Discussions**: Join discussions on GitHub Discussions

### Troubleshooting

#### Common Issues

1. **500 Internal Server Error (Backend API)**
   - **Symptoms**: Adding books fails with 500 error, console shows "HTTP error! status: 500"
   - **Cause**: Missing Node.js dependencies in backend
   - **Solution**: 
     ```bash
     cd backend
     npm install
     npm start
     ```
   - **Verification**: Run `node verify-install.js` in backend directory

2. **Application won't load**
   - Check browser console for errors
   - Verify web server is running
   - Clear browser cache and localStorage

3. **Docker container issues**
   - Check container logs: `docker logs booktracker-app`
   - Verify port availability: `netstat -tulpn | grep :8081`
   - Restart container: `docker restart booktracker-app`

4. **Proxmox LXC issues**
   - Check container status: `pct status 200`
   - View container logs: `pct exec 200 -- tail -f /var/log/nginx/error.log`
   - Restart services: `pct exec 200 -- systemctl restart nginx`

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎯 Roadmap

### Planned Features

- [ ] Import/Export functionality for book data
- [ ] Reading progress tracking
- [ ] Book series management
- [ ] Social features (sharing reviews)
- [ ] Advanced statistics and analytics
- [ ] Mobile app development
- [ ] Database backend option
- [ ] Multi-user support
- [ ] Cloud synchronization

### Version History

- **v1.0.0** - Initial release with core functionality
- **v1.1.0** - Added half-star rating system
- **v1.2.0** - Docker containerization support
- **v1.3.0** - Proxmox LXC support and comprehensive deployment options

## 🙏 Acknowledgments

- Built with vanilla HTML, CSS, and JavaScript for maximum compatibility
- Nginx for high-performance web serving
- Docker for consistent deployment environments
- Proxmox VE for enterprise container management
- The open-source community for inspiration and best practices

## 📈 Statistics

![GitHub stars](https://img.shields.io/github/stars/miltonsibanda/BookTracker)
![GitHub forks](https://img.shields.io/github/forks/miltonsibanda/BookTracker)
![GitHub issues](https://img.shields.io/github/issues/miltonsibanda/BookTracker)
![GitHub pull requests](https://img.shields.io/github/issues-pr/miltonsibanda/BookTracker)

---

**Happy Reading! 📚✨**

