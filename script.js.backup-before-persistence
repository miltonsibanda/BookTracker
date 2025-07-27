// BookTracker App - Enhanced JavaScript with Google Books API and Half-Star Ratings
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
        
        this.init();
    }

    init() {
        this.loadBooksFromStorage();
        this.bindEvents();
        this.setupTabNavigation();
        this.setupRatingInputs();
        this.setupAutocomplete();
        this.renderBooks();
        this.updateStats();
        this.setupInitialData();
    }

    // Setup initial data
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
                    startedReading: "",
                    finishedReading: "",
                    gifted: false,
                    notes: "",
                    dateAdded: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    title: "The Cruel Prince",
                    author: "Holly Black",
                    series: "Folk of the Air",
                    bookNumber: 1,
                    status: "read",
                    rating: 4.5,
                    mythicalElement: "fae",
                    publisher: "Little, Brown Books for Young Readers",
                    pageCount: 370,
                    coverImage: "",
                    edition: "Hardcover",
                    digitallySigned: false,
                    signed: false,
                    sprayedEdges: true,
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
        // Modal controls
        document.getElementById('addBookBtn').addEventListener('click', () => this.openModal());
        document.getElementById('addFirstBook').addEventListener('click', () => this.openModal());
        document.getElementById('closeModal').addEventListener('click', () => this.closeModal());
        document.getElementById('cancelBtn').addEventListener('click', () => this.closeModal());
        document.getElementById('bookForm').addEventListener('submit', (e) => this.handleFormSubmit(e));

        // Search books online
        document.getElementById('searchBooksBtn').addEventListener('click', () => this.openSearchModal());
        document.getElementById('closeSearchModal').addEventListener('click', () => this.closeSearchModal());
        document.getElementById('performSearch').addEventListener('click', () => this.performOnlineSearch());
        document.getElementById('onlineSearchInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.performOnlineSearch();
        });

        // Delete modal
        document.getElementById('closeDeleteModal').addEventListener('click', () => this.closeDeleteModal());
        document.getElementById('cancelDeleteBtn').addEventListener('click', () => this.closeDeleteModal());
        document.getElementById('confirmDeleteBtn').addEventListener('click', () => this.confirmDelete());

        // Search and filters
        document.getElementById('searchInput').addEventListener('input', () => this.handleSearch());
        document.getElementById('clearSearch').addEventListener('click', () => this.clearSearch());
        document.getElementById('statusFilter').addEventListener('change', () => this.applyFilters());
        document.getElementById('genreFilter').addEventListener('change', () => this.applyFilters());
        document.getElementById('sortBy').addEventListener('change', () => this.applySorting());

        // View toggle
        document.getElementById('gridView').addEventListener('click', () => this.toggleView('grid'));
        document.getElementById('listView').addEventListener('click', () => this.toggleView('list'));

        // Import/Export
        document.getElementById('importBtn').addEventListener('click', () => this.importBooks());
        document.getElementById('exportBtn').addEventListener('click', () => this.exportBooks());
        document.getElementById('fileInput').addEventListener('change', (e) => this.handleFileImport(e));

        // Cover image preview
        document.getElementById('bookCover').addEventListener('input', (e) => this.updateCoverPreview(e.target.value));

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
        const query = document.getElementById('onlineSearchInput').value.trim();
        if (!query) return;

        const loading = document.getElementById('searchLoading');
        const results = document.getElementById('searchResults');

        loading.classList.add('active');
        results.innerHTML = '';

        try {
            const books = await this.searchGoogleBooks(query);
            this.displaySearchResults(books);
        } catch (error) {
            console.error('Search error:', error);
            this.showNotification('Error searching books. Please try again.', 'error');
        } finally {
            loading.classList.remove('active');
        }
    }

    async searchGoogleBooks(query) {
        // Check cache first
        if (this.searchCache.has(query)) {
            return this.searchCache.get(query);
        }

        const apiKey = this.googleBooksApiKey ? `&key=${this.googleBooksApiKey}` : '';
        const url = `${this.googleBooksBaseUrl}?q=${encodeURIComponent(query)}&maxResults=20${apiKey}`;

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Failed to search books');
        }

        const data = await response.json();
        const books = data.items ? data.items.map(item => this.formatGoogleBookResult(item)) : [];
        
        // Cache results
        this.searchCache.set(query, books);
        
        return books;
    }

    formatGoogleBookResult(item) {
        const volumeInfo = item.volumeInfo || {};
        const imageLinks = volumeInfo.imageLinks || {};
        
        return {
            googleId: item.id,
            title: volumeInfo.title || 'Unknown Title',
            authors: volumeInfo.authors || ['Unknown Author'],
            author: (volumeInfo.authors || ['Unknown Author']).join(', '),
            publisher: volumeInfo.publisher || '',
            publishedDate: volumeInfo.publishedDate || '',
            pageCount: volumeInfo.pageCount || null,
            description: volumeInfo.description || '',
            categories: volumeInfo.categories || [],
            averageRating: volumeInfo.averageRating || 0,
            thumbnail: imageLinks.thumbnail || imageLinks.smallThumbnail || '',
            coverImage: imageLinks.large || imageLinks.medium || imageLinks.thumbnail || imageLinks.smallThumbnail || '',
            industryIdentifiers: volumeInfo.industryIdentifiers || []
        };
    }

    displaySearchResults(books) {
        const container = document.getElementById('searchResults');
        
        if (books.length === 0) {
            container.innerHTML = `
                <div class="search-results__empty">
                    <i class="fas fa-search"></i>
                    <p>No books found. Try a different search term.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = books.map(book => `
            <div class="search-result-item" onclick="bookTracker.selectSearchResult('${book.googleId}')">
                <div class="search-result-cover">
                    ${book.thumbnail ? 
                        `<img src="${book.thumbnail}" alt="${book.title}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
                         <div class="search-result-cover-placeholder" style="display:none;"><i class="fas fa-book"></i></div>` :
                        `<div class="search-result-cover-placeholder"><i class="fas fa-book"></i></div>`
                    }
                </div>
                <div class="search-result-info">
                    <div class="search-result-title">${this.escapeHtml(book.title)}</div>
                    <div class="search-result-author">by ${this.escapeHtml(book.author)}</div>
                    <div class="search-result-meta">
                        ${book.publisher ? `<span>Publisher: ${this.escapeHtml(book.publisher)}</span>` : ''}
                        ${book.publishedDate ? `<span>Published: ${book.publishedDate}</span>` : ''}
                        ${book.pageCount ? `<span>Pages: ${book.pageCount}</span>` : ''}
                        ${book.averageRating ? `<span>Rating: ${book.averageRating}/5</span>` : ''}
                    </div>
                </div>
            </div>
        `).join('');
    }

    selectSearchResult(googleId) {
        // Find the book data
        const book = Array.from(this.searchCache.values())
            .flat()
            .find(b => b.googleId === googleId);
        
        if (book) {
            this.closeSearchModal();
            this.openModal(null, book);
        }
    }

    // Autocomplete for title field
    setupAutocomplete() {
        const titleInput = document.getElementById('bookTitle');
        const autocompleteContainer = document.getElementById('titleAutocomplete');
        let debounceTimer;

        titleInput.addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                this.performAutocomplete(e.target.value, autocompleteContainer);
            }, 300);
        });

        titleInput.addEventListener('focus', () => {
            if (titleInput.value.length > 2) {
                this.performAutocomplete(titleInput.value, autocompleteContainer);
            }
        });

        document.addEventListener('click', (e) => {
            if (!titleInput.contains(e.target) && !autocompleteContainer.contains(e.target)) {
                autocompleteContainer.classList.remove('active');
            }
        });
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

        container.innerHTML = books.map(book => `
            <div class="autocomplete-item" onclick="bookTracker.selectAutocompleteResult('${book.googleId}')">
                <strong>${this.escapeHtml(book.title)}</strong><br>
                <small>by ${this.escapeHtml(book.author)}</small>
            </div>
        `).join('');

        container.classList.add('active');
    }

    selectAutocompleteResult(googleId) {
        const book = Array.from(this.searchCache.values())
            .flat()
            .find(b => b.googleId === googleId);
        
        if (book) {
            this.populateFormFromGoogleBook(book);
            document.getElementById('titleAutocomplete').classList.remove('active');
        }
    }

    populateFormFromGoogleBook(book) {
        document.getElementById('bookTitle').value = book.title;
        document.getElementById('bookAuthor').value = book.author;
        document.getElementById('bookPublisher').value = book.publisher;
        if (book.pageCount) document.getElementById('bookPages').value = book.pageCount;
        if (book.coverImage) {
            document.getElementById('bookCover').value = book.coverImage;
            this.updateCoverPreview(book.coverImage);
        }
        if (book.description) document.getElementById('bookNotes').value = book.description.substring(0, 200) + '...';
    }

    // Generate unique ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Local Storage operations
    saveBooksToStorage() {
        try {
            localStorage.setItem('bookTracker_books', JSON.stringify(this.books));
        } catch (error) {
            console.error('Error saving books to localStorage:', error);
        }
    }

    loadBooksFromStorage() {
        try {
            const stored = localStorage.getItem('bookTracker_books');
            if (stored) {
                this.books = JSON.parse(stored);
            }
        } catch (error) {
            console.error('Error loading books from localStorage:', error);
            this.books = [];
        }
    }

    // Modal operations
    openModal(book = null, googleBook = null) {
        const modal = document.getElementById('bookModal');
        const form = document.getElementById('bookForm');
        const title = document.getElementById('modalTitle');

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
        document.querySelector('.tab-button.active').classList.remove('active');
        document.querySelector('.tab-content.active').classList.remove('active');
        document.querySelector('[data-tab="basic"].tab-button').classList.add('active');
        document.querySelector('[data-tab="basic"].tab-content').classList.add('active');

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        setTimeout(() => {
            document.getElementById('bookTitle').focus();
        }, 200);
    }

    openSearchModal() {
        const modal = document.getElementById('searchModal');
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        setTimeout(() => {
            document.getElementById('onlineSearchInput').focus();
        }, 200);
    }

    closeModal() {
        const modal = document.getElementById('bookModal');
        modal.classList.remove('active');
        document.body.style.overflow = '';
        this.currentEditId = null;
        document.getElementById('titleAutocomplete').classList.remove('active');
    }

    closeSearchModal() {
        const modal = document.getElementById('searchModal');
        modal.classList.remove('active');
        document.body.style.overflow = '';
        document.getElementById('onlineSearchInput').value = '';
        document.getElementById('searchResults').innerHTML = `
            <div class="search-results__empty">
                <i class="fas fa-book-open"></i>
                <p>Enter a search term to find books</p>
            </div>
        `;
    }

    closeDeleteModal() {
        const modal = document.getElementById('deleteModal');
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }

    // Cover image preview
    updateCoverPreview(url) {
        const preview = document.getElementById('coverPreview');
        
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
        document.getElementById('bookTitle').value = book.title || '';
        document.getElementById('bookAuthor').value = book.author || '';
        document.getElementById('bookSeries').value = book.series || '';
        document.getElementById('bookNumber').value = book.bookNumber || '';
        document.getElementById('bookPublisher').value = book.publisher || '';
        document.getElementById('bookPages').value = book.pageCount || '';
        document.getElementById('bookCover').value = book.coverImage || '';
        document.getElementById('readingStatus').value = book.status || 'want-to-read';
        document.getElementById('mythicalElement').value = book.mythicalElement || '';
        document.getElementById('bookEdition').value = book.edition || '';
        document.getElementById('digitallySigned').checked = book.digitallySigned || false;
        document.getElementById('signed').checked = book.signed || false;
        document.getElementById('sprayedEdges').checked = book.sprayedEdges || false;
        document.getElementById('hiddenCover').checked = book.hiddenCover || false;
        document.getElementById('reversibleDustJacket').checked = book.reversibleDustJacket || false;
        document.getElementById('startedReading').value = book.startedReading || '';
        document.getElementById('finishedReading').value = book.finishedReading || '';
        document.getElementById('bookGifted').checked = book.gifted || false;
        document.getElementById('bookNotes').value = book.notes || '';

        // Set rating
        this.setRating(book.rating || 0);
        
        // Update cover preview
        this.updateCoverPreview(book.coverImage || '');
    }

    handleFormSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const bookData = {
            title: formData.get('title').trim(),
            author: formData.get('author').trim(),
            series: formData.get('series').trim(),
            bookNumber: formData.get('bookNumber') ? parseFloat(formData.get('bookNumber')) : null,
            publisher: formData.get('publisher').trim(),
            pageCount: formData.get('pageCount') ? parseInt(formData.get('pageCount')) : null,
            coverImage: formData.get('coverImage').trim(),
            status: formData.get('status'),
            rating: parseFloat(document.getElementById('bookRating').value) || 0,
            mythicalElement: formData.get('mythicalElement'),
            edition: formData.get('edition').trim(),
            digitallySigned: formData.has('digitallySigned'),
            signed: formData.has('signed'),
            sprayedEdges: formData.has('sprayedEdges'),
            hiddenCover: formData.has('hiddenCover'),
            reversibleDustJacket: formData.has('reversibleDustJacket'),
            startedReading: formData.get('startedReading'),
            finishedReading: formData.get('finishedReading'),
            gifted: formData.has('gifted'),
            notes: formData.get('notes').trim()
        };

        // Validation
        if (!bookData.title || !bookData.author) {
            alert('Please fill in the required fields (Title and Author)');
            return;
        }

        if (this.currentEditId) {
            this.updateBook(this.currentEditId, bookData);
        } else {
            this.addBook(bookData);
        }

        this.closeModal();
    }

    // Book CRUD operations
    addBook(bookData) {
        const book = {
            ...bookData,
            id: this.generateId(),
            dateAdded: new Date().toISOString()
        };

        this.books.push(book);
        this.saveBooksToStorage();
        this.renderBooks();
        this.updateStats();
        this.showNotification('Book added successfully!', 'success');
    }

    updateBook(id, bookData) {
        const index = this.books.findIndex(book => book.id === id);
        if (index !== -1) {
            this.books[index] = {
                ...this.books[index],
                ...bookData,
                dateModified: new Date().toISOString()
            };
            this.saveBooksToStorage();
            this.renderBooks();
            this.updateStats();
            this.showNotification('Book updated successfully!', 'success');
        }
    }

    deleteBook(id) {
        const book = this.books.find(b => b.id === id);
        if (book) {
            document.getElementById('deleteBookTitle').textContent = book.title;
            const modal = document.getElementById('deleteModal');
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
            
            this.bookToDelete = id;
        }
    }

    confirmDelete() {
        if (this.bookToDelete) {
            this.books = this.books.filter(book => book.id !== this.bookToDelete);
            this.saveBooksToStorage();
            this.renderBooks();
            this.updateStats();
            this.showNotification('Book deleted successfully!', 'success');
            this.bookToDelete = null;
        }
        this.closeDeleteModal();
    }

    // Half-star rating system
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
                this.highlightRating(rating);
            });
        });

        // Reset to current rating when mouse leaves the rating area
        document.getElementById('ratingStars').addEventListener('mouseleave', () => {
            const currentRating = parseFloat(document.getElementById('bookRating').value) || 0;
            this.highlightRating(currentRating);
        });
    }

    setRating(value) {
        const stars = document.querySelectorAll('#ratingStars .star');
        const hiddenInput = document.getElementById('bookRating');
        const ratingText = document.getElementById('ratingText');
        
        hiddenInput.value = value;
        
        if (value === 0) {
            ratingText.textContent = 'No rating';
        } else {
            ratingText.textContent = `${value} star${value !== 1 ? 's' : ''}`;
        }
        
        this.highlightRating(value);
    }

    highlightRating(value) {
        const stars = document.querySelectorAll('#ratingStars .star');
        
        stars.forEach((star, index) => {
            const starNumber = index + 1;
            star.classList.remove('active', 'half');
            
            if (starNumber <= Math.floor(value)) {
                // Full star
                star.classList.add('active');
            } else if (starNumber === Math.floor(value) + 1 && value % 1 !== 0) {
                // Half star (for the next star when we have a decimal)
                star.classList.add('half');
            }
        });
    }

    resetRatings() {
        this.setRating(0);
    }

    // Rendering
    renderBooks() {
        const container = document.getElementById('booksContainer');
        const emptyState = document.getElementById('emptyState');
        
        this.applyFilters();
        this.applySorting();
        
        if (this.filteredBooks.length === 0) {
            container.innerHTML = '';
            emptyState.classList.remove('hidden');
            return;
        }

        emptyState.classList.add('hidden');
        
        container.innerHTML = this.filteredBooks.map(book => this.createBookCard(book)).join('');
    }

    createBookCard(book) {
        const statusClass = `book-card__status--${book.status}`;
        const physicalFeatures = this.getPhysicalFeatures(book);
        const specialEdition = this.isSpecialEdition(book);
        const statusIcon = this.getStatusIcon(book.status);
        const statusText = this.getStatusText(book.status);
        
        return `
            <div class="book-card" data-book-id="${book.id}">
                <div class="book-card__header">
                    <div class="book-card__info">
                        <div class="book-card__cover">
                            ${book.coverImage ? 
                                `<img src="${book.coverImage}" alt="${book.title}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
                                 <div class="book-card__cover-placeholder" style="display:none;"><i class="fas fa-book"></i></div>` :
                                `<div class="book-card__cover-placeholder"><i class="fas fa-book"></i></div>`
                            }
                        </div>
                        <div class="book-card__details">
                            <h3 class="book-card__title ${specialEdition ? 'book-card__special-edition' : ''}">${this.escapeHtml(book.title)}</h3>
                            <p class="book-card__author">by ${this.escapeHtml(book.author)}</p>
                        </div>
                    </div>
                    <div class="book-card__actions">
                        <button class="btn btn--icon" onclick="bookTracker.openModal(bookTracker.books.find(b => b.id === '${book.id}'))" title="Edit book">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn--icon" onclick="bookTracker.deleteBook('${book.id}')" title="Delete book">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                
                <div class="book-card__body">
                    ${book.series ? `
                        <div class="book-card__series">
                            <i class="fas fa-layer-group"></i>
                            ${this.escapeHtml(book.series)}${book.bookNumber ? ` #${book.bookNumber}` : ''}
                        </div>
                    ` : ''}
                    
                    <div class="book-card__meta">
                        ${book.publisher ? `
                            <div class="book-card__meta-item">
                                <span class="book-card__meta-label">Publisher</span>
                                <span class="book-card__meta-value">${this.escapeHtml(book.publisher)}</span>
                            </div>
                        ` : ''}
                        
                        ${book.pageCount ? `
                            <div class="book-card__meta-item">
                                <span class="book-card__meta-label">Pages</span>
                                <span class="book-card__meta-value">${book.pageCount}</span>
                            </div>
                        ` : ''}
                        
                        ${book.mythicalElement ? `
                            <div class="book-card__meta-item">
                                <span class="book-card__meta-label">Genre</span>
                                <span class="book-card__meta-value">${this.escapeHtml(book.mythicalElement)}</span>
                            </div>
                        ` : ''}
                        
                        ${book.finishedReading ? `
                            <div class="book-card__meta-item">
                                <span class="book-card__meta-label">Finished</span>
                                <span class="book-card__meta-value">${new Date(book.finishedReading).toLocaleDateString()}</span>
                            </div>
                        ` : ''}
                        
                        ${book.gifted ? `
                            <div class="book-card__meta-item">
                                <span class="book-card__meta-label">Gift</span>
                                <span class="book-card__meta-value">✓</span>
                            </div>
                        ` : ''}
                    </div>
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
                
                <div class="book-card__footer">
                    <div class="book-card__status ${statusClass}">
                        <i class="${statusIcon}"></i>
                        ${statusText}
                    </div>
                    
                    <div class="book-card__ratings">
                        ${book.rating > 0 ? `
                            <div class="rating-display">
                                <div class="stars">
                                    ${this.renderStars(book.rating)}
                                </div>
                                <span>${book.rating}</span>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    renderStars(rating) {
        let html = '';
        const fullStars = Math.floor(rating);
        const hasHalf = rating % 1 !== 0;
        
        for (let i = 1; i <= 5; i++) {
            if (i <= fullStars) {
                html += `<i class="fas fa-star star"></i>`;
            } else if (i === fullStars + 1 && hasHalf) {
                html += `<i class="fas fa-star-half-alt star"></i>`;
            } else {
                html += `<i class="far fa-star star empty"></i>`;
            }
        }
        
        return html;
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


    // Search and filtering
    handleSearch() {
        this.renderBooks();
    }

    clearSearch() {
        document.getElementById('searchInput').value = '';
        this.renderBooks();
    }

    applyFilters() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const statusFilter = document.getElementById('statusFilter').value;
        const genreFilter = document.getElementById('genreFilter').value;

        this.filteredBooks = this.books.filter(book => {
            const matchesSearch = !searchTerm || 
                book.title.toLowerCase().includes(searchTerm) ||
                book.author.toLowerCase().includes(searchTerm) ||
                (book.series && book.series.toLowerCase().includes(searchTerm)) ||
                (book.publisher && book.publisher.toLowerCase().includes(searchTerm)) ||
                (book.notes && book.notes.toLowerCase().includes(searchTerm));

            const matchesStatus = !statusFilter || book.status === statusFilter;
            const matchesGenre = !genreFilter || book.mythicalElement === genreFilter;

            return matchesSearch && matchesStatus && matchesGenre;
        });
    }

    applySorting() {
        const sortBy = document.getElementById('sortBy').value;
        
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
                    const seriesCompare = a.series.localeCompare(b.series);
                    if (seriesCompare === 0) {
                        return (a.bookNumber || 0) - (b.bookNumber || 0);
                    }
                    return seriesCompare;
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

    // View toggle
    toggleView(view) {
        this.currentView = view;
        const container = document.getElementById('booksContainer');
        const gridBtn = document.getElementById('gridView');
        const listBtn = document.getElementById('listView');

        if (view === 'grid') {
            container.classList.remove('list-view');
            gridBtn.classList.add('active');
            listBtn.classList.remove('active');
        } else {
            container.classList.add('list-view');
            listBtn.classList.add('active');
            gridBtn.classList.remove('active');
        }

        localStorage.setItem('bookTracker_view', view);
    }

    // Statistics
    updateStats() {
        const total = this.books.length;
        const read = this.books.filter(book => book.status === 'read').length;
        const currentlyReading = this.books.filter(book => book.status === 'currently-reading').length;
        const wantToRead = this.books.filter(book => book.status === 'want-to-read').length;
        const dnf = this.books.filter(book => book.status === 'dnf').length;

        document.getElementById('totalBooks').textContent = total;
        document.getElementById('readBooks').textContent = read;
        document.getElementById('currentlyReading').textContent = currentlyReading;
        document.getElementById('wantToRead').textContent = wantToRead;
        document.getElementById('dnfBooks').textContent = dnf;
    }

    // Import/Export functionality
    exportBooks() {
        try {
            const dataStr = JSON.stringify(this.books, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `my-books-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            
            this.showNotification('Books exported successfully!', 'success');
        } catch (error) {
            console.error('Export error:', error);
            this.showNotification('Error exporting books', 'error');
        }
    }

    importBooks() {
        document.getElementById('fileInput').click();
    }

    handleFileImport(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const importedBooks = JSON.parse(event.target.result);
                
                if (!Array.isArray(importedBooks)) {
                    throw new Error('Invalid file format');
                }

                const newBooks = importedBooks.map(book => ({
                    ...book,
                    id: this.generateId(),
                    dateAdded: book.dateAdded || new Date().toISOString()
                }));

                this.books = [...this.books, ...newBooks];
                this.saveBooksToStorage();
                this.renderBooks();
                this.updateStats();
                
                this.showNotification(`Successfully imported ${newBooks.length} books!`, 'success');
            } catch (error) {
                console.error('Import error:', error);
                this.showNotification('Error importing books. Please check the file format.', 'error');
            }
        };

        reader.readAsText(file);
        e.target.value = '';
    }

    // Utility functions
    getStatusIcon(status) {
        switch (status) {
            case 'want-to-read':
                return 'fas fa-bookmark';
            case 'currently-reading':
                return 'fas fa-book-open';
            case 'read':
                return 'fas fa-check';
            case 'dnf':
                return 'fas fa-times';
            default:
                return 'fas fa-book';
        }
    }

    getStatusText(status) {
        switch (status) {
            case 'want-to-read':
                return 'Want to Read';
            case 'currently-reading':
                return 'Reading';
            case 'read':
                return 'Read';
            case 'dnf':
                return 'DNF';
            default:
                return 'Unknown';
        }
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification--${type}`;
        notification.innerHTML = `
            <div class="notification__content">
                <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'exclamation-triangle' : 'info'}"></i>
                <span>${message}</span>
            </div>
        `;

        if (!document.querySelector('#notification-styles')) {
            const styles = document.createElement('style');
            styles.id = 'notification-styles';
            styles.textContent = `
                .notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 1001;
                    background: var(--bg-card);
                    border-radius: var(--radius-lg);
                    box-shadow: var(--shadow-lg);
                    padding: var(--spacing-4);
                    max-width: 300px;
                    transform: translateX(100%);
                    transition: transform 0.3s ease-in-out;
                }
                
                .notification.show {
                    transform: translateX(0);
                }
                
                .notification--success {
                    border-left: 4px solid var(--success-color);
                }
                
                .notification--error {
                    border-left: 4px solid var(--danger-color);
                }
                
                .notification--info {
                    border-left: 4px solid var(--primary-color);
                }
                
                .notification__content {
                    display: flex;
                    align-items: center;
                    gap: var(--spacing-2);
                    font-size: var(--font-size-sm);
                }
                
                .notification__content i {
                    color: ${type === 'success' ? 'var(--success-color)' : type === 'error' ? 'var(--danger-color)' : 'var(--primary-color)'};
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
            document.getElementById('searchInput').focus();
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
            document.getElementById('titleAutocomplete').classList.remove('active');
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.bookTracker = new BookTracker();
});
