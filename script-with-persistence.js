// BookTracker App - Enhanced JavaScript with Google Books API, Half-Star Ratings, and Data Persistence
class BookTracker {
    constructor() {
        this.books = [];
        this.filteredBooks = [];
        this.currentEditId = null;
        this.currentView = 'grid';
        this.bookToDelete = null;
        this.persistence = new DataPersistence();
        this.isInitialized = false;
    }

    async init() {
        console.log('🚀 Initializing BookTracker...');
        
        // Initialize data persistence
        const apiAvailable = await this.persistence.init();
        
        // Load books from storage
        await this.loadBooksFromStorage();
        
        // Setup UI
        this.bindEvents();
        this.renderBooks();
        this.updateStats();
        this.setupInitialData();
        this.setupRatingInputs();
        
        // Load saved view preference
        const savedView = localStorage.getItem('bookTracker_view');
        if (savedView) {
            this.toggleView(savedView);
        }

        this.isInitialized = true;
        
        // Show storage info
        const storageInfo = this.persistence.getStorageInfo();
        console.log('💾 Storage info:', storageInfo);
        
        if (storageInfo.apiAvailable) {
            this.showNotification('✅ Connected to server - your data will be shared across browsers!', 'success');
        } else {
            this.showNotification('⚠️ Using local storage - data will only be available in this browser', 'info');
        }
    }

    // Setup initial data with enhanced fields
    setupInitialData() {
        if (this.books.length === 0) {
            const initialBooks = [
                {
                    id: this.generateId(),
                    title: "The Name of the Wind",
                    author: "Patrick Rothfuss",
                    series: "The Kingkiller Chronicle",
                    bookNumber: 1,
                    status: "read",
                    rating: 4.5,
                    mythicalElement: "Magic and storytelling",
                    publisher: "DAW Books",
                    pageCount: 662,
                    coverImage: "",
                    edition: "First Edition",
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
        document.getElementById('searchForm').addEventListener('submit', (e) => this.handleSearchSubmit(e));

        // Delete modal
        document.getElementById('cancelDelete').addEventListener('click', () => this.closeDeleteModal());
        document.getElementById('confirmDelete').addEventListener('click', () => this.confirmDelete());

        // Search and filters
        document.getElementById('searchInput').addEventListener('input', (e) => this.handleSearch(e.target.value));
        document.getElementById('clearSearch').addEventListener('click', () => this.clearSearch());
        document.getElementById('statusFilter').addEventListener('change', (e) => this.handleFilter());
        document.getElementById('sortBy').addEventListener('change', (e) => this.applySorting());
        document.getElementById('publisherFilter').addEventListener('change', (e) => this.handleFilter());

        // View toggles
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

    // Generate unique ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Enhanced Local Storage operations with API integration
    async saveBooksToStorage() {
        try {
            const success = await this.persistence.saveBooks(this.books);
            if (!success) {
                console.warn('Data saved locally but not synced to server');
            }
        } catch (error) {
            console.error('Error saving books:', error);
            this.showNotification('Error saving books', 'error');
        }
    }

    async loadBooksFromStorage() {
        try {
            this.books = await this.persistence.loadBooks();
            console.log(`📚 Loaded ${this.books.length} books from storage`);
        } catch (error) {
            console.error('Error loading books:', error);
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
            this.populateFromGoogleBook(googleBook);
        } else {
            title.textContent = 'Add New Book';
            this.currentEditId = null;
            form.reset();
            this.updateCoverPreview('');
        }

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        document.getElementById('bookTitle').focus();
    }

    closeModal() {
        const modal = document.getElementById('bookModal');
        modal.classList.remove('active');
        document.body.style.overflow = '';
        this.currentEditId = null;
        this.updateCoverPreview('');
    }

    // Search modal operations
    openSearchModal() {
        const modal = document.getElementById('searchModal');
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        document.getElementById('searchQuery').focus();
    }

    closeSearchModal() {
        const modal = document.getElementById('searchModal');
        modal.classList.remove('active');
        document.body.style.overflow = '';
        document.getElementById('searchResults').innerHTML = '';
    }

    // Delete modal operations
    closeDeleteModal() {
        const modal = document.getElementById('deleteModal');
        modal.classList.remove('active');
        document.body.style.overflow = '';
        this.bookToDelete = null;
    }

    // Form handling
    populateForm(book) {
        const fields = [
            'bookTitle', 'bookAuthor', 'bookSeries', 'bookNumber', 'bookStatus', 
            'bookRating', 'mythicalElement', 'bookPublisher', 'pageCount', 'bookCover',
            'edition', 'startedReading', 'finishedReading', 'notes'
        ];

        fields.forEach(field => {
            const element = document.getElementById(field);
            if (element && book[field.replace('book', '').toLowerCase()]) {
                if (element.type === 'checkbox') {
                    element.checked = book[field.replace('book', '').toLowerCase()];
                } else {
                    element.value = book[field.replace('book', '').toLowerCase()];
                }
            }
        });

        // Handle special fields
        if (book.rating) {
            document.getElementById('bookRating').value = book.rating;
            this.updateRatingDisplay(book.rating);
        }

        // Handle physical features checkboxes
        const physicalFeatures = ['digitallySigned', 'signed', 'sprayedEdges', 'hiddenCover', 'reversibleDustJacket', 'gifted'];
        physicalFeatures.forEach(feature => {
            const element = document.getElementById(feature);
            if (element) {
                element.checked = book[feature] || false;
            }
        });

        this.updateCoverPreview(book.coverImage || '');
    }

    populateFromGoogleBook(googleBook) {
        const volumeInfo = googleBook.volumeInfo;
        
        document.getElementById('bookTitle').value = volumeInfo.title || '';
        document.getElementById('bookAuthor').value = volumeInfo.authors ? volumeInfo.authors.join(', ') : '';
        document.getElementById('bookPublisher').value = volumeInfo.publisher || '';
        document.getElementById('pageCount').value = volumeInfo.pageCount || '';
        
        if (volumeInfo.imageLinks && volumeInfo.imageLinks.thumbnail) {
            const coverUrl = volumeInfo.imageLinks.thumbnail.replace('http:', 'https:');
            document.getElementById('bookCover').value = coverUrl;
            this.updateCoverPreview(coverUrl);
        }
        
        if (volumeInfo.description) {
            document.getElementById('notes').value = volumeInfo.description.substring(0, 200) + '...';
        }
    }

    async handleFormSubmit(e) {
        e.preventDefault();
        
        if (!this.isInitialized) {
            this.showNotification('Please wait for the app to finish loading', 'warning');
            return;
        }

        const formData = new FormData(e.target);
        
        const bookData = {
            title: formData.get('title').trim(),
            author: formData.get('author').trim(),
            series: formData.get('series').trim(),
            bookNumber: formData.get('bookNumber') ? parseInt(formData.get('bookNumber')) : null,
            status: formData.get('status'),
            rating: parseFloat(formData.get('rating')) || 0,
            mythicalElement: formData.get('mythicalElement').trim(),
            publisher: formData.get('publisher').trim(),
            pageCount: formData.get('pageCount') ? parseInt(formData.get('pageCount')) : null,
            coverImage: formData.get('coverImage').trim(),
            edition: formData.get('edition').trim(),
            
            // Physical features
            digitallySigned: formData.has('digitallySigned'),
            signed: formData.has('signed'),
            sprayedEdges: formData.has('sprayedEdges'),
            hiddenCover: formData.has('hiddenCover'),
            reversibleDustJacket: formData.has('reversibleDustJacket'),
            
            // Reading dates
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
        const ratingInputs = document.querySelectorAll('.rating-input');
        const ratingHiddenInput = document.getElementById('bookRating');

        ratingInputs.forEach(input => {
            input.addEventListener('click', (e) => {
                e.preventDefault();
                
                const rating = parseFloat(input.dataset.rating);
                ratingHiddenInput.value = rating;
                this.updateRatingDisplay(rating);
            });
        });
    }

    updateRatingDisplay(rating) {
        const ratingInputs = document.querySelectorAll('.rating-input');
        const ratingValue = document.getElementById('ratingValue');
        
        if (ratingValue) {
            ratingValue.textContent = rating === 0 ? 'Not rated' : `${rating} star${rating !== 1 ? 's' : ''}`;
        }

        ratingInputs.forEach(input => {
            const inputRating = parseFloat(input.dataset.rating);
            const star = input.querySelector('.star');
            
            if (inputRating <= rating) {
                if (inputRating === Math.floor(rating) + 0.5 && rating % 1 === 0.5) {
                    star.className = 'star star--half-filled';
                } else {
                    star.className = 'star star--filled';
                }
            } else {
                star.className = 'star';
            }
        });
    }

    // Google Books API search
    async handleSearchSubmit(e) {
        e.preventDefault();
        const query = document.getElementById('searchQuery').value.trim();
        if (!query) return;

        const resultsContainer = document.getElementById('searchResults');
        resultsContainer.innerHTML = '<div class="loading">Searching...</div>';

        try {
            const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=10`);
            const data = await response.json();

            if (data.items && data.items.length > 0) {
                this.displaySearchResults(data.items);
            } else {
                resultsContainer.innerHTML = '<div class="no-results">No books found</div>';
            }
        } catch (error) {
            console.error('Search error:', error);
            resultsContainer.innerHTML = '<div class="error">Search failed. Please try again.</div>';
        }
    }

    displaySearchResults(books) {
        const resultsContainer = document.getElementById('searchResults');
        resultsContainer.innerHTML = books.map(book => {
            const volumeInfo = book.volumeInfo;
            const thumbnail = volumeInfo.imageLinks ? volumeInfo.imageLinks.thumbnail : '';
            
            return `
                <div class="search-result" onclick="bookTracker.selectSearchResult('${book.id}')">
                    <div class="search-result__cover">
                        ${thumbnail ? `<img src="${thumbnail}" alt="${volumeInfo.title}">` : '<div class="no-cover">No Cover</div>'}
                    </div>
                    <div class="search-result__info">
                        <h4>${volumeInfo.title}</h4>
                        <p class="author">${volumeInfo.authors ? volumeInfo.authors.join(', ') : 'Unknown Author'}</p>
                        <p class="publisher">${volumeInfo.publisher || 'Unknown Publisher'}</p>
                        ${volumeInfo.publishedDate ? `<p class="date">${volumeInfo.publishedDate}</p>` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    selectSearchResult(bookId) {
        // Store the selected book data temporarily
        fetch(`https://www.googleapis.com/books/v1/volumes/${bookId}`)
            .then(response => response.json())
            .then(book => {
                this.closeSearchModal();
                this.openModal(null, book);
            })
            .catch(error => {
                console.error('Error fetching book details:', error);
            });
    }

    // Rendering and UI
    renderBooks() {
        this.applyFilters();
        
        const container = document.getElementById('booksContainer');
        const emptyState = document.getElementById('emptyState');

        if (this.filteredBooks.length === 0) {
            container.style.display = 'none';
            emptyState.style.display = 'flex';
            return;
        }

        container.style.display = 'grid';
        emptyState.style.display = 'none';

        container.innerHTML = this.filteredBooks.map(book => this.createBookCard(book)).join('');
    }

    createBookCard(book) {
        const statusIcon = this.getStatusIcon(book.status);
        const statusText = this.getStatusText(book.status);
        const ratingStars = this.createRatingStars(book.rating);
        
        // Physical features badges
        const physicalFeatures = [];
        if (book.digitallySigned) physicalFeatures.push('📝 Digitally Signed');
        if (book.signed) physicalFeatures.push('✍️ Signed');
        if (book.sprayedEdges) physicalFeatures.push('🌈 Sprayed Edges');
        if (book.hiddenCover) physicalFeatures.push('🎭 Hidden Cover');
        if (book.reversibleDustJacket) physicalFeatures.push('🔄 Reversible Dust Jacket');
        if (book.gifted) physicalFeatures.push('🎁 Gift');

        return `
            <div class="book-card" data-status="${book.status}">
                <div class="book-card__cover">
                    ${book.coverImage ? 
                        `<img src="${book.coverImage}" alt="${this.escapeHtml(book.title)}" loading="lazy">` : 
                        '<div class="no-cover">No Cover</div>'
                    }
                    <div class="book-card__status">
                        <i class="${statusIcon}"></i>
                    </div>
                </div>
                <div class="book-card__content">
                    <h3 class="book-card__title">${this.escapeHtml(book.title)}</h3>
                    <p class="book-card__author">by ${this.escapeHtml(book.author)}</p>
                    
                    ${book.series ? `<p class="book-card__series">${this.escapeHtml(book.series)}${book.bookNumber ? ` #${book.bookNumber}` : ''}</p>` : ''}
                    
                    <div class="book-card__meta">
                        <div class="book-card__rating">
                            ${ratingStars}
                        </div>
                        <div class="book-card__status-text">${statusText}</div>
                    </div>
                    
                    ${book.publisher ? `<p class="book-card__publisher">${this.escapeHtml(book.publisher)}</p>` : ''}
                    ${book.pageCount ? `<p class="book-card__pages">${book.pageCount} pages</p>` : ''}
                    
                    ${physicalFeatures.length > 0 ? `
                        <div class="book-card__features">
                            ${physicalFeatures.map(feature => `<span class="feature-badge">${feature}</span>`).join('')}
                        </div>
                    ` : ''}
                    
                    ${book.mythicalElement ? `<p class="book-card__mythical"><strong>Mythical:</strong> ${this.escapeHtml(book.mythicalElement)}</p>` : ''}
                    
                    ${book.notes ? `<p class="book-card__notes">${this.escapeHtml(book.notes.substring(0, 100))}${book.notes.length > 100 ? '...' : ''}</p>` : ''}
                </div>
                <div class="book-card__actions">
                    <button class="btn btn--small btn--secondary" onclick="bookTracker.openModal(bookTracker.books.find(b => b.id === '${book.id}'))">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn--small btn--danger" onclick="bookTracker.deleteBook('${book.id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `;
    }

    createRatingStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 === 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

        let stars = '';
        
        // Full stars
        for (let i = 0; i < fullStars; i++) {
            stars += '<i class="fas fa-star star--filled"></i>';
        }
        
        // Half star
        if (hasHalfStar) {
            stars += '<i class="fas fa-star-half-alt star--half-filled"></i>';
        }
        
        // Empty stars
        for (let i = 0; i < emptyStars; i++) {
            stars += '<i class="far fa-star"></i>';
        }
        
        return stars;
    }

    // Filtering and searching
    applyFilters() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const statusFilter = document.getElementById('statusFilter').value;
        const publisherFilter = document.getElementById('publisherFilter').value;

        this.filteredBooks = this.books.filter(book => {
            const matchesSearch = !searchTerm || 
                book.title.toLowerCase().includes(searchTerm) ||
                book.author.toLowerCase().includes(searchTerm) ||
                book.series.toLowerCase().includes(searchTerm) ||
                book.publisher.toLowerCase().includes(searchTerm) ||
                book.mythicalElement.toLowerCase().includes(searchTerm);

            const matchesStatus = !statusFilter || book.status === statusFilter;
            const matchesPublisher = !publisherFilter || book.publisher === publisherFilter;

            return matchesSearch && matchesStatus && matchesPublisher;
        });

        this.applySorting();
        this.updatePublisherFilter();
    }

    handleSearch(searchTerm) {
        this.renderBooks();
    }

    handleFilter() {
        this.renderBooks();
    }

    clearSearch() {
        document.getElementById('searchInput').value = '';
        this.renderBooks();
    }

    updatePublisherFilter() {
        const publisherFilter = document.getElementById('publisherFilter');
        const currentValue = publisherFilter.value;
        
        // Get unique publishers from current books
        const publishers = [...new Set(this.books.map(book => book.publisher).filter(p => p))];
        
        // Clear existing options except "All Publishers"
        publisherFilter.innerHTML = '<option value="">All Publishers</option>';
        
        // Add publisher options
        publishers.sort().forEach(publisher => {
            const option = document.createElement('option');
            option.value = publisher;
            option.textContent = publisher;
            publisherFilter.appendChild(option);
        });
        
        // Restore previous selection if it still exists
        if (currentValue && publishers.includes(currentValue)) {
            publisherFilter.value = currentValue;
        }
    }

    applySorting() {
        const sortBy = document.getElementById('sortBy').value;
        
        this.filteredBooks.sort((a, b) => {
            switch (sortBy) {
                case 'title':
                    return a.title.localeCompare(b.title);
                case 'author':
                    return a.author.localeCompare(b.author);
                case 'rating':
                    return b.rating - a.rating;
                case 'dateAdded':
                    return new Date(b.dateAdded) - new Date(a.dateAdded);
                case 'dateModified':
                    return new Date(b.dateModified || b.dateAdded) - new Date(a.dateModified || a.dateAdded);
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

    async handleFileImport(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
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
                await this.saveBooksToStorage();
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
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    updateCoverPreview(url) {
        const preview = document.getElementById('coverPreview');
        if (url) {
            preview.innerHTML = `<img src="${url}" alt="Cover preview" style="max-width: 100px; max-height: 150px;">`;
        } else {
            preview.innerHTML = '<div class="no-cover-preview">No cover</div>';
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification--${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 4000);
    }

    handleKeyboardShortcuts(e) {
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 'n':
                    e.preventDefault();
                    this.openModal();
                    break;
                case 'f':
                    e.preventDefault();
                    document.getElementById('searchInput').focus();
                    break;
                case 's':
                    e.preventDefault();
                    this.exportBooks();
                    break;
            }
        }
        
        if (e.key === 'Escape') {
            this.closeModal();
            this.closeDeleteModal();
            this.closeSearchModal();
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    window.bookTracker = new BookTracker();
    await window.bookTracker.init();
});
