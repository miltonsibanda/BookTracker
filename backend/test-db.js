#!/usr/bin/env node
const BookDatabase = require('./database');

console.log('Testing database initialization...');

try {
    const db = new BookDatabase();
    console.log('✅ Database initialized successfully');
    
    // Test adding a book
    const testBook = {
        title: 'Test Book',
        author: 'Test Author',
        status: 'want-to-read'
    };
    
    const addedBook = db.addBook(testBook);
    console.log('✅ Test book added:', addedBook.title);
    
    // Test getting all books
    const books = db.getAllBooks();
    console.log('✅ Books retrieved:', books.length);
    
    // Clean up
    db.deleteBook(addedBook.id);
    console.log('✅ Test book deleted');
    
    db.close();
    console.log('✅ Database test completed successfully');
    
} catch (error) {
    console.error('❌ Database test failed:', error);
    console.error('Stack trace:', error.stack);
}
