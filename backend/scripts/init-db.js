#!/usr/bin/env node

const BookDatabase = require('../database');
const fs = require('fs');
const path = require('path');

async function initializeDatabase() {
    console.log('🚀 Initializing BookTracker database...');
    
    try {
        // Initialize database
        const db = new BookDatabase();
        console.log('✅ Database created and tables initialized');
        
        // Check if we should migrate from JSON data
        const jsonDataPath = path.join(__dirname, '..', 'data', 'books.json');
        
        if (fs.existsSync(jsonDataPath)) {
            console.log('📦 Found existing JSON data, migrating to database...');
            
            try {
                const jsonData = JSON.parse(fs.readFileSync(jsonDataPath, 'utf8'));
                
                if (Array.isArray(jsonData) && jsonData.length > 0) {
                    console.log(`📚 Migrating ${jsonData.length} books from JSON to database...`);
                    
                    // Sync all books to database
                    const migratedBooks = db.syncBooks(jsonData);
                    
                    console.log(`✅ Successfully migrated ${migratedBooks.length} books`);
                    
                    // Backup the JSON file
                    const backupPath = jsonDataPath + '.backup.' + Date.now();
                    fs.copyFileSync(jsonDataPath, backupPath);
                    console.log(`📋 Backed up original JSON to: ${backupPath}`);
                } else {
                    console.log('📭 JSON file is empty, no migration needed');
                }
            } catch (error) {
                console.error('❌ Error migrating JSON data:', error);
            }
        } else {
            console.log('📭 No existing JSON data found');
        }
        
        // Add some sample data if database is empty
        const existingBooks = db.getAllBooks();
        
        if (existingBooks.length === 0) {
            console.log('📖 Adding sample books...');
            
            const sampleBooks = [
                {
                    title: "The Name of the Wind",
                    author: "Patrick Rothfuss",
                    series: "The Kingkiller Chronicle",
                    bookNumber: 1,
                    status: "read",
                    rating: 4.5,
                    mythicalElement: "Magic and storytelling",
                    publisher: "DAW Books",
                    pageCount: 662,
                    notes: "Amazing start to the series!",
                    dateAdded: new Date().toISOString()
                },
                {
                    title: "The Way of Kings",
                    author: "Brandon Sanderson",
                    series: "The Stormlight Archive",
                    bookNumber: 1,
                    status: "currently-reading",
                    rating: 0,
                    mythicalElement: "Epic fantasy with spren",
                    publisher: "Tor Books",
                    pageCount: 1007,
                    notes: "Epic fantasy at its finest",
                    dateAdded: new Date().toISOString()
                },
                {
                    title: "The Poppy War",
                    author: "R.F. Kuang",
                    series: "The Poppy War",
                    bookNumber: 1,
                    status: "want-to-read",
                    rating: 0,
                    mythicalElement: "War and shamanism",
                    publisher: "Harper Voyager",
                    pageCount: 544,
                    notes: "Military fantasy inspired by 20th-century China",
                    dateAdded: new Date().toISOString()
                }
            ];
            
            for (const book of sampleBooks) {
                db.addBook(book);
            }
            
            console.log(`✅ Added ${sampleBooks.length} sample books`);
        }
        
        // Display final statistics
        const stats = db.getStats();
        console.log('\n📊 Database Statistics:');
        console.log(`   Total books: ${stats.totalBooks}`);
        console.log(`   Database size: ${(stats.databaseSize / 1024).toFixed(2)} KB`);
        console.log(`   Database path: ${stats.databasePath}`);
        
        db.close();
        console.log('\n🎉 Database initialization complete!');
        
    } catch (error) {
        console.error('❌ Database initialization failed:', error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    initializeDatabase();
}

module.exports = initializeDatabase;
