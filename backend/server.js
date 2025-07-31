const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
const BookDatabase = require('./database');

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize database
let db;
try {
    db = new BookDatabase();
    console.log('✅ Database initialized successfully');
} catch (error) {
    console.error('❌ Failed to initialize database:', error);
    process.exit(1);
}

// CORS configuration for cross-device access
const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        // Allow any origin for development and cross-device access
        // In production, you might want to restrict this to specific domains
        return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'X-Requested-With', 'Accept']
};

// Middleware
app.use(helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false, // Disabled for API server
}));
app.use(compression());
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path} from ${req.ip}`);
    next();
});

// Health check endpoint
app.get('/health', (req, res) => {
    try {
        const stats = db.getStats();
        res.json({ 
            status: 'ok', 
            timestamp: new Date().toISOString(),
            database: {
                connected: true,
                totalBooks: stats.totalBooks,
                size: stats.databaseSize
            }
        });
    } catch (error) {
        res.status(500).json({ 
            status: 'error', 
            timestamp: new Date().toISOString(),
            database: { connected: false }
        });
    }
});

// API routes with better error handling
app.get('/api/health', (req, res) => {
    try {
        const stats = db.getStats();
        res.json({ 
            status: 'ok', 
            timestamp: new Date().toISOString(),
            database: {
                connected: true,
                totalBooks: stats.totalBooks,
                path: stats.databasePath
            }
        });
    } catch (error) {
        console.error('Health check error:', error);
        res.status(500).json({ 
            status: 'error', 
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Get all books
app.get('/api/books', async (req, res) => {
    try {
        const books = db.getAllBooks();
        console.log(`📚 Retrieved ${books.length} books`);
        res.json(books);
    } catch (error) {
        console.error('Error getting books:', error);
        res.status(500).json({ error: 'Failed to retrieve books', details: error.message });
    }
});

// Get single book
app.get('/api/books/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const book = db.getBookById(id);
        
        if (!book) {
            return res.status(404).json({ error: 'Book not found' });
        }
        
        res.json(book);
    } catch (error) {
        console.error('Error getting book:', error);
        res.status(500).json({ error: 'Failed to retrieve book', details: error.message });
    }
});

// Add a single book
app.post('/api/books', async (req, res) => {
    try {
        const bookData = req.body;
        
        // Validate required fields
        if (!bookData.title || !bookData.author) {
            return res.status(400).json({ error: 'Title and author are required' });
        }
        
        const book = db.addBook(bookData);
        console.log(`📖 Added book: ${book.title} by ${book.author}`);
        res.status(201).json(book);
    } catch (error) {
        console.error('Error adding book:', error);
        res.status(500).json({ error: 'Failed to add book', details: error.message });
    }
});

// Update a book
app.put('/api/books/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const bookData = req.body;
        
        const book = db.updateBook(id, bookData);
        console.log(`📝 Updated book: ${book.title}`);
        res.json(book);
    } catch (error) {
        console.error('Error updating book:', error);
        if (error.message === 'Book not found') {
            res.status(404).json({ error: 'Book not found' });
        } else {
            res.status(500).json({ error: 'Failed to update book', details: error.message });
        }
    }
});

// Delete a book
app.delete('/api/books/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const success = db.deleteBook(id);
        
        if (!success) {
            return res.status(404).json({ error: 'Book not found' });
        }
        
        console.log(`🗑️ Deleted book with ID: ${id}`);
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting book:', error);
        res.status(500).json({ error: 'Failed to delete book', details: error.message });
    }
});

// Bulk sync endpoint (for migration and backup)
app.post('/api/books/sync', async (req, res) => {
    try {
        const { books } = req.body;
        
        if (!Array.isArray(books)) {
            return res.status(400).json({ error: 'Books must be an array' });
        }
        
        const syncedBooks = db.syncBooks(books);
        console.log(`🔄 Synced ${books.length} books, total: ${syncedBooks.length}`);
        res.json({ success: true, count: syncedBooks.length, books: syncedBooks });
    } catch (error) {
        console.error('Error syncing books:', error);
        res.status(500).json({ error: 'Failed to sync books', details: error.message });
    }
});

// Database statistics endpoint
app.get('/api/stats', async (req, res) => {
    try {
        const stats = db.getStats();
        res.json(stats);
    } catch (error) {
        console.error('Error getting stats:', error);
        res.status(500).json({ error: 'Failed to get statistics', details: error.message });
    }
});

// Backup endpoint
app.post('/api/backup', async (req, res) => {
    try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = path.join(__dirname, 'backups', `booktracker-${timestamp}.db`);
        
        // Ensure backup directory exists
        const backupDir = path.dirname(backupPath);
        const fs = require('fs');
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }
        
        const success = db.backup(backupPath);
        
        if (success) {
            res.json({ success: true, backupPath, timestamp });
        } else {
            res.status(500).json({ error: 'Backup failed' });
        }
    } catch (error) {
        console.error('Error creating backup:', error);
        res.status(500).json({ error: 'Failed to create backup', details: error.message });
    }
});

// Export books as JSON (for compatibility)
app.get('/api/export', async (req, res) => {
    try {
        const books = db.getAllBooks();
        const filename = `booktracker-export-${new Date().toISOString().split('T')[0]}.json`;
        
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.json(books);
    } catch (error) {
        console.error('Error exporting books:', error);
        res.status(500).json({ error: 'Failed to export books', details: error.message });
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({ 
        error: 'Internal server error', 
        details: process.env.NODE_ENV === 'development' ? error.message : 'Please try again later'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    if (db) {
        db.close();
    }
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Server terminated');
    if (db) {
        db.close();
    }
    process.exit(0);
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 BookTracker API server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`📚 Books API: http://localhost:${PORT}/api/books`);
    console.log(`🌐 Server accessible from other devices on network`);
    
    // Log the network interfaces for easy access from other devices
    const os = require('os');
    const networkInterfaces = os.networkInterfaces();
    console.log('\n📡 Access from other devices:');
    
    Object.keys(networkInterfaces).forEach((interfaceName) => {
        const addresses = networkInterfaces[interfaceName];
        addresses.forEach((address) => {
            if (address.family === 'IPv4' && !address.internal) {
                console.log(`   http://${address.address}:${PORT}`);
            }
        });
    });
    console.log('');
});
