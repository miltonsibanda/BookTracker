// ISBNdb API Integration for BookTracker
class ISBNdbAPI {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = 'https://api2.isbndb.com';
        this.headers = {
            'Authorization': apiKey,
            'Content-Type': 'application/json'
        };
    }

    // Search books by title, author, or general query
    async searchBooks(query, page = 1, pageSize = 20) {
        try {
            const encodedQuery = encodeURIComponent(query);
            const url = `${this.baseUrl}/search/books?q=${encodedQuery}&page=${page}&pageSize=${pageSize}`;
            
            const response = await fetch(url, {
                method: 'GET',
                headers: this.headers
            });

            if (!response.ok) {
                throw new Error(`ISBNdb API error: ${response.status}`);
            }
            
            const data = await response.json();
            return this.formatSearchResults(data.books || []);
        } catch (error) {
            console.error('ISBNdb search error:', error);
            return [];
        }
    }

    // Search by ISBN
    async searchByISBN(isbn) {
        try {
            const cleanISBN = isbn.replace(/[-\s]/g, '');
            const url = `${this.baseUrl}/book/${cleanISBN}`;
            
            const response = await fetch(url, {
                method: 'GET',
                headers: this.headers
            });

            if (!response.ok) {
                throw new Error(`ISBNdb API error: ${response.status}`);
            }
            
            const data = await response.json();
            return data.book ? [this.formatBookData(data.book)] : [];
        } catch (error) {
            console.error('ISBNdb ISBN search error:', error);
            return [];
        }
    }

    // Search by author
    async searchByAuthor(author, page = 1, pageSize = 20) {
        try {
            const encodedAuthor = encodeURIComponent(author);
            const url = `${this.baseUrl}/author/${encodedAuthor}?page=${page}&pageSize=${pageSize}`;
            
            const response = await fetch(url, {
                method: 'GET',
                headers: this.headers
            });

            if (!response.ok) {
                throw new Error(`ISBNdb API error: ${response.status}`);
            }
            
            const data = await response.json();
            return this.formatSearchResults(data.books || []);
        } catch (error) {
            console.error('ISBNdb author search error:', error);
            return [];
        }
    }

    // Format search results to match BookTracker format
    formatSearchResults(books) {
        return books.map(book => this.formatBookData(book));
    }

    // Format individual book data
    formatBookData(book) {
        return {
            isbndbId: book.isbn13 || book.isbn,
            title: book.title,
            subtitle: book.title_long ? book.title_long.replace(book.title, '').trim() : '',
            author: Array.isArray(book.authors) ? book.authors.join(', ') : (book.authors || 'Unknown Author'),
            publisher: book.publisher || '',
            publishedDate: book.date_published || '',
            pageCount: book.pages ? parseInt(book.pages) : null,
            coverImage: book.image || null,
            thumbnail: book.image || null,
            isbn: book.isbn13 || book.isbn || book.isbn10,
            language: book.language || null,
            subjects: book.subjects ? book.subjects.slice(0, 5) : [],
            description: book.synopsis || book.overview || '',
            averageRating: null, // Not typically available
            ratingsCount: null,
            dimensions: book.dimensions || null,
            weight: book.dimensions_structured ? book.dimensions_structured.weight : null,
            source: 'ISBNdb'
        };
    }

    // Get books by subject/category
    async searchBySubject(subject, page = 1, pageSize = 20) {
        try {
            const encodedSubject = encodeURIComponent(subject);
            const url = `${this.baseUrl}/subject/${encodedSubject}?page=${page}&pageSize=${pageSize}`;
            
            const response = await fetch(url, {
                method: 'GET',
                headers: this.headers
            });

            if (!response.ok) {
                throw new Error(`ISBNdb API error: ${response.status}`);
            }
            
            const data = await response.json();
            return this.formatSearchResults(data.books || []);
        } catch (error) {
            console.error('ISBNdb subject search error:', error);
            return [];
        }
    }
}

// Export for use in main application
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ISBNdbAPI;
} else {
    window.ISBNdbAPI = ISBNdbAPI;
}
