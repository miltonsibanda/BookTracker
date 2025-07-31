// 🔍 Quick Book Data Debug - Paste this into the browser console on index.html

console.log('=== BOOK TRACKER DEBUG ANALYSIS ===');

// Check if bookTracker exists
if (typeof bookTracker !== 'undefined') {
    console.log('✅ bookTracker instance found');
    console.log('📊 Books in tracker:', bookTracker.books.length);
    console.log('📊 Filtered books:', bookTracker.filteredBooks?.length || 0);
    console.log('📊 Current view:', bookTracker.currentView);
    
    if (bookTracker.books.length > 0) {
        console.log('📚 Sample books:');
        bookTracker.books.slice(0, 3).forEach((book, index) => {
            console.log(`  ${index + 1}. "${book.title}" by ${book.author}`);
            console.log(`     Status: ${book.status}, Genre: ${book.mythicalElement}, Trope: ${book.trope}`);
        });
        
        // Test filter function
        console.log('🧪 Testing applyFilters()...');
        bookTracker.applyFilters();
        console.log('📊 After applyFilters(), filtered books:', bookTracker.filteredBooks.length);
        
        if (bookTracker.filteredBooks.length === 0) {
            console.log('⚠️ ISSUE: No books pass the filter criteria');
            console.log('🔍 Checking filter values:');
            
            const statusFilter = document.getElementById('statusFilter')?.value;
            const genreFilter = document.getElementById('genreFilter')?.value;
            const tropeFilter = document.getElementById('tropeFilter')?.value;
            
            console.log(`   Status filter: "${statusFilter}"`);
            console.log(`   Genre filter: "${genreFilter}"`);
            console.log(`   Trope filter: "${tropeFilter}"`);
            
            // Test each book against filters
            console.log('🔍 Testing each book against current filters:');
            bookTracker.books.forEach((book, index) => {
                const statusMatch = !statusFilter || book.status === statusFilter;
                const genreMatch = !genreFilter || book.mythicalElement === genreFilter;
                const tropeMatch = !tropeFilter || book.trope === tropeFilter;
                const searchMatch = true; // Assuming no search query
                
                const passes = statusMatch && genreMatch && tropeMatch && searchMatch;
                
                console.log(`   ${index + 1}. "${book.title}": ${passes ? '✅ PASS' : '❌ FAIL'}`);
                if (!passes) {
                    console.log(`      Status: ${statusMatch} (${book.status} vs ${statusFilter})`);
                    console.log(`      Genre: ${genreMatch} (${book.mythicalElement} vs ${genreFilter})`);
                    console.log(`      Trope: ${tropeMatch} (${book.trope} vs ${tropeFilter})`);
                }
            });
        }
        
    } else {
        console.log('❌ PROBLEM: No books in the collection!');
        console.log('💡 Solutions:');
        console.log('   1. Add books using the "Add Book" button');
        console.log('   2. Check if API sync failed');
        console.log('   3. Check if initial data setup failed');
        
        // Check localStorage
        const stored = localStorage.getItem('bookTracker_books');
        if (stored) {
            const localBooks = JSON.parse(stored);
            console.log(`📦 Found ${localBooks.length} books in localStorage but not loaded`);
        } else {
            console.log('📦 No books in localStorage either');
        }
    }
    
} else {
    console.log('❌ bookTracker instance not found');
    console.log('💡 Make sure you are on the main app page (index.html)');
}

// Check localStorage directly
const localData = localStorage.getItem('bookTracker_books');
if (localData) {
    const localBooks = JSON.parse(localData);
    console.log(`📦 localStorage contains ${localBooks.length} books`);
} else {
    console.log('📦 No books in localStorage');
}

console.log('=== QUICK FIXES ===');
console.log('// Add test data:');
console.log('bookTracker.books = [');
console.log('  { id: "1", title: "Test Book", author: "Test Author", status: "read", mythicalElement: "fae", trope: "enemies-to-lovers" }');
console.log('];');
console.log('bookTracker.renderBooks();');
console.log('');
console.log('// Reset filters:');
console.log('document.getElementById("statusFilter").value = "";');
console.log('document.getElementById("genreFilter").value = "";');
console.log('document.getElementById("tropeFilter").value = "";');
console.log('bookTracker.renderBooks();');

console.log('=== END DEBUG ===');
