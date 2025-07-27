// CSV to BookTracker JSON Converter
const fs = require('fs');
const path = require('path');

function csvToJson(csvPath, outputPath) {
    try {
        // Read the CSV file
        const csvContent = fs.readFileSync(csvPath, 'utf-8');
        const lines = csvContent.trim().split('\n');
        
        // Parse header
        const headers = lines[0].split(',').map(header => header.trim());
        console.log('CSV Headers:', headers);
        
        // Initialize books array
        const books = [];
        
        // Process each data row
        for (let i = 1; i < lines.length; i++) {
            const values = parseCSVLine(lines[i]);
            
            if (values.length < headers.length) {
                console.log(`Skipping incomplete row ${i}: ${lines[i]}`);
                continue;
            }
            
            // Map CSV data to BookTracker format
            const book = {
                id: generateId(),
                title: cleanValue(values[5]) || 'Unknown Title', // Title
                author: cleanValue(values[2]) || 'Unknown Author', // Author
                series: cleanValue(values[3]) || '', // Series Title
                bookNumber: parseNumber(values[4]) || null, // #In Series
                status: determineStatus(values[0], values[1]), // Read, DNF
                rating: parseRating(values[15]) || 0, // Rating
                mythicalElement: '', // Not in CSV
                publisher: cleanValue(values[16]) || '', // Publisher
                pageCount: parseNumber(values[6]) || null, // Page Count
                coverImage: '', // Not in CSV
                edition: cleanValue(values[7]) || '', // Edition
                
                // Physical features
                digitallySigned: parseBoolean(values[8]), // Digitally Signed
                signed: parseBoolean(values[9]), // Signed
                sprayedEdges: parseBoolean(values[10]), // Sprayed Edges
                hiddenCover: parseBoolean(values[11]), // Hidden Cover
                reversibleDustJacket: parseBoolean(values[12]), // Reversable Dust Jacket (note: misspelled in CSV)
                
                // Reading dates
                startedReading: parseDate(values[13]) || '', // Started Reading
                finishedReading: parseDate(values[14]) || '', // Finished Reading
                
                // Other fields
                gifted: parseGifted(values[17]), // Gifted
                notes: '', // Not in CSV
                dateAdded: new Date().toISOString()
            };
            
            books.push(book);
        }
        
        // Write to JSON file
        fs.writeFileSync(outputPath, JSON.stringify(books, null, 2));
        console.log(`Successfully converted ${books.length} books to ${outputPath}`);
        
        return books;
        
    } catch (error) {
        console.error('Error converting CSV to JSON:', error);
        throw error;
    }
}

// Helper functions
function parseCSVLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"' && (i === 0 || line[i-1] === ',')) {
            inQuotes = true;
        } else if (char === '"' && inQuotes && (i === line.length - 1 || line[i+1] === ',')) {
            inQuotes = false;
        } else if (char === ',' && !inQuotes) {
            values.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    values.push(current); // Add the last value
    
    return values;
}

function cleanValue(value) {
    if (!value) return '';
    return value.trim().replace(/^"(.*)"$/, '$1'); // Remove surrounding quotes
}

function parseNumber(value) {
    const cleaned = cleanValue(value);
    const num = parseInt(cleaned, 10);
    return isNaN(num) ? null : num;
}

function parseBoolean(value) {
    const cleaned = cleanValue(value).toUpperCase();
    return cleaned === 'TRUE' || cleaned === '1' || cleaned === 'YES';
}

function parseRating(value) {
    const cleaned = cleanValue(value);
    if (!cleaned) return 0;
    
    // Handle formats like "5/5", "4.5/5", "4"
    if (cleaned.includes('/')) {
        const parts = cleaned.split('/');
        const rating = parseFloat(parts[0]);
        return isNaN(rating) ? 0 : rating;
    }
    
    const rating = parseFloat(cleaned);
    return isNaN(rating) ? 0 : rating;
}

function parseDate(value) {
    const cleaned = cleanValue(value);
    if (!cleaned) return '';
    
    // Handle DD/MM/YYYY format
    if (cleaned.includes('/')) {
        const parts = cleaned.split('/');
        if (parts.length === 3) {
            const day = parts[0].padStart(2, '0');
            const month = parts[1].padStart(2, '0');
            const year = parts[2];
            return `${year}-${month}-${day}`;
        }
    }
    
    return cleaned;
}

function parseGifted(value) {
    const cleaned = cleanValue(value);
    // If there's a name in the Gifted column, it means it was gifted
    return cleaned !== '' && cleaned.toLowerCase() !== 'false';
}

function determineStatus(readValue, dnfValue) {
    const read = parseBoolean(readValue);
    const dnf = parseBoolean(dnfValue);
    
    if (dnf) return 'dnf';
    if (read) return 'read';
    return 'want-to-read';
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Main execution
const csvPath = '/Users/crazybuy/Downloads/Copy of Booklist - Sheet1.csv';
const outputPath = '/Users/crazybuy/Book Website/imported-books.json';

try {
    const books = csvToJson(csvPath, outputPath);
    console.log('\nConversion completed successfully!');
    console.log(`Total books converted: ${books.length}`);
    console.log(`Output file: ${outputPath}`);
    
    // Show some sample data
    console.log('\nSample books:');
    books.slice(0, 3).forEach((book, index) => {
        console.log(`\n${index + 1}. ${book.title} by ${book.author}`);
        console.log(`   Status: ${book.status}, Rating: ${book.rating}, Pages: ${book.pageCount}`);
        console.log(`   Physical features: ${Object.entries({
            'Digitally Signed': book.digitallySigned,
            'Signed': book.signed, 
            'Sprayed Edges': book.sprayedEdges,
            'Hidden Cover': book.hiddenCover,
            'Reversible Dust Jacket': book.reversibleDustJacket
        }).filter(([key, value]) => value).map(([key]) => key).join(', ') || 'None'}`);
    });
    
} catch (error) {
    console.error('Failed to convert CSV:', error);
    process.exit(1);
}
