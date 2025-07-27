// BookTracker Data Persistence Layer
class DataPersistence {
    constructor() {
        this.apiBaseUrl = window.location.origin + '/api';
        this.useLocalStorage = false;
        this.isOnline = navigator.onLine;
        
        // Listen for online/offline events
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.syncWithServer();
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
        });
    }

    async init() {
        // Test if API is available
        try {
            const response = await fetch(`${this.apiBaseUrl}/health`, {
                method: 'GET',
                timeout: 5000
            });
            
            if (response.ok) {
                console.log('✅ Backend API available - using server persistence');
                this.useLocalStorage = false;
                return true;
            }
        } catch (error) {
            console.warn('⚠️ Backend API not available - falling back to localStorage');
        }
        
        // Fallback to localStorage
        this.useLocalStorage = true;
        return false;
    }

    async loadBooks() {
        if (this.useLocalStorage || !this.isOnline) {
            return this.loadFromLocalStorage();
        }

        try {
            const response = await fetch(`${this.apiBaseUrl}/books`);
            if (response.ok) {
                const books = await response.json();
                // Cache in localStorage as backup
                this.saveToLocalStorage(books);
                return books;
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (error) {
            console.warn('Failed to load from server, using localStorage:', error);
            return this.loadFromLocalStorage();
        }
    }

    async saveBooks(books) {
        // Always save to localStorage as backup
        this.saveToLocalStorage(books);

        if (this.useLocalStorage || !this.isOnline) {
            return true;
        }

        try {
            const response = await fetch(`${this.apiBaseUrl}/books`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(books)
            });

            if (response.ok) {
                const result = await response.json();
                console.log(`✅ Saved ${result.count} books to server`);
                return true;
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (error) {
            console.warn('Failed to save to server, data saved locally:', error);
            return false;
        }
    }

    loadFromLocalStorage() {
        try {
            const stored = localStorage.getItem('bookTracker_books');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading from localStorage:', error);
            return [];
        }
    }

    saveToLocalStorage(books) {
        try {
            localStorage.setItem('bookTracker_books', JSON.stringify(books));
            return true;
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            return false;
        }
    }

    async syncWithServer() {
        if (this.useLocalStorage || !this.isOnline) {
            return;
        }

        try {
            // Load local data
            const localBooks = this.loadFromLocalStorage();
            
            // Load server data
            const serverBooks = await this.loadBooks();

            // Simple sync strategy: use the data with more recent modifications
            // In a production app, you'd want more sophisticated conflict resolution
            if (localBooks.length > 0 && serverBooks.length === 0) {
                // Local has data, server is empty - push to server
                await this.saveBooks(localBooks);
                console.log('📤 Synced local data to server');
            } else if (localBooks.length === 0 && serverBooks.length > 0) {
                // Server has data, local is empty - pull from server
                this.saveToLocalStorage(serverBooks);
                console.log('📥 Synced server data to local');
            }
            // If both have data, server wins (last writer wins strategy)
        } catch (error) {
            console.warn('Sync failed:', error);
        }
    }

    getStorageInfo() {
        return {
            apiAvailable: !this.useLocalStorage,
            online: this.isOnline,
            storageType: this.useLocalStorage ? 'localStorage' : 'server',
            apiUrl: this.apiBaseUrl
        };
    }
}

// Export for use in main script
window.DataPersistence = DataPersistence;
