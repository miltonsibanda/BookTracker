# 📚 BookTracker - Data Persistence Guide

BookTracker now includes **cross-browser data persistence** using a Node.js backend with file-based storage. Your book data will now be shared across all browsers and devices accessing the same BookTracker instance!

## 🔄 How Data Persistence Works

### Previous Limitation (localStorage only)
- Data was stored only in the browser's localStorage
- Books were **not visible** across different browsers
- Data was **lost** when switching devices or browsers
- No data sharing between users

### New Solution (API + localStorage)
- **Primary Storage**: Node.js backend with JSON file storage
- **Backup Storage**: localStorage for offline access
- **Cross-Browser**: Data accessible from any browser
- **Persistent**: Data survives container restarts
- **Automatic Sync**: Seamless data synchronization

## 🏗️ Architecture

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│   Browser   │    │   Node.js    │    │   Docker    │
│             │    │   Express    │    │   Volume    │
│ ┌─────────┐ │    │   Server     │    │             │
│ │Frontend │ │◄──►│              │◄──►│books.json   │
│ │  App    │ │    │ ┌──────────┐ │    │             │
│ │         │ │    │ │   API    │ │    │             │
│ │localStorage│    │ │/api/books│ │    │             │
│ │(backup) │ │    │ └──────────┘ │    │             │
│ └─────────┘ │    │              │    │             │
└─────────────┘    └──────────────┘    └─────────────┘
```

## 📋 API Endpoints

### Health Check
```
GET /api/health
```
Returns server status and configuration.

### Get Books
```
GET /api/books
```
Returns all books as JSON array.

### Save Books
```
POST /api/books
Content-Type: application/json

[...books array...]
```
Saves the complete books collection.

## 🚀 Quick Start

### 1. Build and Run
```bash
# Build the new container
make build

# Start with data persistence
make run
```

### 2. Access BookTracker
Open http://localhost:8081 in **any browser**

### 3. Test Cross-Browser Persistence
1. Add some books in Chrome
2. Open http://localhost:8081 in Firefox
3. **Your books will be there!** 🎉

## 📊 Data Storage Locations

### Container Data
- **Primary**: `/data/books.json` (persistent volume)
- **Backup**: Browser localStorage (per-browser backup)

### Host Data
- **Volume**: `bookwebsite_booktracker-data`
- **Backups**: `./backups/` directory (when using make backup)

## 🔧 Management Commands

### Data Persistence Commands
```bash
# Check storage status
make status

# Create data backup
make backup

# Restore from backup
make restore BACKUP_FILE=books_backup_20250727_191200.json

# View volume information
make volume-info

# Test API endpoints
make test
```

### Container Management
```bash
# Start the application
make run

# Stop the application
make stop

# Restart (preserves data)
make restart

# View logs
make logs

# Clean containers (keeps data)
make clean

# WARNING: Delete everything including data
make deep-clean
```

## 🌐 Fallback Strategy

The application includes a sophisticated fallback strategy:

### 1. Online Mode (Preferred)
- Uses backend API for data storage
- Data shared across all browsers
- Automatic synchronization

### 2. Offline Mode (Fallback)
- Falls back to localStorage
- Works when API is unavailable
- Syncs with server when connection restored

### 3. Notification System
- ✅ **Green**: "Connected to server - your data will be shared across browsers!"
- ⚠️ **Yellow**: "Using local storage - data will only be available in this browser"

## 🔄 Migration from localStorage

Existing users with localStorage data will see automatic migration:

1. **First Load**: App detects existing localStorage data
2. **Auto-Upload**: Local data is automatically synced to server
3. **Confirmation**: Success message confirms migration
4. **Cross-Browser**: Data now available everywhere

## 🐛 Troubleshooting

### Books Not Showing in Other Browsers

1. **Check Container Status**
   ```bash
   make status
   ```

2. **Check API Health**
   ```bash
   curl http://localhost:8081/api/health
   ```

3. **Check Container Logs**
   ```bash
   make logs
   ```

4. **Test API Directly**
   ```bash
   curl http://localhost:8081/api/books
   ```

### Data Loss Prevention

1. **Automatic Backups**: localStorage always maintained as backup
2. **Manual Backups**: `make backup` creates timestamped backups
3. **Volume Persistence**: Data survives container restarts
4. **Export Feature**: Traditional JSON export still available

### Performance Considerations

- **File Size**: JSON file grows with book collection
- **Concurrent Access**: Single file, no conflict resolution
- **Memory Usage**: Entire collection loaded into memory
- **For Large Collections**: Consider upgrading to database

## 🚀 Production Deployment

### Production Mode
```bash
# Deploy to production (port 80)
make prod
```

### Environment Variables
- `NODE_ENV=production`
- `DATA_FILE=/data/books.json`
- `PORT=3000`

### Volume Backup Strategy
```bash
# Regular backups (add to cron)
make backup

# Backup rotation script
for i in {1..5}; do
  if [ -f "backups/books_backup_$(date -d "$i days ago" +%Y%m%d)_*.json" ]; then
    rm backups/books_backup_$(date -d "$i days ago" +%Y%m%d)_*.json
  fi
done
```

## 📈 Monitoring

### Health Checks
- **Docker Health**: Automatic health checking built-in
- **API Endpoint**: `/api/health` for external monitoring
- **Data Validation**: JSON schema validation on save

### Logging
```bash
# Follow logs in real-time
make logs

# Container logs
docker logs booktracker-app

# Export logs for analysis
docker logs booktracker-app > booktracker.log 2>&1
```

## 🔮 Future Enhancements

### Planned Features
- [ ] Database backend (PostgreSQL/SQLite)
- [ ] User authentication and multiple collections
- [ ] Real-time synchronization (WebSockets)
- [ ] Conflict resolution for concurrent edits
- [ ] Advanced backup/restore tools
- [ ] API rate limiting and security
- [ ] Mobile app with offline sync

### Current Limitations
- Single collection per instance
- No user authentication
- File-based storage (not suitable for high-concurrency)
- Simple last-writer-wins conflict resolution
- No real-time updates across browsers

## 🎉 Benefits Summary

✅ **Cross-Browser Sharing**: Access your books from any browser
✅ **Data Persistence**: Books survive container restarts  
✅ **Automatic Backup**: localStorage maintained as fallback
✅ **Easy Migration**: Existing data automatically upgraded
✅ **Simple Deployment**: Single container with volume mounting
✅ **Offline Support**: Works even when API is unavailable
✅ **Export/Import**: Traditional file-based backup still available

Your BookTracker data is now truly persistent and shareable! 🚀📚
