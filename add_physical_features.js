// Script to add physical features functionality back to script.js

const fs = require('fs');

// Read the current script.js
let scriptContent = fs.readFileSync('script.js', 'utf8');

// Helper methods to add
const helperMethods = `
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
`;

// Find the renderStars method and add helper methods after it
const renderStarsMethodEnd = scriptContent.indexOf('    // Search and filtering');
if (renderStarsMethodEnd !== -1) {
    scriptContent = scriptContent.slice(0, renderStarsMethodEnd) + 
                   helperMethods + '\n\n    ' + 
                   scriptContent.slice(renderStarsMethodEnd);
}

// Now update the createBookCard method to include physical features
const createBookCardStart = scriptContent.indexOf('createBookCard(book) {');
if (createBookCardStart !== -1) {
    // Find the method body
    const methodStart = scriptContent.indexOf('{', createBookCardStart) + 1;
    const methodEnd = scriptContent.indexOf('\n    }', methodStart);
    
    // Extract the current method content
    const currentMethod = scriptContent.substring(methodStart, methodEnd);
    
    // Update the method to include physical features logic
    const updatedMethod = currentMethod.replace(
        'const statusClass = `book-card__status--${book.status}`;',
        `const statusClass = \`book-card__status--\${book.status}\`;
        const physicalFeatures = this.getPhysicalFeatures(book);
        const specialEdition = this.isSpecialEdition(book);`
    ).replace(
        '<h3 class="book-card__title">${this.escapeHtml(book.title)}</h3>',
        '<h3 class="book-card__title ${specialEdition ? \'book-card__special-edition\' : \'\'}">${this.escapeHtml(book.title)}</h3>'
    );
    
    // Find the insertion point for physical features (after meta section)
    const metaEndPattern = '</div>\n                </div>\n                \n                <div class="book-card__footer">';
    const physicalFeaturesSection = `
                    
                    \${physicalFeatures.length > 0 ? \`
                        <div class="book-card__physical-features">
                            \${physicalFeatures.map(feature => \`
                                <span class="book-card__feature \${feature.special ? 'book-card__feature--special' : ''}">
                                    <i class="\${feature.icon}"></i>
                                    \${feature.name}
                                </span>
                            \`).join('')}
                        </div>
                    \` : ''}`;
    
    const finalUpdatedMethod = updatedMethod.replace(
        metaEndPattern,
        physicalFeaturesSection + '\n                </div>\n                \n                <div class="book-card__footer">'
    );
    
    // Replace the method in the script
    scriptContent = scriptContent.substring(0, methodStart) + 
                   finalUpdatedMethod + 
                   scriptContent.substring(methodEnd);
}

// Write the updated script.js
fs.writeFileSync('script.js', scriptContent);

console.log('Physical features functionality added to script.js!');
