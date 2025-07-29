const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'books.json');

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Ensure data directory exists
async function ensureDataDirectory() {
    const dataDir = path.dirname(DATA_FILE);
    try {
        await fs.access(dataDir);
    } catch {
        await fs.mkdir(dataDir, { recursive: true });
    }
}

// Load books from file
async function loadBooks() {
    try {
        const data = await fs.readFile(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            return []; // File doesn't exist, return empty array
        }
        throw error;
    }
}

// Save books to file
async function saveBooks(books) {
    await ensureDataDirectory();
    const data = JSON.stringify(books, null, 2);
    await fs.writeFile(DATA_FILE, data, 'utf8');
}

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get all books
app.get('/api/books', async (req, res) => {
    try {
        const books = await loadBooks();
        res.json(books);
    } catch (error) {
        console.error('Error loading books:', error);
        res.status(500).json({ error: 'Failed to load books' });
    }
});

// Save all books (full sync)
app.post('/api/books/sync', async (req, res) => {
    try {
        const { books } = req.body;
        if (!Array.isArray(books)) {
            return res.status(400).json({ error: 'Books must be an array' });
        }
        
        await saveBooks(books);
        res.json({ success: true, count: books.length });
    } catch (error) {
        console.error('Error syncing books:', error);
        res.status(500).json({ error: 'Failed to sync books' });
    }
});

// Add a single book
app.post('/api/books', async (req, res) => {
    try {
        const book = req.body;
        const books = await loadBooks();
        
        // Generate ID if not provided
        if (!book.id) {
            book.id = Date.now().toString(36) + Math.random().toString(36).substr(2);
        }
        
        book.dateAdded = book.dateAdded || new Date().toISOString();
        books.push(book);
        
        await saveBooks(books);
        res.json(book);
    } catch (error) {
        console.error('Error adding book:', error);
        res.status(500).json({ error: 'Failed to add book' });
    }
});

// Update a book
app.put('/api/books/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updatedBook = req.body;
        const books = await loadBooks();
        
        const index = books.findIndex(book => book.id === id);
        if (index === -1) {
            return res.status(404).json({ error: 'Book not found' });
        }
        
        books[index] = {
            ...books[index],
            ...updatedBook,
            dateModified: new Date().toISOString()
        };
        
        await saveBooks(books);
        res.json(books[index]);
    } catch (error) {
        console.error('Error updating book:', error);
        res.status(500).json({ error: 'Failed to update book' });
    }
});

// Delete a book
app.delete('/api/books/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const books = await loadBooks();
        
        const index = books.findIndex(book => book.id === id);
        if (index === -1) {
            return res.status(404).json({ error: 'Book not found' });
        }
        
        books.splice(index, 1);
        await saveBooks(books);
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting book:', error);
        res.status(500).json({ error: 'Failed to delete book' });
    }
});

// Backup endpoint
app.get('/api/backup', async (req, res) => {
    try {
        const books = await loadBooks();
        const filename = `booktracker-backup-${new Date().toISOString().split('T')[0]}.json`;
        
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.json(books);
    } catch (error) {
        console.error('Error creating backup:', error);
        res.status(500).json({ error: 'Failed to create backup' });
    }
});

// Initialize and start server
async function startServer() {
    await ensureDataDirectory();
    
    app.listen(PORT, () => {
        console.log(`BookTracker API server running on port ${PORT}`);
        console.log(`Health check: http://localhost:${PORT}/health`);
    });
}

startServer().catch(console.error);
