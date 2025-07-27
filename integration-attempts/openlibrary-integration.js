// Open Library API Integration for BookTracker
class OpenLibraryAPI {
    constructor() {
        this.baseUrl = 'https://openlibrary.org';
        this.searchUrl = 'https://openlibrary.org/search.json';
        this.coversUrl = 'https://covers.openlibrary.org/b';
    }

    // Search books by title, author, or general query
    async searchBooks(query, limit = 10) {
        try {
            const encodedQuery = encodeURIComponent(query);
            const url = `${this.searchUrl}?q=${encodedQuery}&limit=${limit}&fields=key,title,author_name,first_publish_year,isbn,publisher,cover_i,number_of_pages,language,subject`;
            
            const response = await fetch(url);
            const data = await response.json();
            
            return this.formatSearchResults(data.docs || []);
        } catch (error) {
            console.error('OpenLibrary search error:', error);
            return [];
        }
    }

    // Search by ISBN
    async searchByISBN(isbn) {
        try {
            const cleanISBN = isbn.replace(/[-\s]/g, '');
            const url = `${this.baseUrl}/isbn/${cleanISBN}.json`;
            
            const response = await fetch(url);
            if (!response.ok) {
                // Try the API method if direct ISBN lookup fails
                return this.searchBooks(`isbn:${cleanISBN}`, 1);
            }
            
            const data = await response.json();
            return [this.formatBookData(data)];
        } catch (error) {
            console.error('OpenLibrary ISBN search error:', error);
            return [];
        }
    }

    // Get book details by Open Library ID
    async getBookDetails(olid) {
        try {
            const url = `${this.baseUrl}/books/${olid}.json`;
            const response = await fetch(url);
            const data = await response.json();
            
            return this.formatBookData(data);
        } catch (error) {
            console.error('OpenLibrary book details error:', error);
            return null;
        }
    }

    // Format search results to match BookTracker format
    formatSearchResults(docs) {
        return docs.map(doc => ({
            openLibraryId: doc.key,
            title: doc.title,
            author: Array.isArray(doc.author_name) ? doc.author_name.join(', ') : (doc.author_name || 'Unknown Author'),
            publisher: Array.isArray(doc.publisher) ? doc.publisher[0] : (doc.publisher || ''),
            publishedDate: doc.first_publish_year ? doc.first_publish_year.toString() : '',
            pageCount: doc.number_of_pages || null,
            coverImage: doc.cover_i ? `${this.coversUrl}/id/${doc.cover_i}-M.jpg` : null,
            thumbnail: doc.cover_i ? `${this.coversUrl}/id/${doc.cover_i}-S.jpg` : null,
            isbn: Array.isArray(doc.isbn) ? doc.isbn[0] : null,
            language: Array.isArray(doc.language) ? doc.language[0] : null,
            subjects: Array.isArray(doc.subject) ? doc.subject.slice(0, 5) : [],
            description: '', // OpenLibrary search doesn't include description
            averageRating: null, // Not available in search results
            ratingsCount: null,
            source: 'OpenLibrary'
        }));
    }

    // Format individual book data
    formatBookData(book) {
        const isbn = book.isbn_13 || book.isbn_10 || (book.identifiers && (book.identifiers.isbn_13 || book.identifiers.isbn_10));
        const isbnValue = Array.isArray(isbn) ? isbn[0] : isbn;

        return {
            openLibraryId: book.key,
            title: book.title,
            subtitle: book.subtitle || '',
            author: book.authors ? book.authors.map(a => a.name || a).join(', ') : 'Unknown Author',
            publisher: Array.isArray(book.publishers) ? book.publishers[0] : (book.publishers || ''),
            publishedDate: book.publish_date || '',
            pageCount: book.number_of_pages || null,
            coverImage: book.covers && book.covers[0] ? `${this.coversUrl}/id/${book.covers[0]}-M.jpg` : null,
            thumbnail: book.covers && book.covers[0] ? `${this.coversUrl}/id/${book.covers[0]}-S.jpg` : null,
            isbn: isbnValue,
            language: book.languages ? book.languages[0].key.replace('/languages/', '') : null,
            subjects: book.subjects ? book.subjects.slice(0, 5) : [],
            description: book.description ? (typeof book.description === 'string' ? book.description : book.description.value) : '',
            source: 'OpenLibrary'
        };
    }

    // Get cover image URL by ISBN
    getCoverByISBN(isbn, size = 'M') {
        const cleanISBN = isbn.replace(/[-\s]/g, '');
        return `${this.coversUrl}/isbn/${cleanISBN}-${size}.jpg`;
    }

    // Get cover image URL by Open Library ID
    getCoverByOLID(olid, size = 'M') {
        return `${this.coversUrl}/olid/${olid}-${size}.jpg`;
    }
}

// Export for use in main application
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OpenLibraryAPI;
} else {
    window.OpenLibraryAPI = OpenLibraryAPI;
}
