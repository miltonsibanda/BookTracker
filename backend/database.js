const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

class BookDatabase {
    constructor() {
        // Use DATA_DIR environment variable if set, otherwise fall back to relative path
        const dataDir = process.env.DATA_DIR || path.join(__dirname, 'data');
        this.dbPath = path.join(dataDir, 'booktracker.db');
        this.db = null;
        this.ensureDataDirectory();
        this.init();
    }

    ensureDataDirectory() {
        const dataDir = path.dirname(this.dbPath);
        console.log(`📁 Ensuring data directory exists: ${dataDir}`);
        if (!fs.existsSync(dataDir)) {
            console.log(`📁 Creating data directory: ${dataDir}`);
            fs.mkdirSync(dataDir, { recursive: true, mode: 0o755 });
        } else {
            console.log(`✅ Data directory already exists: ${dataDir}`);
        }
        
        // Check if directory is writable
        try {
            fs.accessSync(dataDir, fs.constants.W_OK);
            console.log(`✅ Data directory is writable: ${dataDir}`);
        } catch (err) {
            console.error(`❌ Data directory is not writable: ${dataDir}`, err);
            throw new Error(`Data directory is not writable: ${dataDir}`);
        }
    }

    init() {
        try {
            // Open database connection
            this.db = new Database(this.dbPath);
            
            // Enable WAL mode for better concurrency
            this.db.pragma('journal_mode = WAL');
            this.db.pragma('synchronous = NORMAL');
            this.db.pragma('foreign_keys = ON');
            
            // Create tables if they don't exist
            this.createTables();
            
            console.log('✅ Database initialized successfully');
        } catch (error) {
            console.error('❌ Database initialization failed:', error);
            throw error;
        }
    }

    createTables() {
        const createBooksTable = `
            CREATE TABLE IF NOT EXISTS books (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                author TEXT NOT NULL,
                series TEXT,
                book_number INTEGER,
                status TEXT NOT NULL DEFAULT 'want-to-read',
                rating REAL DEFAULT 0,
                mythical_element TEXT,
                publisher TEXT,
                page_count INTEGER,
                cover_image TEXT,
                edition TEXT,
                digitally_signed BOOLEAN DEFAULT FALSE,
                signed BOOLEAN DEFAULT FALSE,
                sprayed_edges BOOLEAN DEFAULT FALSE,
                hidden_cover BOOLEAN DEFAULT FALSE,
                reversible_dust_jacket BOOLEAN DEFAULT FALSE,
                started_reading TEXT,
                finished_reading TEXT,
                gifted BOOLEAN DEFAULT FALSE,
                notes TEXT,
                date_added TEXT NOT NULL,
                date_modified TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `;

        const createIndexes = [
            'CREATE INDEX IF NOT EXISTS idx_books_title ON books(title)',
            'CREATE INDEX IF NOT EXISTS idx_books_author ON books(author)',
            'CREATE INDEX IF NOT EXISTS idx_books_status ON books(status)',
            'CREATE INDEX IF NOT EXISTS idx_books_rating ON books(rating)',
            'CREATE INDEX IF NOT EXISTS idx_books_date_added ON books(date_added)',
            'CREATE INDEX IF NOT EXISTS idx_books_series ON books(series)'
        ];

        // Execute table creation
        this.db.exec(createBooksTable);
        
        // Create indexes
        createIndexes.forEach(index => {
            this.db.exec(index);
        });

        // Create update trigger for updated_at
        const updateTrigger = `
            CREATE TRIGGER IF NOT EXISTS update_books_timestamp
            AFTER UPDATE ON books
            BEGIN
                UPDATE books SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
            END
        `;
        
        this.db.exec(updateTrigger);
    }

    // Convert database row to frontend format
    rowToBook(row) {
        if (!row) return null;
        
        return {
            id: row.id,
            title: row.title,
            author: row.author,
            series: row.series || '',
            bookNumber: row.book_number,
            status: row.status,
            rating: row.rating || 0,
            mythicalElement: row.mythical_element || '',
            publisher: row.publisher || '',
            pageCount: row.page_count,
            coverImage: row.cover_image || '',
            edition: row.edition || '',
            digitallySigned: Boolean(row.digitally_signed),
            signed: Boolean(row.signed),
            sprayedEdges: Boolean(row.sprayed_edges),
            hiddenCover: Boolean(row.hidden_cover),
            reversibleDustJacket: Boolean(row.reversible_dust_jacket),
            startedReading: row.started_reading || '',
            finishedReading: row.finished_reading || '',
            gifted: Boolean(row.gifted),
            notes: row.notes || '',
            dateAdded: row.date_added,
            dateModified: row.date_modified
        };
    }

    // Convert frontend book to database format
    bookToRow(book) {
        return {
            id: book.id,
            title: book.title,
            author: book.author,
            series: book.series || null,
            book_number: book.bookNumber || null,
            status: book.status || 'want-to-read',
            rating: book.rating || 0,
            mythical_element: book.mythicalElement || null,
            publisher: book.publisher || null,
            page_count: book.pageCount || null,
            cover_image: book.coverImage || null,
            edition: book.edition || null,
            digitally_signed: book.digitallySigned ? 1 : 0,
            signed: book.signed ? 1 : 0,
            sprayed_edges: book.sprayedEdges ? 1 : 0,
            hidden_cover: book.hiddenCover ? 1 : 0,
            reversible_dust_jacket: book.reversibleDustJacket ? 1 : 0,
            started_reading: book.startedReading || null,
            finished_reading: book.finishedReading || null,
            gifted: book.gifted ? 1 : 0,
            notes: book.notes || null,
            date_added: book.dateAdded || new Date().toISOString(),
            date_modified: book.dateModified || null
        };
    }

    // Get all books
    getAllBooks() {
        try {
            const stmt = this.db.prepare('SELECT * FROM books ORDER BY date_added DESC');
            const rows = stmt.all();
            return rows.map(row => this.rowToBook(row));
        } catch (error) {
            console.error('Error getting all books:', error);
            throw error;
        }
    }

    // Get book by ID
    getBookById(id) {
        try {
            const stmt = this.db.prepare('SELECT * FROM books WHERE id = ?');
            const row = stmt.get(id);
            return this.rowToBook(row);
        } catch (error) {
            console.error('Error getting book by ID:', error);
            throw error;
        }
    }

    // Add new book
    addBook(book) {
        try {
            if (!book.id) {
                book.id = Date.now().toString(36) + Math.random().toString(36).substr(2);
            }
            
            const row = this.bookToRow(book);
            
            const stmt = this.db.prepare(`
                INSERT INTO books (
                    id, title, author, series, book_number, status, rating,
                    mythical_element, publisher, page_count, cover_image, edition,
                    digitally_signed, signed, sprayed_edges, hidden_cover,
                    reversible_dust_jacket, started_reading, finished_reading,
                    gifted, notes, date_added, date_modified
                ) VALUES (
                    @id, @title, @author, @series, @book_number, @status, @rating,
                    @mythical_element, @publisher, @page_count, @cover_image, @edition,
                    @digitally_signed, @signed, @sprayed_edges, @hidden_cover,
                    @reversible_dust_jacket, @started_reading, @finished_reading,
                    @gifted, @notes, @date_added, @date_modified
                )
            `);
            
            stmt.run(row);
            return this.getBookById(book.id);
        } catch (error) {
            console.error('Error adding book:', error);
            throw error;
        }
    }

    // Update book
    updateBook(id, book) {
        try {
            const existingBook = this.getBookById(id);
            if (!existingBook) {
                throw new Error('Book not found');
            }

            const updatedBook = { ...existingBook, ...book, id };
            updatedBook.dateModified = new Date().toISOString();
            
            const row = this.bookToRow(updatedBook);
            
            const stmt = this.db.prepare(`
                UPDATE books SET
                    title = @title,
                    author = @author,
                    series = @series,
                    book_number = @book_number,
                    status = @status,
                    rating = @rating,
                    mythical_element = @mythical_element,
                    publisher = @publisher,
                    page_count = @page_count,
                    cover_image = @cover_image,
                    edition = @edition,
                    digitally_signed = @digitally_signed,
                    signed = @signed,
                    sprayed_edges = @sprayed_edges,
                    hidden_cover = @hidden_cover,
                    reversible_dust_jacket = @reversible_dust_jacket,
                    started_reading = @started_reading,
                    finished_reading = @finished_reading,
                    gifted = @gifted,
                    notes = @notes,
                    date_modified = @date_modified
                WHERE id = @id
            `);
            
            stmt.run(row);
            return this.getBookById(id);
        } catch (error) {
            console.error('Error updating book:', error);
            throw error;
        }
    }

    // Delete book
    deleteBook(id) {
        try {
            const stmt = this.db.prepare('DELETE FROM books WHERE id = ?');
            const result = stmt.run(id);
            return result.changes > 0;
        } catch (error) {
            console.error('Error deleting book:', error);
            throw error;
        }
    }

    // Bulk operations for sync
    syncBooks(books) {
        try {
            const insertStmt = this.db.prepare(`
                INSERT OR REPLACE INTO books (
                    id, title, author, series, book_number, status, rating,
                    mythical_element, publisher, page_count, cover_image, edition,
                    digitally_signed, signed, sprayed_edges, hidden_cover,
                    reversible_dust_jacket, started_reading, finished_reading,
                    gifted, notes, date_added, date_modified
                ) VALUES (
                    @id, @title, @author, @series, @book_number, @status, @rating,
                    @mythical_element, @publisher, @page_count, @cover_image, @edition,
                    @digitally_signed, @signed, @sprayed_edges, @hidden_cover,
                    @reversible_dust_jacket, @started_reading, @finished_reading,
                    @gifted, @notes, @date_added, @date_modified
                )
            `);

            const transaction = this.db.transaction((books) => {
                for (const book of books) {
                    const row = this.bookToRow(book);
                    insertStmt.run(row);
                }
            });

            transaction(books);
            return this.getAllBooks();
        } catch (error) {
            console.error('Error syncing books:', error);
            throw error;
        }
    }

    // Get database statistics
    getStats() {
        try {
            const countStmt = this.db.prepare('SELECT COUNT(*) as count FROM books');
            const sizeStmt = this.db.prepare("SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size()");
            
            const count = countStmt.get().count;
            const size = sizeStmt.get().size;
            
            return {
                totalBooks: count,
                databaseSize: size,
                databasePath: this.dbPath,
                lastBackup: null // TODO: implement backup tracking
            };
        } catch (error) {
            console.error('Error getting database stats:', error);
            return { totalBooks: 0, databaseSize: 0, databasePath: this.dbPath };
        }
    }

    // Backup database
    backup(backupPath) {
        try {
            this.db.backup(backupPath);
            console.log(`✅ Database backed up to: ${backupPath}`);
            return true;
        } catch (error) {
            console.error('Error backing up database:', error);
            return false;
        }
    }

    // Close database connection
    close() {
        if (this.db) {
            this.db.close();
            console.log('✅ Database connection closed');
        }
    }
}

module.exports = BookDatabase;
