// Simple testBookTracker definition at the very top
console.log('🚀 Defining testBookTracker immediately...');

window.testBookTrackerSimple = {
    test: () => console.log('testBookTrackerSimple works!'),
    openModal: () => {
        if (window.bookTracker) {
            window.bookTracker.openModal();
        } else {
            console.error('BookTracker not initialized yet');
        }
    },
    openSearchModal: () => {
        if (window.bookTracker) {
            window.bookTracker.openSearchModal();
        } else {
            console.error('BookTracker not initialized yet');
        }
    }
};

console.log('✅ testBookTrackerSimple defined successfully');

// BookTracker App - Enhanced JavaScript with Google Books API, Half-Star Ratings, and Backend Sync
class BookTrackerAPI {
    constructor(baseUrl = this.getApiUrl()) {
        this.baseUrl = baseUrl;
        this.isOnline = navigator.onLine;
        
        // Setup online/offline event listeners
        window.addEventListener('online', () => {
            this.isOnline = true;
            // Note: syncWithServer will be called by BookTracker class when needed
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
        });
    }

    getApiUrl() {
        // Check if we're running in a Docker environment
        const hostname = window.location.hostname;
        const port = window.location.port;
        
        // If accessing via Docker frontend (port 8081), use nginx proxy
        if (port === '8081') {
            return '/api'; // Use relative URL, nginx will proxy to backend
        }
        
        // If accessing via non-localhost hostname, use relative proxy
        if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
            return '/api'; // Use relative URL, nginx will proxy to backend
        }
        
        // Default for local development (direct access)
        return 'http://localhost:3001/api';
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        try {
            const response = await fetch(url, config);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`API request failed: ${error.message}`);
            throw error;
        }
    }

    async getBooks() {
        try {
            return await this.request('/books');
        } catch (error) {
            console.error('Failed to fetch books from server:', error);
            return [];
        }
    }

    async createBook(book) {
        try {
            return await this.request('/books', {
                method: 'POST',
                body: JSON.stringify(book)
            });
        } catch (error) {
            console.error('Failed to create book on server:', error);
            throw error;
        }
    }

    async updateBook(id, book) {
        try {
            return await this.request(`/books/${id}`, {
                method: 'PUT',
                body: JSON.stringify(book)
            });
        } catch (error) {
            console.error('Failed to update book on server:', error);
            throw error;
        }
    }

    async deleteBook(id) {
        try {
            return await this.request(`/books/${id}`, {
                method: 'DELETE'
            });
        } catch (error) {
            console.error('Failed to delete book on server:', error);
            throw error;
        }
    }
}

class BookTracker {
    constructor() {
        this.books = [];
        this.filteredBooks = [];
        this.currentEditId = null;
        this.currentView = 'grid';
        this.currentTab = 'basic';
        this.searchCache = new Map();
        
        // Google Books API configuration
        this.googleBooksApiKey = null; // Users can add their own API key
        this.googleBooksBaseUrl = 'https://www.googleapis.com/books/v1/volumes';
        
        // Backend API
        this.api = new BookTrackerAPI();
        this.syncInProgress = false;
        
        this.init();
    }

    async testApiConnection() {
        try {
            const health = await this.api.request('/health');
            console.log('API Health Check:', health);
            return health.status === 'ok';
        } catch (error) {
            console.warn('API connection test failed:', error);
            return false;
        }
    }

    updateConnectionStatus(status, message) {
        const indicator = document.getElementById('connectionIndicator');
        const text = document.getElementById('connectionText');
        
        if (indicator && text) {
            // Remove existing status classes
            indicator.classList.remove('connected', 'disconnected', 'connecting');
            
            // Add new status class
            indicator.classList.add(status);
            text.textContent = message;
            
            console.log(`Connection status: ${status} - ${message}`);
        }
    }

    async init() {
        try {
            console.log('BookTracker initialization started...');
            
            // Show connecting status
            this.updateConnectionStatus('connecting', 'Connecting to database...');
            
            // Test API connection first
            const apiConnected = await this.testApiConnection();
            
            if (apiConnected) {
                this.updateConnectionStatus('connected', 'Connected to database');
            } else {
                this.updateConnectionStatus('disconnected', 'Using local storage only');
            }
            
            // Load books from both local storage and server
            await this.loadBooksFromStorage();
            console.log('Books loaded from storage:', this.books.length);
            
            if (apiConnected) {
                await this.syncWithServer();
                console.log('Server sync completed');
            }
            
            this.bindEvents();
            console.log('Events bound successfully');
            
            this.setupTabNavigation();
            console.log('Tab navigation setup completed');
            
            this.setupRatingInputs();
            console.log('Rating inputs setup completed');
            
            this.setupAutocomplete();
            console.log('Autocomplete setup completed');
            
            // Ensure we start in grid view
            this.currentView = 'grid';
            const gridBtn = document.getElementById('gridView');
            const listBtn = document.getElementById('listView');
            if (gridBtn) gridBtn.classList.add('active');
            if (listBtn) listBtn.classList.remove('active');
            console.log('View set to grid mode');
            
            // Force grid layout initialization
            this.forceGridLayout();
            
            this.renderBooks();
            console.log('Books rendered');
            
            this.updateStats();
            console.log('Stats updated');
            
            console.log('BookTracker initialization completed successfully!');
        } catch (error) {
            console.error('BookTracker initialization failed:', error);
            // Try to continue with basic functionality
            this.bindEvents();
            this.renderBooks();
            this.updateStats();
        }
    }

    // Setup initial data (only if no books exist)
    setupInitialData() {
        if (this.books.length === 0) {
            const initialBooks = [
                {
                    id: this.generateId(),
                    title: "Blood and Steel",
                    author: "Unknown Author",
                    series: "",
                    bookNumber: null,
                    status: "read",
                    rating: 4,
                    mythicalElement: "fae",
                    publisher: "",
                    pageCount: null,
                    coverImage: "",
                    edition: "",
                    digitallySigned: false,
                    signed: false,
                    sprayedEdges: false,
                    hiddenCover: false,
                    reversibleDustJacket: false,
                    startedReading: "2024-01-15",
                    finishedReading: "2024-01-22",
                    gifted: false,
                    notes: "Amazing start to the series!",
                    dateAdded: new Date().toISOString()
                }
            ];
            
            this.books = initialBooks;
            this.saveBooksToStorage();
            this.renderBooks();
            this.updateStats();
        }
    }

    // Event binding
    bindEvents() {
        // Check if elements exist before binding
        const checkAndBind = (id, event, handler) => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener(event, handler);
            } else {
                console.warn(`Element with id '${id}' not found for event binding`);
            }
        };

        // Modal controls
        checkAndBind('addBookBtn', 'click', () => this.openModal());
        checkAndBind('addFirstBook', 'click', () => this.openModal());
        checkAndBind('closeModal', 'click', () => this.closeModal());
        checkAndBind('cancelBtn', 'click', () => this.closeModal());
        checkAndBind('bookForm', 'submit', (e) => this.handleFormSubmit(e));

        // Search books online
        checkAndBind('searchBooksBtn', 'click', () => this.openSearchModal());
        checkAndBind('closeSearchModal', 'click', () => this.closeSearchModal());
        checkAndBind('performSearch', 'click', () => this.performOnlineSearch());
        
        const onlineSearchInput = document.getElementById('onlineSearchInput');
        if (onlineSearchInput) {
            onlineSearchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.performOnlineSearch();
            });
        }

        // Delete modal
        checkAndBind('closeDeleteModal', 'click', () => this.closeDeleteModal());
        checkAndBind('cancelDeleteBtn', 'click', () => this.closeDeleteModal());
        checkAndBind('confirmDeleteBtn', 'click', () => this.confirmDelete());

        // Search and filters
        checkAndBind('searchInput', 'input', () => this.handleSearch());
        checkAndBind('clearSearch', 'click', () => this.clearSearch());
        checkAndBind('statusFilter', 'change', () => this.renderBooks());
        checkAndBind('tropeFilter', 'change', () => this.renderBooks());
        checkAndBind('genreFilter', 'change', () => this.renderBooks());
        checkAndBind('sortBy', 'change', () => this.renderBooks());

        // View toggle
        checkAndBind('gridView', 'click', () => this.toggleView('grid'));
        checkAndBind('listView', 'click', () => this.toggleView('list'));

        // Import/Export
        checkAndBind('importBtn', 'click', () => this.importBooks());
        checkAndBind('exportBtn', 'click', () => this.exportBooks());
        checkAndBind('fileInput', 'change', (e) => this.handleFileImport(e));

        // Cover image preview
        checkAndBind('bookCover', 'input', (e) => this.updateCoverPreview(e.target.value));

        // Modal backdrop clicks
        document.querySelectorAll('.modal__backdrop').forEach(backdrop => {
            backdrop.addEventListener('click', (e) => {
                if (e.target === backdrop) {
                    this.closeModal();
                    this.closeDeleteModal();
                    this.closeSearchModal();
                }
            });
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
        
        // Window resize for responsive grid
        window.addEventListener('resize', () => {
            if (this.currentView === 'grid') {
                this.forceGridLayout();
            }
        });
        
        console.log('Event binding completed successfully');
    }

    // Tab Navigation
    setupTabNavigation() {
        const tabButtons = document.querySelectorAll('.tab-button');
        const tabContents = document.querySelectorAll('.tab-content');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetTab = button.dataset.tab;
                
                // Update active states
                tabButtons.forEach(b => b.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));
                
                button.classList.add('active');
                document.querySelector(`[data-tab="${targetTab}"].tab-content`).classList.add('active');
                
                this.currentTab = targetTab;
            });
        });
    }

    // Google Books API Integration
    async performOnlineSearch() {
        console.log('performOnlineSearch called');
        
        const searchInput = document.getElementById('onlineSearchInput');
        if (!searchInput) {
            console.error('Search input element not found');
            this.showNotification('Search interface not available', 'error');
            return;
        }
        
        const query = searchInput.value.trim();
        if (!query) {
            console.log('Empty search query');
            return;
        }

        console.log('Searching for:', query);
        
        const loading = document.getElementById('searchLoading');
        const results = document.getElementById('searchResults');

        if (loading) loading.classList.add('active');
        if (results) results.innerHTML = '';

        try {
            const books = await this.searchGoogleBooks(query);
            console.log('Search results:', books.length, 'books found');
            this.displaySearchResults(books);
        } catch (error) {
            console.error('Search error:', error);
            this.showNotification('Search failed. Please try again.', 'error');
            
            // Show error in results area
            if (results) {
                results.innerHTML = `
                    <div class="search-results__empty">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>Search failed: ${error.message}</p>
                        <p>Please check your internet connection and try again.</p>
                    </div>
                `;
            }
        } finally {
            if (loading) loading.classList.remove('active');
        }
    }

    async searchGoogleBooks(query) {
        const maxResults = 20; // Limit results
        let url = `${this.googleBooksBaseUrl}?q=${encodeURIComponent(query)}&maxResults=${maxResults}&printType=books&orderBy=relevance`;
        
        if (this.googleBooksApiKey) {
            url += `&key=${this.googleBooksApiKey}`;
        }

        const response = await fetch(url);
        const data = await response.json();

        if (!data.items) return [];

        const books = data.items.map(item => {
            const volumeInfo = item.volumeInfo;
            return {
                googleId: item.id,
                title: volumeInfo.title || 'Unknown Title',
                author: volumeInfo.authors?.join(', ') || 'Unknown Author',
                publisher: volumeInfo.publisher || '',
                publishedDate: volumeInfo.publishedDate || '',
                pageCount: volumeInfo.pageCount || null,
                coverImage: volumeInfo.imageLinks?.thumbnail?.replace(/zoom=\d+/, 'zoom=2') || '',
                thumbnail: volumeInfo.imageLinks?.smallThumbnail || '',
                description: volumeInfo.description || '',
                averageRating: volumeInfo.averageRating || null,
                ratingsCount: volumeInfo.ratingsCount || null
            };
        });

        // Cache the search results
        this.searchCache.set(query, books);
        
        return books;
    }

    displaySearchResults(books) {
        const results = document.getElementById('searchResults');
        if (!results) return;

        if (books.length === 0) {
            results.innerHTML = `
                <div class="search-results__empty">
                    <i class="fas fa-search"></i>
                    <p>No books found. Try a different search term.</p>
                </div>
            `;
            return;
        }

        results.innerHTML = books.map((book, index) => `
            <div class="search-result" data-google-id="${book.googleId}" data-index="${index}">
                <div class="search-result__image">
                    ${book.coverImage ? 
                        `<img src="${book.coverImage}" alt="${this.escapeHtml(book.title)}" onerror="this.style.display='none'">` : 
                        '<div class="no-cover"><i class="fas fa-book"></i></div>'
                    }
                </div>
                <div class="search-result__info">
                    <h3>${this.escapeHtml(book.title)}</h3>
                    <p class="author">by ${this.escapeHtml(book.author)}</p>
                    <div class="details">
                        ${book.publisher ? `<span>Publisher: ${this.escapeHtml(book.publisher)}</span>` : ''}
                        ${book.publishedDate ? `<span>Published: ${book.publishedDate}</span>` : ''}
                        ${book.pageCount ? `<span>Pages: ${book.pageCount}</span>` : ''}
                        ${book.averageRating ? `<span>Rating: ${book.averageRating}/5</span>` : ''}
                    </div>
                </div>
            </div>
        `).join('');

        // Add event listeners to each search result
        results.querySelectorAll('.search-result').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const googleId = item.getAttribute('data-google-id');
                console.log('Search result clicked, googleId:', googleId);
                this.selectSearchResult(googleId);
            });
            
            // Add hover effect
            item.addEventListener('mouseenter', () => {
                item.style.backgroundColor = '#f8f9fa';
                item.style.cursor = 'pointer';
            });
            
            item.addEventListener('mouseleave', () => {
                item.style.backgroundColor = '';
            });
        });

        console.log('Search results displayed:', books.length, 'items');
    }

    selectSearchResult(googleId) {
        console.log('selectSearchResult called with googleId:', googleId);
        
        // Find the book data from the cache
        let book = null;
        console.log('Searching in cache, entries:', this.searchCache.size);
        
        for (const [query, books] of this.searchCache.entries()) {
            book = books.find(b => b.googleId === googleId);
            if (book) {
                console.log('Found book in cache:', book.title);
                break;
            }
        }
        
        if (book) {
            console.log('Closing search modal and opening book modal');
            this.closeSearchModal();
            this.openModal(null, book);
        } else {
            console.error('Book not found in cache for googleId:', googleId);
            console.log('Available cache entries:', Array.from(this.searchCache.entries()));
        }
    }

    // Autocomplete for title field
    setupAutocomplete() {
        console.log('Setting up autocomplete...');
        
        const titleInput = document.getElementById('bookTitle');
        const autocompleteContainer = document.getElementById('titleAutocomplete');
        
        console.log('Title input found:', !!titleInput);
        console.log('Autocomplete container found:', !!autocompleteContainer);
        
        if (!titleInput || !autocompleteContainer) {
            console.warn('Autocomplete setup skipped - missing elements');
            return;
        }
        
        let debounceTimer;

        titleInput.addEventListener('input', (e) => {
            console.log('Title input changed:', e.target.value);
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                this.performAutocomplete(e.target.value, autocompleteContainer);
            }, 300);
        });

        titleInput.addEventListener('focus', () => {
            console.log('Title input focused, value length:', titleInput.value.length);
            if (titleInput.value.length > 2) {
                this.performAutocomplete(titleInput.value, autocompleteContainer);
            }
        });

        document.addEventListener('click', (e) => {
            if (!titleInput.contains(e.target) && !autocompleteContainer.contains(e.target)) {
                autocompleteContainer.classList.remove('active');
            }
        });
        
        console.log('Autocomplete setup completed');
    }

    async performAutocomplete(query, container) {
        if (query.length < 3) {
            container.classList.remove('active');
            return;
        }

        try {
            const books = await this.searchGoogleBooks(query);
            this.displayAutocompleteResults(books.slice(0, 5), container);
        } catch (error) {
            console.error('Autocomplete error:', error);
        }
    }

    displayAutocompleteResults(books, container) {
        if (books.length === 0) {
            container.classList.remove('active');
            return;
        }

        container.innerHTML = books.map((book, index) => `
            <div class="autocomplete-item" data-google-id="${book.googleId}" data-index="${index}">
                <strong>${this.escapeHtml(book.title)}</strong><br>
                <small>by ${this.escapeHtml(book.author)}</small>
            </div>
        `).join('');

        // Add event listeners to each autocomplete item
        container.querySelectorAll('.autocomplete-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const googleId = item.getAttribute('data-google-id');
                console.log('Autocomplete item clicked, googleId:', googleId);
                this.selectAutocompleteResult(googleId);
            });
            
            // Add hover effect
            item.addEventListener('mouseenter', () => {
                item.style.backgroundColor = '#f8f9fa';
            });
            
            item.addEventListener('mouseleave', () => {
                item.style.backgroundColor = '';
            });
        });

        container.classList.add('active');
        console.log('Autocomplete results displayed:', books.length, 'items');
    }

    selectAutocompleteResult(googleId) {
        console.log('selectAutocompleteResult called with googleId:', googleId);
        
        // Find the book data from the cache
        let book = null;
        console.log('Searching in cache, entries:', this.searchCache.size);
        
        for (const [query, books] of this.searchCache.entries()) {
            console.log('Checking cache entry for query:', query, 'books:', books.length);
            book = books.find(b => b.googleId === googleId);
            if (book) {
                console.log('Found book in cache:', book.title);
                break;
            }
        }
        
        if (book) {
            console.log('Populating form from Google book:', book.title);
            this.populateFormFromGoogleBook(book);
            
            const autocompleteContainer = document.getElementById('titleAutocomplete');
            if (autocompleteContainer) {
                autocompleteContainer.classList.remove('active');
                console.log('Autocomplete dropdown hidden');
            }
        } else {
            console.error('Book not found in cache for googleId:', googleId);
            console.log('Available cache entries:', Array.from(this.searchCache.entries()));
        }
    }

    populateFormFromGoogleBook(book) {
        console.log('Populating form from Google Book:', book.title);
        
        // Populate basic fields
        const setFieldValue = (id, value) => {
            const element = document.getElementById(id);
            if (element && value) {
                element.value = value;
                console.log(`Set ${id} to:`, value);
            }
        };
        
        setFieldValue('bookTitle', book.title);
        setFieldValue('bookAuthor', book.author);
        setFieldValue('bookPublisher', book.publisher);
        
        if (book.pageCount) setFieldValue('bookPages', book.pageCount);
        
        if (book.coverImage) {
            setFieldValue('bookCover', book.coverImage);
            try {
                this.updateCoverPreview(book.coverImage);
                console.log('Cover preview updated');
            } catch (error) {
                console.warn('Could not update cover preview:', error);
            }
        }
        
        if (book.description) {
            const shortDescription = book.description.length > 200 
                ? book.description.substring(0, 200) + '...' 
                : book.description;
            setFieldValue('bookNotes', shortDescription);
        }
        
        console.log('Form populated successfully');
    }

    // Generate unique ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Enhanced Storage operations with API sync
    async saveBooksToStorage() {
        try {
            // Always save to localStorage first for immediate backup
            localStorage.setItem('bookTracker_books', JSON.stringify(this.books));
            console.log('Books saved to localStorage');
            
            // Try to sync with server if online
            if (this.api.isOnline) {
                try {
                    const apiConnected = await this.testApiConnection();
                    if (apiConnected && !this.syncInProgress) {
                        console.log('Syncing with server...');
                        await this.syncWithServer();
                    }
                } catch (error) {
                    console.error('Server sync failed:', error);
                }
            }
        } catch (error) {
            console.error('Error saving books:', error);
        }
    }

    async loadBooksFromStorage() {
        try {
            // First try to load from API if connected
            const apiConnected = await this.testApiConnection();
            
            if (apiConnected) {
                console.log('Loading books from API server...');
                try {
                    const serverBooks = await this.api.getBooks();
                    if (serverBooks && serverBooks.length > 0) {
                        this.books = serverBooks;
                        // Save to localStorage as backup
                        localStorage.setItem('bookTracker_books', JSON.stringify(this.books));
                        console.log(`Loaded ${this.books.length} books from server`);
                        return;
                    }
                } catch (error) {
                    console.error('Failed to load from API:', error);
                }
            }
            
            // Fallback to localStorage if API fails or no data
            console.log('Loading books from localStorage...');
            const stored = localStorage.getItem('bookTracker_books');
            if (stored) {
                this.books = JSON.parse(stored);
                console.log(`Loaded ${this.books.length} books from localStorage`);
            } else {
                console.log('No books found in localStorage');
                this.books = [];
            }
        } catch (error) {
            console.error('Error loading books:', error);
            this.books = [];
        }
    }

    async syncWithServer() {
        if (this.syncInProgress || !this.api.isOnline) return;
        
        this.syncInProgress = true;
        
        try {
            // Get books from server
            const serverBooks = await this.api.getBooks();
            
            // Simple merge strategy: server wins for conflicts
            if (serverBooks.length > 0) {
                // Merge local and server books
                const localBooksMap = new Map(this.books.map(book => [book.id, book]));
                const serverBooksMap = new Map(serverBooks.map(book => [book.id, book]));
                
                // Start with server books (they take precedence)
                const mergedBooks = [...serverBooks];
                
                // Add local books that don't exist on server
                this.books.forEach(localBook => {
                    if (!serverBooksMap.has(localBook.id)) {
                        mergedBooks.push(localBook);
                        // Also send this book to server
                        this.api.createBook(localBook).catch(err => 
                            console.error('Failed to sync local book to server:', err)
                        );
                    }
                });
                
                this.books = mergedBooks;
                localStorage.setItem('bookTracker_books', JSON.stringify(this.books));
                
                // Update UI
                this.renderBooks();
                this.updateStats();
            } else {
                // No books on server, check if we should add initial data
                if (this.books.length === 0) {
                    this.setupInitialData();
                }
            }
            
            console.log('Sync completed successfully');
        } catch (error) {
            console.error('Sync failed:', error);
            // If sync failed and we have no books, add initial data
            if (this.books.length === 0) {
                this.setupInitialData();
            }
        } finally {
            this.syncInProgress = false;
        }
    }

    // Modal operations with improved error handling
    openModal(book = null, googleBook = null) {
        console.log('openModal called with:', book ? 'edit book' : googleBook ? 'google book' : 'new book');
        
        const modal = document.getElementById('bookModal');
        const form = document.getElementById('bookForm');
        const title = document.getElementById('modalTitle');

        if (!modal || !form || !title) {
            console.error('Modal elements not found:', { modal: !!modal, form: !!form, title: !!title });
            return;
        }

        if (book) {
            title.textContent = 'Edit Book';
            this.currentEditId = book.id;
            this.populateForm(book);
        } else if (googleBook) {
            title.textContent = 'Add Book from Search';
            this.currentEditId = null;
            form.reset();
            this.resetRatings();
            this.populateFormFromGoogleBook(googleBook);
        } else {
            title.textContent = 'Add New Book';
            this.currentEditId = null;
            form.reset();
            this.resetRatings();
            this.updateCoverPreview('');
        }

        // Reset to first tab
        document.querySelector('.tab-button.active')?.classList.remove('active');
        document.querySelector('.tab-content.active')?.classList.remove('active');
        document.querySelector('[data-tab="basic"].tab-button')?.classList.add('active');
        document.querySelector('[data-tab="basic"].tab-content')?.classList.add('active');

        modal.classList.add('active');
        modal.style.display = 'flex'; // Force display in case CSS is broken
        document.body.style.overflow = 'hidden';
        
        console.log('Modal should now be visible');
        
        setTimeout(() => {
            const titleInput = document.getElementById('bookTitle');
            if (titleInput) titleInput.focus();
        }, 200);
    }

    openSearchModal() {
        console.log('openSearchModal called');
        
        const modal = document.getElementById('searchModal');
        if (!modal) {
            console.error('Search modal not found');
            return;
        }
        
        modal.classList.add('active');
        modal.style.display = 'flex'; // Force display in case CSS is broken
        document.body.style.overflow = 'hidden';
        
        console.log('Search modal should now be visible');
        
        setTimeout(() => {
            const searchInput = document.getElementById('onlineSearchInput');
            if (searchInput) {
                searchInput.focus();
                console.log('Search input focused');
            } else {
                console.error('onlineSearchInput element not found');
            }
        }, 200);
    }

    closeModal() {
        const modal = document.getElementById('bookModal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
            this.currentEditId = null;
        }
        
        const autocomplete = document.getElementById('titleAutocomplete');
        if (autocomplete) {
            autocomplete.classList.remove('active');
        }
    }

    closeSearchModal() {
        const modal = document.getElementById('searchModal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
        
        const searchInput = document.getElementById('onlineSearchInput');
        if (searchInput) {
            searchInput.value = '';
        }
        
        const results = document.getElementById('searchResults');
        if (results) {
            results.innerHTML = `
                <div class="search-results__empty">
                    <i class="fas fa-book-open"></i>
                    <p>Enter a search term to find books</p>
                </div>
            `;
        }
    }

    closeDeleteModal() {
        const modal = document.getElementById('deleteModal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    // Cover image preview
    updateCoverPreview(url) {
        const preview = document.getElementById('coverPreview');
        if (!preview) return;
        
        if (url) {
            preview.innerHTML = `<img src="${url}" alt="Cover preview" onerror="this.style.display='none';this.parentNode.classList.add('empty');this.parentNode.innerHTML='<i class=\\'fas fa-image\\'></i><br>Invalid URL';">`;
            preview.classList.remove('empty');
        } else {
            preview.innerHTML = `<i class="fas fa-image"></i><br>No image`;
            preview.classList.add('empty');
        }
    }

    // Form operations
    populateForm(book) {
        const fields = {
            'bookTitle': book.title,
            'bookAuthor': book.author,
            'bookSeries': book.series,
            'bookNumber': book.bookNumber,
            'bookPublisher': book.publisher,
            'bookPages': book.pageCount,
            'bookCover': book.coverImage,
            'readingStatus': book.status,
            'mythicalElement': book.mythicalElement,
            'trope': book.trope,
            'bookEdition': book.edition,
            'bookNotes': book.notes,
            'startedReading': book.startedReading,
            'finishedReading': book.finishedReading
        };

        Object.entries(fields).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element && value != null) {
                element.value = value;
            }
        });

        // Handle checkboxes
        const checkboxes = ['digitallySigned', 'signed', 'sprayedEdges', 'hiddenCover', 'reversibleDustJacket', 'bookGifted'];
        checkboxes.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                const key = id === 'bookGifted' ? 'gifted' : id;
                element.checked = book[key] || false;
            }
        });

        // Set rating
        if (book.rating) {
            this.setRating(book.rating);
        }

        // Update cover preview
        this.updateCoverPreview(book.coverImage);
    }

    async handleFormSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const bookData = {
            title: formData.get('title') || '',
            author: formData.get('author') || '',
            series: formData.get('series') || '',
            bookNumber: formData.get('bookNumber') ? parseInt(formData.get('bookNumber')) : null,
            status: formData.get('status') || 'want-to-read',
            rating: this.getCurrentRating(),
            mythicalElement: formData.get('mythicalElement') || '',
            trope: formData.get('trope') || '',
            publisher: formData.get('publisher') || '',
            pageCount: formData.get('pageCount') ? parseInt(formData.get('pageCount')) : null,
            coverImage: formData.get('coverImage') || '',
            edition: formData.get('edition') || '',
            digitallySigned: formData.has('digitallySigned'),
            signed: formData.has('signed'),
            sprayedEdges: formData.has('sprayedEdges'),
            hiddenCover: formData.has('hiddenCover'),
            reversibleDustJacket: formData.has('reversibleDustJacket'),
            startedReading: formData.get('startedReading') || '',
            finishedReading: formData.get('finishedReading') || '',
            gifted: formData.has('gifted'),
            notes: formData.get('notes') || ''
        };

        try {
            if (this.currentEditId) {
                await this.updateBook(this.currentEditId, bookData);
            } else {
                await this.addBook(bookData);
            }
            this.closeModal();
        } catch (error) {
            console.error('Form submission error:', error);
            this.showNotification('Error saving book. Please try again.', 'error');
        }
    }

    // Enhanced Book CRUD operations with API sync
    async addBook(bookData) {
        const book = {
            id: this.generateId(),
            ...bookData,
            dateAdded: new Date().toISOString()
        };

        this.books.unshift(book);
        await this.saveBooksToStorage();
        
        // Sync with server
        try {
            if (this.api.isOnline) {
                await this.api.createBook(book);
            }
        } catch (error) {
            console.error('Failed to sync new book with server:', error);
            this.showNotification('Book added locally. Will sync when online.', 'info');
        }

        this.renderBooks();
        this.updateStats();
        this.showNotification('Book added successfully!', 'success');
    }

    async updateBook(id, bookData) {
        const index = this.books.findIndex(book => book.id === id);
        if (index !== -1) {
            this.books[index] = { ...this.books[index], ...bookData };
            await this.saveBooksToStorage();
            
            // Sync with server
            try {
                if (this.api.isOnline) {
                    await this.api.updateBook(id, this.books[index]);
                }
            } catch (error) {
                console.error('Failed to sync updated book with server:', error);
                this.showNotification('Book updated locally. Will sync when online.', 'info');
            }

            this.renderBooks();
            this.updateStats();
            this.showNotification('Book updated successfully!', 'success');
        }
    }

    async deleteBook(id) {
        const index = this.books.findIndex(book => book.id === id);
        if (index !== -1) {
            this.books.splice(index, 1);
            await this.saveBooksToStorage();
            
            // Sync with server
            try {
                if (this.api.isOnline) {
                    await this.api.deleteBook(id);
                }
            } catch (error) {
                console.error('Failed to sync book deletion with server:', error);
                this.showNotification('Book deleted locally. Will sync when online.', 'info');
            }

            this.renderBooks();
            this.updateStats();
            this.showNotification('Book deleted successfully!', 'success');
        }
    }

    openDeleteModal(id) {
        const book = this.books.find(b => b.id === id);
        if (!book) return;

        const modal = document.getElementById('deleteModal');
        const titleSpan = document.getElementById('deleteBookTitle');
        
        if (modal && titleSpan) {
            titleSpan.textContent = book.title;
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
            
            // Store the ID for confirmation
            modal.dataset.bookId = id;
        }
    }

    async confirmDelete() {
        const modal = document.getElementById('deleteModal');
        if (!modal) return;
        
        const bookId = modal.dataset.bookId;
        if (bookId) {
            await this.deleteBook(bookId);
            this.closeDeleteModal();
        }
    }

    // Rating system
    setupRatingInputs() {
        const stars = document.querySelectorAll('#ratingStars .star');
        
        stars.forEach((star, index) => {
            const starNumber = index + 1;
            
            // Add click event for each star
            star.addEventListener('click', (e) => {
                const rect = star.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const starWidth = rect.width;
                
                // Determine if clicking left half (half star) or right half (full star)
                const rating = clickX < starWidth / 2 ? starNumber - 0.5 : starNumber;
                
                this.setRating(rating);
            });
            
            // Add hover effect for visual feedback
            star.addEventListener('mousemove', (e) => {
                const rect = star.getBoundingClientRect();
                const hoverX = e.clientX - rect.left;
                const starWidth = rect.width;
                
                // Show preview of what would be selected
                const rating = hoverX < starWidth / 2 ? starNumber - 0.5 : starNumber;
                this.highlightStars(rating);
            });
        });

        // Reset to current rating when mouse leaves the rating area
        const container = document.querySelector('#ratingStars');
        if (container) {
            container.addEventListener('mouseleave', () => {
                const currentRating = parseFloat(document.getElementById('bookRating').value) || 0;
                this.highlightStars(currentRating);
            });
        }
    }

    getCurrentRating() {
        const hiddenInput = document.getElementById('bookRating');
        return hiddenInput ? parseFloat(hiddenInput.value) || 0 : 0;
    }

    setRating(rating) {
        const hiddenInput = document.getElementById('bookRating');
        if (hiddenInput) {
            hiddenInput.value = rating;
        }
        
        this.highlightStars(rating);
        this.updateRatingDisplay();
    }

    highlightStars(rating) {
        const stars = document.querySelectorAll('#ratingStars .star');
        stars.forEach((star, index) => {
            const starNumber = index + 1;
            star.classList.remove('active', 'half');
            
            if (starNumber <= Math.floor(rating)) {
                // Full star
                star.classList.add('active');
            } else if (starNumber === Math.floor(rating) + 1 && rating % 1 !== 0) {
                // Half star
                star.classList.add('half');
            }
        });
    }

    resetRatings() {
        this.setRating(0);
    }

    updateRatingDisplay() {
        const rating = this.getCurrentRating();
        const ratingText = document.getElementById('ratingText');
        
        if (ratingText) {
            if (rating === 0) {
                ratingText.textContent = 'No rating';
            } else {
                ratingText.textContent = `${rating} star${rating !== 1 ? 's' : ''}`;
            }
        }
    }

    // Enhanced render functions
    renderBooks() {
        console.log('renderBooks called, currentView:', this.currentView);
        const container = document.getElementById('booksContainer');
        const emptyState = document.getElementById('emptyState');
        
        if (!container || !emptyState) {
            console.error('Container or empty state element not found');
            return;
        }

        // Apply current filters and sorting
        this.applyFilters();
        this.applySorting();

        console.log('Filtered books count:', this.filteredBooks.length);

        if (this.filteredBooks.length === 0) {
            container.style.display = 'none';
            emptyState.style.display = 'flex';
            return;
        }

        container.style.display = 'block';
        emptyState.style.display = 'none';

        if (this.currentView === 'grid') {
            console.log('Rendering grid view');
            this.renderGridView(container);
        } else {
            console.log('Rendering list view');
            this.renderListView(container);
        }
        
        console.log('Final container className:', container.className);
    }

    renderGridView(container) {
        console.log('Rendering grid view...');
        container.className = 'books-container';
        
        // Force responsive grid properties
        this.applyResponsiveGrid(container);
        
        container.innerHTML = this.filteredBooks.map(book => {
            const physicalFeatures = this.getPhysicalFeatures(book);
            const specialEdition = this.isSpecialEdition(book);
            
            return `
            <div class="book-card" data-id="${book.id}">
                <div class="book-card__header">
                    <div class="book-card__info">
                        <div class="book-card__cover">
                            ${book.coverImage ? 
                                `<img src="${book.coverImage}" alt="${this.escapeHtml(book.title)}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
                                 <div class="book-card__no-cover" style="display: none;"><i class="fas fa-book"></i></div>` :
                                `<div class="book-card__no-cover"><i class="fas fa-book"></i></div>`
                            }
                        </div>
                        <div class="book-card__details">
                            <h3 class="book-card__title ${specialEdition ? 'book-card__special-edition' : ''}">${this.escapeHtml(book.title)}</h3>
                            <p class="book-card__author">by ${this.escapeHtml(book.author)}</p>
                            ${book.series ? `<p class="book-card__series"><i class="fas fa-layer-group"></i>${this.escapeHtml(book.series)}${book.bookNumber ? ` #${book.bookNumber}` : ''}</p>` : ''}
                        </div>
                    </div>
                    <div class="book-card__actions">
                        <button class="btn btn--small btn--primary" onclick="bookTracker.openModal(bookTracker.books.find(b => b.id === '${book.id}'))">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn btn--small btn--danger" onclick="bookTracker.openDeleteModal('${book.id}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
                <div class="book-card__body">
                    <div class="book-card__meta">
                        <div class="book-card__meta-item">
                            <span class="book-card__meta-label">Rating</span>
                            <div class="book-card__meta-value">
                                ${this.renderStarRating(book.rating)}
                            </div>
                        </div>
                        ${book.mythicalElement ? `
                        <div class="book-card__meta-item">
                            <span class="book-card__meta-label">Genre</span>
                            <span class="book-card__meta-value">${this.escapeHtml(book.mythicalElement)}</span>
                        </div>
                        ` : ''}
                        ${book.trope ? `
                        <div class="book-card__meta-item">
                            <span class="book-card__meta-label">Trope</span>
                            <span class="book-card__meta-value">${this.escapeHtml(book.trope)}</span>
                        </div>
                        ` : ''}
                        ${book.pageCount ? `
                        <div class="book-card__meta-item">
                            <span class="book-card__meta-label">Pages</span>
                            <span class="book-card__meta-value">${book.pageCount}</span>
                        </div>
                        ` : ''}
                        ${book.publisher ? `
                        <div class="book-card__meta-item">
                            <span class="book-card__meta-label">Publisher</span>
                            <span class="book-card__meta-value">${this.escapeHtml(book.publisher)}</span>
                        </div>
                        ` : ''}
                    </div>
                    ${physicalFeatures.length > 0 ? `
                        <div class="book-card__physical-features">
                            ${physicalFeatures.map(feature => `
                                <span class="book-card__feature ${feature.special ? 'book-card__feature--special' : ''}">
                                    <i class="${feature.icon}"></i>
                                    ${feature.name}
                                </span>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
                <div class="book-card__footer">
                    <div class="book-card__status status--${book.status}">
                        ${this.getStatusLabel(book.status)}
                    </div>
                    ${book.gifted ? `<div class="book-card__gifted"><i class="fas fa-gift"></i> Gift</div>` : ''}
                </div>
            </div>
        `;
        }).join('');
    }

    renderListView(container) {
        console.log('Rendering list view...');
        container.className = 'books-container list-view';
        
        // Force list properties
        container.style.display = 'grid';
        container.style.gridTemplateColumns = '1fr';
        container.style.gap = '1rem';
        
        container.innerHTML = this.filteredBooks.map(book => {
            const physicalFeatures = this.getPhysicalFeatures(book);
            const specialEdition = this.isSpecialEdition(book);
            
            return `
            <div class="book-card" data-id="${book.id}">
                <div class="book-card__header">
                    <div class="book-card__info">
                        <div class="book-card__cover">
                            ${book.coverImage ? 
                                `<img src="${book.coverImage}" alt="${this.escapeHtml(book.title)}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
                                 <div class="book-card__no-cover" style="display: none;"><i class="fas fa-book"></i></div>` :
                                `<div class="book-card__no-cover"><i class="fas fa-book"></i></div>`
                            }
                        </div>
                        <div class="book-card__details">
                            <h3 class="book-card__title ${specialEdition ? 'book-card__special-edition' : ''}">${this.escapeHtml(book.title)}</h3>
                            <p class="book-card__author">by ${this.escapeHtml(book.author)}</p>
                            ${book.series ? `<p class="book-card__series"><i class="fas fa-layer-group"></i>${this.escapeHtml(book.series)}${book.bookNumber ? ` #${book.bookNumber}` : ''}</p>` : ''}
                        </div>
                    </div>
                    <div class="book-card__actions">
                        <button class="btn btn--small btn--primary" onclick="bookTracker.openModal(bookTracker.books.find(b => b.id === '${book.id}'))">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn btn--small btn--danger" onclick="bookTracker.openDeleteModal('${book.id}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
                <div class="book-card__body">
                    <div class="book-card__meta">
                        <div class="book-card__meta-item">
                            <span class="book-card__meta-label">Rating</span>
                            <div class="book-card__meta-value">
                                ${this.renderStarRating(book.rating)}
                            </div>
                        </div>
                        <div class="book-card__meta-item">
                            <span class="book-card__meta-label">Status</span>
                            <div class="book-card__meta-value">
                                <span class="book-card__status status--${book.status}">
                                    ${this.getStatusLabel(book.status)}
                                </span>
                            </div>
                        </div>
                        ${book.mythicalElement ? `
                        <div class="book-card__meta-item">
                            <span class="book-card__meta-label">Genre</span>
                            <span class="book-card__meta-value">${this.escapeHtml(book.mythicalElement)}</span>
                        </div>
                        ` : ''}
                        ${book.trope ? `
                        <div class="book-card__meta-item">
                            <span class="book-card__meta-label">Trope</span>
                            <span class="book-card__meta-value">${this.escapeHtml(book.trope)}</span>
                        </div>
                        ` : ''}
                        ${book.pageCount ? `
                        <div class="book-card__meta-item">
                            <span class="book-card__meta-label">Pages</span>
                            <span class="book-card__meta-value">${book.pageCount}</span>
                        </div>
                        ` : ''}
                        ${book.publisher ? `
                        <div class="book-card__meta-item">
                            <span class="book-card__meta-label">Publisher</span>
                            <span class="book-card__meta-value">${this.escapeHtml(book.publisher)}</span>
                        </div>
                        ` : ''}
                        ${book.finishedReading ? `
                        <div class="book-card__meta-item">
                            <span class="book-card__meta-label">Read Date</span>
                            <span class="book-card__meta-value">${new Date(book.finishedReading).toLocaleDateString()}</span>
                        </div>
                        ` : ''}
                    </div>
                    ${physicalFeatures.length > 0 ? `
                        <div class="book-card__physical-features">
                            ${physicalFeatures.map(feature => `
                                <span class="book-card__feature ${feature.special ? 'book-card__feature--special' : ''}">
                                    <i class="${feature.icon}"></i>
                                    ${feature.name}
                                </span>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
                <div class="book-card__footer">
                    ${book.gifted ? `<div class="book-card__gifted"><i class="fas fa-gift"></i> Gift</div>` : ''}
                    ${book.notes ? `<div class="book-card__notes"><i class="fas fa-sticky-note"></i> Has notes</div>` : ''}
                </div>
            </div>
        `;
        }).join('');
    }

    renderStarRating(rating) {
        if (!rating || rating === 0) {
            return '<span class="no-rating">No rating</span>';
        }
        
        let stars = '';
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;
        
        // Add full stars
        for (let i = 1; i <= fullStars; i++) {
            stars += '<i class="fas fa-star star-filled"></i>';
        }
        
        // Add half star if needed
        if (hasHalfStar) {
            stars += '<i class="fas fa-star-half-alt star-half"></i>';
        }
        
        // Add empty stars to complete 5 stars
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
        for (let i = 1; i <= emptyStars; i++) {
            stars += '<i class="far fa-star star-empty"></i>';
        }
        
        return `<span class="star-rating" title="${rating} stars">${stars}</span>`;
    }


    
    // Helper methods for physical features
    getPhysicalFeatures(book) {
        const features = [];
        
        if (book.digitallySigned) features.push({ name: 'Digitally Signed', icon: 'fas fa-signature', special: true });
        if (book.signed) features.push({ name: 'Signed', icon: 'fas fa-pen-fancy', special: true });
        if (book.sprayedEdges) features.push({ name: 'Sprayed Edges', icon: 'fas fa-paint-brush', special: false });
        if (book.hiddenCover) features.push({ name: 'Hidden Cover', icon: 'fas fa-eye-slash', special: false });
        if (book.reversibleDustJacket) features.push({ name: 'Reversible Dust Jacket', icon: 'fas fa-sync-alt', special: false });
        
        return features;
    }

    isSpecialEdition(book) {
        return book.digitallySigned || book.signed || book.sprayedEdges || book.hiddenCover || book.reversibleDustJacket;
    }

        getStatusLabel(status) {
        const labels = {
            'want-to-read': 'Want to Read',
            'currently-reading': 'Currently Reading', 
            'read': 'Read',
            'dnf': 'DNF'
        };
        return labels[status] || status;
    }

    updateStats() {
        const total = this.books.length;
        const read = this.books.filter(book => book.status === 'read').length;
        const currentlyReading = this.books.filter(book => book.status === 'currently-reading').length;
        const wantToRead = this.books.filter(book => book.status === 'want-to-read').length;
        const dnf = this.books.filter(book => book.status === 'dnf').length;

        const elements = {
            'totalBooks': total,
            'readBooks': read,
            'currentlyReading': currentlyReading,
            'wantToRead': wantToRead,
            'dnfBooks': dnf
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        });
    }

    // Search and filter functions
    handleSearch() {
        this.renderBooks();
    }

    clearSearch() {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.value = '';
            this.renderBooks();
        }
    }

    applyFilters() {
        const searchInput = document.getElementById('searchInput');
        const statusFilter = document.getElementById('statusFilter')?.value;
        const genreFilter = document.getElementById('genreFilter')?.value;
        const tropeFilter = document.getElementById('tropeFilter')?.value;
        
        const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
        
        this.filteredBooks = this.books.filter(book => {
            // Search match
            const searchMatch = !query || (
                book.title.toLowerCase().includes(query) ||
                book.author.toLowerCase().includes(query) ||
                book.series?.toLowerCase().includes(query) ||
                book.publisher?.toLowerCase().includes(query)
            );
            
            // Filter matches
            const statusMatch = !statusFilter || book.status === statusFilter;
            const genreMatch = !genreFilter || book.mythicalElement === genreFilter;
            const tropeMatch = !tropeFilter || book.trope === tropeFilter;
            
            return searchMatch && statusMatch && genreMatch && tropeMatch;
        });
    }

    applySorting() {
        const sortBy = document.getElementById('sortBy')?.value || 'title';
        
        this.filteredBooks.sort((a, b) => {
            switch (sortBy) {
                case 'title':
                    return a.title.localeCompare(b.title);
                case 'author':
                    return a.author.localeCompare(b.author);
                case 'series':
                    if (!a.series && !b.series) return 0;
                    if (!a.series) return 1;
                    if (!b.series) return -1;
                    return a.series.localeCompare(b.series);
                case 'rating':
                    return (b.rating || 0) - (a.rating || 0);
                case 'dateAdded':
                    return new Date(b.dateAdded) - new Date(a.dateAdded);
                case 'dateRead':
                    if (!a.finishedReading && !b.finishedReading) return 0;
                    if (!a.finishedReading) return 1;
                    if (!b.finishedReading) return -1;
                    return new Date(b.finishedReading) - new Date(a.finishedReading);
                default:
                    return 0;
            }
        });
    }

    toggleView(view) {
        console.log('toggleView called with:', view);
        this.currentView = view;
        
        const gridBtn = document.getElementById('gridView');
        const listBtn = document.getElementById('listView');
        const container = document.getElementById('booksContainer');
        
        if (gridBtn && listBtn) {
            gridBtn.classList.toggle('active', view === 'grid');
            listBtn.classList.toggle('active', view === 'list');
            console.log('Button states updated:', {
                gridActive: gridBtn.classList.contains('active'),
                listActive: listBtn.classList.contains('active')
            });
        }
        
        if (container) {
            console.log('Container class before:', container.className);
            console.log('Current view:', this.currentView);
        }
        
        this.renderBooks();
        
        if (container) {
            console.log('Container class after:', container.className);
        }
    }

    // Force grid layout to ensure proper styling
    forceGridLayout() {
        const container = document.getElementById('booksContainer');
        if (container) {
            console.log('🔧 Forcing grid layout...');
            container.className = 'books-container';
            this.applyResponsiveGrid(container);
            console.log('✅ Grid layout forced with responsive columns');
        }
    }

    // Apply responsive grid properties
    applyResponsiveGrid(container) {
        container.style.display = 'grid';
        
        // Set responsive grid columns based on screen size
        const width = window.innerWidth;
        if (width >= 1025) {
            container.style.gridTemplateColumns = 'repeat(3, 1fr)';
            container.style.gap = '1.5rem';
        } else if (width >= 769) {
            container.style.gridTemplateColumns = 'repeat(2, 1fr)';
            container.style.gap = '1rem';
        } else {
            container.style.gridTemplateColumns = '1fr';
            container.style.gap = '1rem';
        }
    }

    // Import/Export functions
    importBooks() {
        const fileInput = document.getElementById('fileInput');
        if (fileInput) fileInput.click();
    }

    async handleFileImport(e) {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const text = await file.text();
            const importedBooks = JSON.parse(text);
            
            if (!Array.isArray(importedBooks)) {
                throw new Error('Invalid file format');
            }

            // Add imported books to current collection
            importedBooks.forEach(book => {
                if (!this.books.find(b => b.id === book.id)) {
                    this.books.push({
                        ...book,
                        id: book.id || this.generateId(),
                        dateAdded: book.dateAdded || new Date().toISOString()
                    });
                }
            });

            await this.saveBooksToStorage();
            this.renderBooks();
            this.updateStats();
            this.showNotification(`Imported ${importedBooks.length} books successfully!`, 'success');
        } catch (error) {
            console.error('Import error:', error);
            this.showNotification('Error importing books. Please check the file format.', 'error');
        }

        // Reset file input
        e.target.value = '';
    }

    exportBooks() {
        try {
            const dataStr = JSON.stringify(this.books, null, 2);
            const dataBlob = new Blob([dataStr], {type: 'application/json'});
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `booktracker-export-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            
            this.showNotification('Books exported successfully!', 'success');
        } catch (error) {
            console.error('Export error:', error);
            this.showNotification('Error exporting books.', 'error');
        }
    }

    // Utility functions
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification--${type}`;
        notification.innerHTML = `
            <div class="notification__content">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
                <span>${message}</span>
            </div>
        `;

        // Add styles if not present
        if (!document.querySelector('#notification-styles')) {
            const styles = document.createElement('style');
            styles.id = 'notification-styles';
            styles.textContent = `
                .notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 10000;
                    padding: 16px 20px;
                    border-radius: 8px;
                    background: white;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                    transform: translateX(400px);
                    transition: transform 0.3s ease-in-out;
                }
                
                .notification.show {
                    transform: translateX(0);
                }
                
                .notification--success {
                    border-left: 4px solid var(--success-color, #22c55e);
                }
                
                .notification--error {
                    border-left: 4px solid var(--danger-color, #ef4444);
                }
                
                .notification--info {
                    border-left: 4px solid var(--primary-color, #3b82f6);
                }
                
                .notification__content {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 14px;
                }
                
                .notification__content i {
                    color: ${type === 'success' ? 'var(--success-color, #22c55e)' : type === 'error' ? 'var(--danger-color, #ef4444)' : 'var(--primary-color, #3b82f6)'};
                }
            `;
            document.head.appendChild(styles);
        }

        document.body.appendChild(notification);

        setTimeout(() => notification.classList.add('show'), 100);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    handleKeyboardShortcuts(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            const searchInput = document.getElementById('searchInput');
            if (searchInput) searchInput.focus();
        }
        
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            this.openModal();
        }
        
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
            e.preventDefault();
            this.openSearchModal();
        }
        
        if (e.key === 'Escape') {
            this.closeModal();
            this.closeDeleteModal();
            this.closeSearchModal();
            const autocomplete = document.getElementById('titleAutocomplete');
            if (autocomplete) autocomplete.classList.remove('active');
        }
    }
}

// Initialize the app when DOM is loaded
function initializeBookTracker() {
    console.log('DOM Content Loaded - Initializing BookTracker...');
    console.log('Document ready state:', document.readyState);
    
    // Double-check that essential elements exist
    const essentialElements = ['addBookBtn', 'searchBooksBtn', 'bookModal', 'searchModal'];
    const missingElements = essentialElements.filter(id => !document.getElementById(id));
    
    if (missingElements.length > 0) {
        console.error('Missing essential elements:', missingElements);
        console.log('Available elements with IDs:', Array.from(document.querySelectorAll('[id]')).map(el => el.id));
    }
    
    try {
        window.bookTracker = new BookTracker();
        console.log('BookTracker instance created successfully');
        
        // Test modal functionality immediately
        setTimeout(() => {
            console.log('Testing modal accessibility...');
            const addBtn = document.getElementById('addBookBtn');
            const searchBtn = document.getElementById('searchBooksBtn');
            console.log('Add button found:', !!addBtn);
            console.log('Search button found:', !!searchBtn);
        }, 1000);
        
    } catch (error) {
        console.error('Failed to initialize BookTracker:', error);
    }
}

// Multiple initialization strategies
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeBookTracker);
} else {
    // DOM is already loaded
    console.log('DOM already loaded, initializing immediately');
    initializeBookTracker();
}

// Fallback initialization
window.addEventListener('load', () => {
    if (!window.bookTracker) {
        console.log('Fallback initialization triggered');
        initializeBookTracker();
    }
});

console.log("About to define testBookTracker...");
// Global test functions for debugging
try {
    window.testBookTracker = {
        openAddModal: () => {
            console.log('Testing Add Book modal...');
            if (window.bookTracker) {
                window.bookTracker.openModal();
            } else {
                console.error('BookTracker not initialized');
            }
        },
        
        openSearchModal: () => {
            console.log('Testing Search modal...');
            if (window.bookTracker) {
                window.bookTracker.openSearchModal();
            } else {
                console.error('BookTracker not initialized');
            }
        },
        
        testGoogleBooks: async (query = 'harry potter') => {
            console.log('Testing Google Books API with query:', query);
            if (window.bookTracker) {
                try {
                    const books = await window.bookTracker.searchGoogleBooks(query);
                    console.log('Found books:', books);
                    return books;
                } catch (error) {
                    console.error('Google Books API error:', error);
                }
            } else {
                console.error('BookTracker not initialized');
            }
        },
        
        testGrid: () => {
            console.log('🧪 Manual Grid Test');
            if (window.bookTracker) {
                console.log('Current view:', window.bookTracker.currentView);
                console.log('Books count:', window.bookTracker.books.length);
                
                // Force grid view
                window.bookTracker.currentView = 'grid';
                window.bookTracker.renderBooks();
                
                const container = document.getElementById('booksContainer');
                if (container) {
                    console.log('Container class after force grid:', container.className);
                    console.log('Container computed styles:', {
                        display: getComputedStyle(container).display,
                        gridTemplateColumns: getComputedStyle(container).gridTemplateColumns,
                        gap: getComputedStyle(container).gap
                    });
                }
                
                // Update button states
                const gridBtn = document.getElementById('gridView');
                const listBtn = document.getElementById('listView');
                if (gridBtn) gridBtn.classList.add('active');
                if (listBtn) listBtn.classList.remove('active');
                
                console.log('✅ Grid test completed');
            } else {
                console.error('BookTracker not available');
            }
        },
        
        forceGridLayout: () => {
            console.log('🔧 Forcing grid layout...');
            if (window.bookTracker) {
                window.bookTracker.forceGridLayout();
            } else {
                const container = document.getElementById('booksContainer');
                if (container) {
                    container.className = 'books-container';
                    container.style.display = 'grid';
                    container.style.gridTemplateColumns = 'repeat(3, 1fr)';
                    container.style.gap = '1.5rem';
                    console.log('✅ Grid layout forced via CSS (fallback)');
                }
            }
        },
        
        forceModalVisible: (modalId) => {
            console.log('Forcing modal visible:', modalId);
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.style.display = 'flex !important';
                modal.style.position = 'fixed';
                modal.style.top = '0';
                modal.style.left = '0';
                modal.style.width = '100vw';
                modal.style.height = '100vh';
                modal.style.zIndex = '10000';
                modal.style.background = 'rgba(0,0,0,0.8)';
                modal.classList.add('active');
                console.log('Modal should now be visible');
            } else {
                console.error('Modal not found:', modalId);
            }
        },
        
        checkElements: () => {
            const elements = ['addBookBtn', 'searchBooksBtn', 'bookModal', 'searchModal', 'bookForm', 'onlineSearchInput', 'bookTitle', 'titleAutocomplete'];
            console.log('Checking elements:');
            elements.forEach(id => {
                const element = document.getElementById(id);
                console.log(`${id}:`, element ? '✓ Found' : '✗ Missing');
            });
        },
        
        testAutocomplete: async (query = 'harry potter') => {
            console.log('Testing autocomplete with query:', query);
            if (window.bookTracker) {
                try {
                    // Open modal first
                    window.bookTracker.openModal();
                    
                    // Wait for modal to open
                    setTimeout(() => {
                        const titleInput = document.getElementById('bookTitle');
                        if (titleInput) {
                            titleInput.value = query;
                            titleInput.dispatchEvent(new Event('input'));
                            console.log('Autocomplete test triggered');
                        } else {
                            console.error('Title input not found');
                        }
                    }, 500);
                    
                } catch (error) {
                    console.error('Autocomplete test error:', error);
                }
            } else {
                console.error('BookTracker not initialized');
            }
        }
    };
    
    console.log('✅ testBookTracker object created successfully');
    
} catch (error) {
    console.error('❌ Failed to create testBookTracker:', error);
}

console.log('🚀 BookTracker script starting...');

console.log('BookTracker test functions available. Try:');
console.log('testBookTracker.openAddModal()');
console.log('testBookTracker.openSearchModal()');
console.log('testBookTracker.testGoogleBooks()');
console.log('testBookTracker.forceModalVisible("bookModal")');
console.log('testBookTracker.checkElements()');

// Verify testBookTracker is properly defined
setTimeout(() => {
    if (typeof window.testBookTracker !== 'undefined') {
        console.log('✅ testBookTracker is properly defined and available');
        console.log('Available methods:', Object.keys(window.testBookTracker));
    } else {
        console.error('❌ testBookTracker is not defined - there may be a script error');
        console.log('Window object keys containing "test":', Object.keys(window).filter(k => k.includes('test')));
    }
}, 1000);
// IP Address Compatibility Fix - Global fallback functions
console.log('Adding IP address compatibility...');

// Ensure global functions are available for onclick handlers when accessing via IP
window.selectAutocompleteResult = window.selectAutocompleteResult || function(googleId) {
    console.log('Global selectAutocompleteResult called with:', googleId);
    if (window.bookTracker && typeof window.bookTracker.selectAutocompleteResult === 'function') {
        return window.bookTracker.selectAutocompleteResult(googleId);
    } else {
        console.error('BookTracker.selectAutocompleteResult not available');
    }
};

window.selectSearchResult = window.selectSearchResult || function(googleId) {
    console.log('Global selectSearchResult called with:', googleId);
    if (window.bookTracker && typeof window.bookTracker.selectSearchResult === 'function') {
        return window.bookTracker.selectSearchResult(googleId);
    } else {
        console.error('BookTracker.selectSearchResult not available');
    }
};

console.log('✅ IP address compatibility functions added');
