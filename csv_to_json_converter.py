#!/usr/bin/env python3
import csv
import json
import time
import random
from datetime import datetime

def generate_id():
    """Generate a unique ID similar to the JavaScript version"""
    timestamp = int(time.time() * 1000)
    random_part = ''.join(random.choices('abcdefghijklmnopqrstuvwxyz0123456789', k=8))
    return f"{timestamp:x}{random_part}"

def clean_value(value):
    """Clean and normalize CSV values"""
    if not value:
        return ''
    return str(value).strip().strip('"')

def parse_number(value):
    """Parse a string to integer, return None if invalid"""
    cleaned = clean_value(value)
    if not cleaned:
        return None
    try:
        return int(cleaned)
    except ValueError:
        return None

def parse_boolean(value):
    """Parse various boolean representations"""
    cleaned = clean_value(value).upper()
    return cleaned in ['TRUE', '1', 'YES']

def parse_rating(value):
    """Parse rating values like '5/5', '4.5/5', '4'"""
    cleaned = clean_value(value)
    if not cleaned:
        return 0
    
    # Handle formats like "5/5", "4.5/5"
    if '/' in cleaned:
        parts = cleaned.split('/')
        try:
            rating = float(parts[0])
            return rating
        except (ValueError, IndexError):
            return 0
    
    try:
        return float(cleaned)
    except ValueError:
        return 0

def parse_date(value):
    """Parse date in DD/MM/YYYY format to YYYY-MM-DD"""
    cleaned = clean_value(value)
    if not cleaned:
        return ''
    
    # Handle DD/MM/YYYY format
    if '/' in cleaned:
        parts = cleaned.split('/')
        if len(parts) == 3:
            try:
                day = parts[0].zfill(2)
                month = parts[1].zfill(2)
                year = parts[2]
                return f"{year}-{month}-{day}"
            except (IndexError, ValueError):
                pass
    
    return cleaned

def parse_gifted(value):
    """Check if book was gifted (has a name in the gifted column)"""
    cleaned = clean_value(value)
    return cleaned != '' and cleaned.lower() != 'false'

def determine_status(read_value, dnf_value):
    """Determine reading status based on Read and DNF columns"""
    read = parse_boolean(read_value)
    dnf = parse_boolean(dnf_value)
    
    if dnf:
        return 'dnf'
    if read:
        return 'read'
    return 'want-to-read'

def csv_to_json(csv_path, output_path):
    """Convert CSV to BookTracker JSON format"""
    books = []
    
    try:
        with open(csv_path, 'r', encoding='utf-8') as csvfile:
            # Use csv.reader to handle proper CSV parsing
            reader = csv.reader(csvfile)
            headers = next(reader)  # Read header row
            
            print(f"CSV Headers: {headers}")
            
            for row_num, row in enumerate(reader, start=2):  # Start at 2 because we skipped header
                if len(row) < len(headers):
                    print(f"Skipping incomplete row {row_num}: {row}")
                    continue
                
                # Map CSV columns to BookTracker format
                book = {
                    'id': generate_id(),
                    'title': clean_value(row[5]) or 'Unknown Title',  # Title
                    'author': clean_value(row[2]) or 'Unknown Author',  # Author
                    'series': clean_value(row[3]) or '',  # Series Title
                    'bookNumber': parse_number(row[4]),  # #In Series
                    'status': determine_status(row[0], row[1]),  # Read, DNF
                    'rating': parse_rating(row[15]),  # Rating
                    'mythicalElement': '',  # Not in CSV
                    'publisher': clean_value(row[16]) or '',  # Publisher
                    'pageCount': parse_number(row[6]),  # Page Count
                    'coverImage': '',  # Not in CSV
                    'edition': clean_value(row[7]) or '',  # Edition
                    
                    # Physical features
                    'digitallySigned': parse_boolean(row[8]),  # Digitally Signed  
                    'signed': parse_boolean(row[9]),  # Signed
                    'sprayedEdges': parse_boolean(row[10]),  # Sprayed Edges
                    'hiddenCover': parse_boolean(row[11]),  # Hidden Cover
                    'reversibleDustJacket': parse_boolean(row[12]),  # Reversable Dust Jacket
                    
                    # Reading dates
                    'startedReading': parse_date(row[13]),  # Started Reading
                    'finishedReading': parse_date(row[14]),  # Finished Reading
                    
                    # Other fields
                    'gifted': parse_gifted(row[17]),  # Gifted
                    'notes': '',  # Not in CSV
                    'dateAdded': datetime.now().isoformat()
                }
                
                books.append(book)
        
        # Write to JSON file
        with open(output_path, 'w', encoding='utf-8') as jsonfile:
            json.dump(books, jsonfile, indent=2, ensure_ascii=False)
        
        print(f"\nSuccessfully converted {len(books)} books to {output_path}")
        return books
        
    except Exception as e:
        print(f"Error converting CSV to JSON: {e}")
        raise

def main():
    csv_path = '/Users/crazybuy/Downloads/Copy of Booklist - Sheet1.csv'
    output_path = '/Users/crazybuy/Book Website/imported-books.json'
    
    try:
        books = csv_to_json(csv_path, output_path)
        
        print(f"\nConversion completed successfully!")
        print(f"Total books converted: {len(books)}")
        print(f"Output file: {output_path}")
        
        # Show some sample data
        print(f"\nSample books:")
        for i, book in enumerate(books[:3]):
            print(f"\n{i+1}. {book['title']} by {book['author']}")
            print(f"   Status: {book['status']}, Rating: {book['rating']}, Pages: {book['pageCount']}")
            
            physical_features = []
            if book['digitallySigned']:
                physical_features.append('Digitally Signed')
            if book['signed']:
                physical_features.append('Signed')
            if book['sprayedEdges']:
                physical_features.append('Sprayed Edges')
            if book['hiddenCover']:
                physical_features.append('Hidden Cover')
            if book['reversibleDustJacket']:
                physical_features.append('Reversible Dust Jacket')
            
            print(f"   Physical features: {', '.join(physical_features) if physical_features else 'None'}")
        
        # Show status summary
        status_counts = {}
        for book in books:
            status = book['status']
            status_counts[status] = status_counts.get(status, 0) + 1
        
        print(f"\nStatus Summary:")
        for status, count in status_counts.items():
            print(f"   {status}: {count}")
            
    except Exception as e:
        print(f"Failed to convert CSV: {e}")
        return 1
    
    return 0

if __name__ == '__main__':
    exit(main())
