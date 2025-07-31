// 🚀 INSTANT FIX - Copy and paste this into browser console on index.html

console.log('🚀 Applying instant book data fix...');

// First, let's check what we have
console.log('Current books:', bookTracker.books.length);
console.log('Current filtered books:', bookTracker.filteredBooks?.length || 0);

// If no books, add some test data
if (bookTracker.books.length === 0) {
    console.log('📚 Adding test books...');
    
    bookTracker.books = [
        {
            id: 'quick-fix-1',
            title: 'Shadow and Bone',
            author: 'Leigh Bardugo',
            status: 'read',
            mythicalElement: 'fae',
            trope: 'chosen-one',
            rating: 4.5,
            dateAdded: new Date().toISOString()
        },
        {
            id: 'quick-fix-2',
            title: 'Fourth Wing',
            author: 'Rebecca Yarros',
            status: 'currently-reading',
            mythicalElement: 'vampire',
            trope: 'enemies-to-lovers',
            rating: 5,
            dateAdded: new Date().toISOString()
        },
        {
            id: 'quick-fix-3',
            title: 'The Seven Husbands of Evelyn Hugo',
            author: 'Taylor Jenkins Reid',
            status: 'want-to-read',
            mythicalElement: 'human',
            trope: 'found-family',
            rating: 0,
            dateAdded: new Date().toISOString()
        },
        {
            id: 'quick-fix-4',
            title: 'House of Earth and Blood',
            author: 'Sarah J. Maas',
            status: 'dnf',
            mythicalElement: 'fae',
            trope: 'enemies-to-lovers',
            rating: 2,
            dateAdded: new Date().toISOString()
        }
    ];
    
    console.log('✅ Added 4 test books');
    
    // Save to localStorage
    localStorage.setItem('bookTracker_books', JSON.stringify(bookTracker.books));
    console.log('✅ Saved to localStorage');
}

// Reset all filters to show all books
console.log('🔄 Resetting filters...');
const statusFilter = document.getElementById('statusFilter');
const genreFilter = document.getElementById('genreFilter');
const tropeFilter = document.getElementById('tropeFilter');

if (statusFilter) statusFilter.value = '';
if (genreFilter) genreFilter.value = '';
if (tropeFilter) tropeFilter.value = '';

console.log('✅ Filters reset');

// Force re-render
console.log('🖼️ Re-rendering books...');
bookTracker.renderBooks();
bookTracker.updateStats();

console.log('🎉 Fix complete! You should now see books displayed.');
console.log('📊 Final count:', bookTracker.books.length, 'books,', bookTracker.filteredBooks.length, 'visible');

// Test the filters
console.log('🧪 Testing filters...');
console.log('Try changing the Status filter to "Read" - should show 1 book');
console.log('Try changing the Genre filter to "Fae" - should show 2 books');
console.log('Try changing the Trope filter to "Enemies to Lovers" - should show 2 books');
