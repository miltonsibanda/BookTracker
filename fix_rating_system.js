// Fix the rating system to work with 5 visible stars and half-star support
const fs = require('fs');

let content = fs.readFileSync('script.js', 'utf8');

// Find and replace the setupRatingInputs method
const setupRatingPattern = /setupRatingInputs\(\) \{[\s\S]*?\n    \}/;

const newSetupRatingMethod = `setupRatingInputs() {
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
    }`;

content = content.replace(setupRatingPattern, newSetupRatingMethod);

// Find and replace the highlightRating method
const highlightRatingPattern = /highlightRating\(value\) \{[\s\S]*?\n    \}/;

const newHighlightRatingMethod = `highlightRating(value) {
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
    }`;

content = content.replace(highlightRatingPattern, newHighlightRatingMethod);

// Write the updated content back to the file
fs.writeFileSync('script.js', content);
console.log('Rating system has been updated successfully!');
