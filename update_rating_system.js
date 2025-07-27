// First, let's update the setupRatingInputs method
function updateRatingSystem() {
    // Find the setupRatingInputs method and replace it
    const fs = require('fs');
    let content = fs.readFileSync('script.js', 'utf8');
    
    // Find the start and end of setupRatingInputs method
    const startPattern = /setupRatingInputs\(\) \{/;
    const startMatch = content.match(startPattern);
    
    if (startMatch) {
        const startIndex = startMatch.index;
        
        // Find the matching closing brace
        let braceCount = 0;
        let endIndex = startIndex;
        let inMethod = false;
        
        for (let i = startIndex; i < content.length; i++) {
            if (content[i] === '{') {
                braceCount++;
                inMethod = true;
            } else if (content[i] === '}') {
                braceCount--;
                if (inMethod && braceCount === 0) {
                    endIndex = i + 1;
                    break;
                }
            }
        }
        
        // New setupRatingInputs method
        const newMethod = `setupRatingInputs() {
        const stars = document.querySelectorAll('#ratingStars .star');
        stars.forEach((star, index) => {
            // Add click event for each star
            star.addEventListener('click', (e) => {
                const rect = star.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const starWidth = rect.width;
                const starNumber = index + 1;
                
                // If clicked on left half, set half star
                // If clicked on right half, set full star
                const rating = clickX < starWidth / 2 ? starNumber - 0.5 : starNumber;
                
                this.setRating(rating);
            });
            
            // Add hover effect
            star.addEventListener('mousemove', (e) => {
                const rect = star.getBoundingClientRect();
                const hoverX = e.clientX - rect.left;
                const starWidth = rect.width;
                const starNumber = index + 1;
                
                // Show preview of what would be selected
                const rating = hoverX < starWidth / 2 ? starNumber - 0.5 : starNumber;
                this.highlightRating(rating);
            });
        });

        // Reset to current rating when mouse leaves
        document.getElementById('ratingStars').addEventListener('mouseleave', () => {
            const currentRating = parseFloat(document.getElementById('bookRating').value) || 0;
            this.highlightRating(currentRating);
        });
    }`;
        
        // Replace the method
        const beforeMethod = content.substring(0, startIndex);
        const afterMethod = content.substring(endIndex);
        content = beforeMethod + newMethod + afterMethod;
    }
    
    // Now update the highlightRating method
    const highlightPattern = /highlightRating\(value\) \{[^}]*\}\s*\}\);[^}]*\}/s;
    const newHighlightMethod = `highlightRating(value) {
        const stars = document.querySelectorAll('#ratingStars .star');
        
        stars.forEach((star, index) => {
            const starNumber = index + 1;
            star.classList.remove('active', 'half');
            
            if (starNumber <= Math.floor(value)) {
                // Full star
                star.classList.add('active');
            } else if (starNumber === Math.floor(value) + 1 && value % 1 !== 0) {
                // Half star
                star.classList.add('half');
            }
        });
    }`;
    
    content = content.replace(highlightPattern, newHighlightMethod);
    
    // Write the updated content
    fs.writeFileSync('script.js', content);
    console.log('Rating system updated successfully!');
}

updateRatingSystem();
