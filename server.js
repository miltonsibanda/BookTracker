const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = process.env.DATA_FILE || '/data/books.json';

// Ensure data directory exists
const dataDir = path.dirname(DATA_FILE);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize data file if it doesn't exist
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([]));
}

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.static('.'));

// CORS middleware for cross-origin requests
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

// API Routes
app.get('/api/books', (req, res) => {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        const books = JSON.parse(data);
        res.json(books);
    } catch (error) {
        console.error('Error reading books:', error);
        res.status(500).json({ error: 'Failed to read books' });
    }
});

app.post('/api/books', (req, res) => {
    try {
        const books = req.body;
        if (!Array.isArray(books)) {
            return res.status(400).json({ error: 'Books must be an array' });
        }
        fs.writeFileSync(DATA_FILE, JSON.stringify(books, null, 2));
        res.json({ success: true, count: books.length });
    } catch (error) {
        console.error('Error saving books:', error);
        res.status(500).json({ error: 'Failed to save books' });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        dataFile: DATA_FILE 
    });
});

// Serve the main app
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`BookTracker server running on port ${PORT}`);
    console.log(`Data file: ${DATA_FILE}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
