// Complete fix for BookTracker UI issues
const fs = require('fs');

let content = fs.readFileSync('script.js', 'utf8');

// 1. First, add the missing helper methods after renderStarRating
const helperMethodsToAdd = `
    
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
    }`;

// Find where to insert helper methods (after renderStarRating function)
const insertPoint = content.indexOf('    getStatusLabel(status) {');
if (insertPoint !== -1) {
    content = content.slice(0, insertPoint) + helperMethodsToAdd + '\n\n    ' + content.slice(insertPoint);
}

// 2. Fix setupRatingInputs to support half stars
const oldSetupRating = /setupRatingInputs\(\) \{[\s\S]*?\n    \}/;
const newSetupRating = `setupRatingInputs() {
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
    }`;

content = content.replace(oldSetupRating, newSetupRating);

// 3. Fix setRating and highlightStars to support half stars
const oldSetRating = /setRating\(rating\) \{[\s\S]*?\n    \}/;
const newSetRating = `setRating(rating) {
        const hiddenInput = document.getElementById('bookRating');
        if (hiddenInput) {
            hiddenInput.value = rating;
        }
        
        this.highlightStars(rating);
        this.updateRatingDisplay();
    }`;

content = content.replace(oldSetRating, newSetRating);

const oldHighlightStars = /highlightStars\(rating\) \{[\s\S]*?\n    \}/;
const newHighlightStars = `highlightStars(rating) {
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
    }`;

content = content.replace(oldHighlightStars, newHighlightStars);

// 4. Update renderGridView to include physical features and gifted status
const oldRenderGridView = /renderGridView\(container\) \{[\s\S]*?\n    \}/;
const newRenderGridView = `renderGridView(container) {
        container.className = 'books-grid';
        container.innerHTML = this.filteredBooks.map(book => {
            const physicalFeatures = this.getPhysicalFeatures(book);
            const specialEdition = this.isSpecialEdition(book);
            
            return \`
            <div class="book-card" data-id="\${book.id}">
                <div class="book-card__header">
                    <div class="book-card__cover">
                        \${book.coverImage ? 
                            \`<img src="\${book.coverImage}" alt="\${this.escapeHtml(book.title)}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
                             <div class="book-card__no-cover" style="display: none;"><i class="fas fa-book"></i></div>\` :
                            \`<div class="book-card__no-cover"><i class="fas fa-book"></i></div>\`
                        }
                    </div>
                    <div class="book-card__actions">
                        <button class="btn btn--small btn--primary" onclick="bookTracker.openModal(bookTracker.books.find(b => b.id === '\${book.id}'))">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn btn--small btn--danger" onclick="bookTracker.openDeleteModal('\${book.id}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
                <div class="book-card__content">
                    <h3 class="book-card__title \${specialEdition ? 'book-card__special-edition' : ''}">\${this.escapeHtml(book.title)}</h3>
                    <p class="book-card__author">by \${this.escapeHtml(book.author)}</p>
                    \${book.series ? \`<p class="book-card__series">\${this.escapeHtml(book.series)}\${book.bookNumber ? \` #\${book.bookNumber}\` : ''}</p>\` : ''}
                    <div class="book-card__rating">
                        \${this.renderStarRating(book.rating)}
                    </div>
                    <div class="book-card__status status--\${book.status}">
                        \${this.getStatusLabel(book.status)}
                    </div>
                    \${book.mythicalElement ? \`<div class="book-card__genre">\${this.escapeHtml(book.mythicalElement)}</div>\` : ''}
                    \${book.gifted ? \`<div class="book-card__gifted"><i class="fas fa-gift"></i> Gift</div>\` : ''}
                    \${physicalFeatures.length > 0 ? \`
                        <div class="book-card__physical-features">
                            \${physicalFeatures.map(feature => \`
                                <span class="book-card__feature \${feature.special ? 'book-card__feature--special' : ''}">
                                    <i class="\${feature.icon}"></i>
                                    \${feature.name}
                                </span>
                            \`).join('')}
                        </div>
                    \` : ''}
                </div>
            </div>
        \`;
        }).join('');
    }`;

content = content.replace(oldRenderGridView, newRenderGridView);

// 5. Update renderListView to include physical features and gifted status
const oldRenderListView = /renderListView\(container\) \{[\s\S]*?\n    \}/;
const newRenderListView = `renderListView(container) {
        container.className = 'book-list';
        container.innerHTML = this.filteredBooks.map(book => {
            const physicalFeatures = this.getPhysicalFeatures(book);
            const specialEdition = this.isSpecialEdition(book);
            
            return \`
            <div class="book-list__item" data-id="\${book.id}">
                <div class="book-list__cover">
                    \${book.coverImage ? 
                        \`<img src="\${book.coverImage}" alt="\${this.escapeHtml(book.title)}" onerror="this.style.display='none';this.nextElementSibling.style.display='block';">
                         <div class="book-list__no-cover" style="display: none;"><i class="fas fa-book"></i></div>\` :
                        \`<div class="book-list__no-cover"><i class="fas fa-book"></i></div>\`
                    }
                </div>
                <div class="book-list__content">
                    <div class="book-list__main">
                        <h3 class="book-list__title \${specialEdition ? 'book-card__special-edition' : ''}">\${this.escapeHtml(book.title)}</h3>
                        <p class="book-list__author">by \${this.escapeHtml(book.author)}</p>
                        \${book.series ? \`<p class="book-list__series">\${this.escapeHtml(book.series)}\${book.bookNumber ? \` #\${book.bookNumber}\` : ''}</p>\` : ''}
                        <div class="book-list__rating">
                            \${this.renderStarRating(book.rating)}
                        </div>
                    </div>
                    <div class="book-list__meta">
                        <div class="book-list__status status--\${book.status}">
                            \${this.getStatusLabel(book.status)}
                        </div>
                        \${book.mythicalElement ? \`<div class="book-list__genre">\${this.escapeHtml(book.mythicalElement)}</div>\` : ''}
                        \${book.pageCount ? \`<div class="book-list__pages">\${book.pageCount} pages</div>\` : ''}
                        \${book.gifted ? \`<div class="book-list__gifted"><i class="fas fa-gift"></i> Gift</div>\` : ''}
                        \${physicalFeatures.length > 0 ? \`
                            <div class="book-list__physical-features">
                                \${physicalFeatures.map(feature => \`
                                    <span class="book-card__feature \${feature.special ? 'book-card__feature--special' : ''}">
                                        <i class="\${feature.icon}"></i>
                                        \${feature.name}
                                    </span>
                                \`).join('')}
                            </div>
                        \` : ''}
                    </div>
                    <div class="book-list__actions">
                        <button class="btn btn--small btn--primary" onclick="bookTracker.openModal(bookTracker.books.find(b => b.id === '\${book.id}'))">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn btn--small btn--danger" onclick="bookTracker.openDeleteModal('\${book.id}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            </div>
        \`;
        }).join('');
    }`;

content = content.replace(oldRenderListView, newRenderListView);

// Write the updated content
fs.writeFileSync('script.js', content);
console.log('✅ Complete UI fixes applied successfully!');
console.log('- Half-star rating system fixed');
console.log('- Physical features helper methods added');
console.log('- Grid and list views updated to show physical features and gifted status');
