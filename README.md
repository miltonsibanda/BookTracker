# 📚 BookTracker

A modern, containerized personal book collection manager with **cross-browser data persistence**. Built with vanilla JavaScript, Node.js backend, and Docker for easy deployment.

## ✨ Features

### 📖 Core Functionality
- **Add, edit, and delete books** with comprehensive metadata
- **Half-star rating system** (0.5 to 5.0 stars)
- **Reading status tracking** (Want to Read, Currently Reading, Read, DNF)
- **Advanced search and filtering** by title, author, series, publisher, and status
- **Google Books API integration** for easy book discovery and metadata import
- **Export/Import functionality** with JSON backup files

### 🎨 Physical Book Features
- **Digital signatures and author signatures**
- **Sprayed edges, hidden covers, reversible dust jackets**
- **Gift tracking and special edition notes**
- **Comprehensive publisher and page count information**

### 🔄 **NEW: Data Persistence**
- **Cross-browser data sharing** - access your books from any browser!
- **Persistent storage** - data survives container restarts
- **Automatic synchronization** between browser localStorage and server
- **Offline support** with intelligent fallback to localStorage
- **Volume-mounted data** for true persistence in Docker

### 🎯 User Experience
- **Responsive design** that works on desktop and mobile
- **Grid and list view options** for different preferences
- **Keyboard shortcuts** for power users (Ctrl+N, Ctrl+F, Ctrl+S)
- **Real-time statistics** showing reading progress
- **Intuitive modal-based editing** with form validation

### 📊 Statistics Dashboard
- Total books in collection
- Books read vs. want to read
- Currently reading progress
- DNF (Did Not Finish) tracking

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- 2GB+ available disk space
- Port 8081 available (or modify in docker-compose.yml)

### One-Command Setup
```bash
# Clone the repository
git clone https://github.com/miltonsibanda/BookTracker.git
cd BookTracker

# Build and start with data persistence
make install
```

### Manual Setup
```bash
# Build the image
make build

# Start the application
make run

# View logs
make logs
```

### Access Your BookTracker
Open **http://localhost:8081** in any browser 🌐

## 🔧 Management Commands

### Basic Operations
```bash
make build      # Build Docker image
make run        # Start with data persistence
make stop       # Stop the application
make restart    # Restart (preserves data)
make logs       # View application logs
make status     # Show system status
make test       # Test API endpoints
```

### Data Management
```bash
make backup     # Create timestamped backup
make restore BACKUP_FILE=books_backup_20250727_191200.json
make volume-info    # Show volume details
```

### Production Deployment
```bash
make prod       # Deploy to production (port 80)
```

## 📚 Data Persistence Architecture

BookTracker now uses a **hybrid storage approach**:

### 🏗️ Storage Layers
1. **Primary**: Node.js backend with JSON file storage
2. **Backup**: Browser localStorage for offline access
3. **Volume**: Docker volume for container persistence

### 🌐 Cross-Browser Magic
- Add books in **Chrome** ✅
- View them in **Firefox** ✅  
- Edit on **Safari** ✅
- All data synchronized automatically! 🎉

### 📡 API Endpoints
- `GET /api/health` - Server health check
- `GET /api/books` - Retrieve all books
- `POST /api/books` - Save books collection

## 📦 Deployment Options

### 🐳 Docker (Recommended)
```bash
# Development
docker compose up -d

# Production
docker compose -f docker-compose.prod.yml up -d
```

### 🖥️ Proxmox LXC
Complete LXC deployment with automated scripts:
```bash
cd proxmox-lxc
./quick-setup.sh
```

### ☁️ Manual Installation
```bash
# Install dependencies
npm install

# Start the server
npm start
```

## 📂 Project Structure

```
BookTracker/
├── 📄 index.html                 # Main application UI
├── 🎨 styles.css                 # Application styling  
├── ⚡ script-with-persistence.js # Enhanced frontend with API integration
├── 🔄 data-persistence.js        # Data layer abstraction
├── 🚀 server.js                  # Node.js Express backend
├── 📦 package.json               # Node.js dependencies
├── 🐳 Dockerfile                 # Container configuration
├── �� docker-compose.yml         # Development deployment
├── 🏭 docker-compose.prod.yml    # Production deployment  
├── 🛠️ Makefile                   # Management commands
├── 📚 README-Data-Persistence.md # Detailed persistence guide
├── 🗂️ proxmox-lxc/               # Proxmox deployment files
└── 📖 docs/                      # Additional documentation
```

## 🔄 Migration from localStorage

Existing BookTracker users will see **automatic migration**:

1. **First Load**: App detects existing localStorage data
2. **Auto-Upload**: Data automatically synced to server  
3. **Cross-Browser**: Books now available everywhere
4. **Backup Preserved**: localStorage maintained as fallback

## 🛠️ Development

### Local Development
```bash
# Install dependencies
npm install

# Start development server with hot reload
npm run dev

# Test the application
npm test
```

### Contributing
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 🐛 Troubleshooting

### Books Not Showing in Other Browsers?
```bash
# Check if the API server is running
make test

# View container logs
make logs

# Check container status
make status
```

### Data Backup and Recovery
```bash
# Create backup before troubleshooting
make backup

# If issues persist, restore from backup
make restore BACKUP_FILE=your_backup_file.json
```

### Common Issues
- **Port 8081 busy**: Modify port in `docker-compose.yml`
- **Permission errors**: Ensure Docker daemon is running
- **Data not persisting**: Check volume mount with `make volume-info`

## 📊 Performance

### Resource Usage
- **Memory**: ~50MB Node.js + ~20MB Alpine Linux
- **Disk**: ~100MB container + book data (JSON)
- **CPU**: Minimal (event-driven architecture)

### Scalability
- **Small Collections**: (<1000 books) - Excellent performance
- **Medium Collections**: (1000-10000 books) - Good performance  
- **Large Collections**: (>10000 books) - Consider database upgrade

## 🔮 Roadmap

### 🎯 Next Release (2.1)
- [ ] User authentication and multiple collections
- [ ] Database backend (PostgreSQL/SQLite)
- [ ] Real-time sync across browser tabs
- [ ] Advanced book recommendations

### 🚀 Future Features
- [ ] Mobile app with offline sync
- [ ] Social features and book sharing
- [ ] Reading statistics and analytics
- [ ] Integration with Goodreads, Amazon APIs
- [ ] Multi-language support
- [ ] Themes and customization options

## 📚 Documentation

### Complete Documentation

- **[README-Data-Persistence.md](README-Data-Persistence.md)** - Detailed persistence guide
- **[DEPLOYMENT-OPTIONS.md](DEPLOYMENT-OPTIONS.md)** - Comprehensive deployment comparison
- **[proxmox-lxc/README-Proxmox.md](proxmox-lxc/README-Proxmox.md)** - Proxmox LXC documentation
- **[SETUP-INSTRUCTIONS.md](SETUP-INSTRUCTIONS.md)** - Detailed setup instructions

### API Reference

BookTracker provides both REST API and localStorage compatibility:
- `GET /api/books` - Retrieve books collection
- `POST /api/books` - Save books collection  
- `GET /api/health` - Server health status
- Automatic localStorage sync for offline support

## 🏆 Key Benefits

✅ **Cross-Browser Persistence** - Your books, everywhere  
✅ **Container-Ready** - Docker and Proxmox LXC support  
✅ **Production-Ready** - Health checks, logging, and monitoring  
✅ **Developer-Friendly** - Easy setup with comprehensive documentation  
✅ **Data-Safe** - Multiple backup strategies and fallback systems  
✅ **Offline-Capable** - Works without internet connection  
✅ **Scalable** - From personal use to small team deployments  

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Support

- **Issues**: [GitHub Issues](https://github.com/miltonsibanda/BookTracker/issues)
- **Discussions**: [GitHub Discussions](https://github.com/miltonsibanda/BookTracker/discussions)
- **Documentation**: [Project Wiki](https://github.com/miltonsibanda/BookTracker/wiki)

## 🙏 Acknowledgments

- **Google Books API** for book metadata and cover images
- **Font Awesome** for beautiful icons
- **Docker Community** for containerization best practices
- **Open Source Community** for inspiration and feedback

---

**BookTracker v2.0** - Now with true data persistence! 📚✨

*Made with ❤️ for book lovers who need their collection accessible everywhere*
