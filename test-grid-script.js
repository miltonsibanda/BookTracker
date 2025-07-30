// Quick Grid Layout Test Script
// Run this in the browser console to test grid functionality

console.log('🧪 Starting Grid Layout Test...');

// Test 1: Check if BookTracker is initialized
if (typeof window.bookTracker !== 'undefined') {
    console.log('✅ BookTracker is initialized');
    console.log('Current view:', window.bookTracker.currentView);
    console.log('Books count:', window.bookTracker.books.length);
} else {
    console.error('❌ BookTracker not found');
}

// Test 2: Check grid toggle buttons
const gridBtn = document.getElementById('gridView');
const listBtn = document.getElementById('listView');
const container = document.getElementById('booksContainer');

console.log('📱 Checking UI elements:');
console.log('Grid button:', gridBtn ? '✅ Found' : '❌ Missing');
console.log('List button:', listBtn ? '✅ Found' : '❌ Missing');
console.log('Container:', container ? '✅ Found' : '❌ Missing');

if (container) {
    console.log('Container current class:', container.className);
    console.log('Container children count:', container.children.length);
}

// Test 3: Test view toggle functions
if (window.bookTracker) {
    console.log('🔄 Testing view toggles...');
    
    // Test grid view
    window.bookTracker.toggleView('grid');
    setTimeout(() => {
        console.log('After grid toggle:');
        console.log('- Current view:', window.bookTracker.currentView);
        console.log('- Container class:', container ? container.className : 'no container');
        console.log('- Grid button active:', gridBtn ? gridBtn.classList.contains('active') : 'no button');
        
        // Test list view
        window.bookTracker.toggleView('list');
        setTimeout(() => {
            console.log('After list toggle:');
            console.log('- Current view:', window.bookTracker.currentView);
            console.log('- Container class:', container ? container.className : 'no container');
            console.log('- List button active:', listBtn ? listBtn.classList.contains('active') : 'no button');
            
            // Switch back to grid
            window.bookTracker.toggleView('grid');
            console.log('✅ Grid layout test completed');
        }, 100);
    }, 100);
}

// Test 4: Check CSS grid properties
if (container) {
    const styles = window.getComputedStyle(container);
    console.log('📐 Container CSS properties:');
    console.log('Display:', styles.display);
    console.log('Grid template columns:', styles.gridTemplateColumns);
    console.log('Gap:', styles.gap);
}

// Test 5: Manual book card check
setTimeout(() => {
    const bookCards = document.querySelectorAll('.book-card');
    console.log('📚 Book cards found:', bookCards.length);
    
    if (bookCards.length > 0) {
        const firstCard = bookCards[0];
        console.log('First card structure check:');
        console.log('- Has header:', !!firstCard.querySelector('.book-card__header'));
        console.log('- Has body:', !!firstCard.querySelector('.book-card__body'));
        console.log('- Has footer:', !!firstCard.querySelector('.book-card__footer'));
        console.log('- Has actions:', !!firstCard.querySelector('.book-card__actions'));
    }
}, 200);

console.log('📋 Grid layout test script loaded. Check console for results.');
