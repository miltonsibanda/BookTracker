# 🔧 Fix for 500 Internal Server Error

## Problem Diagnosis

The 500 Internal Server Error is caused by missing Node.js dependencies in the backend server. Specifically, the `better-sqlite3` and other packages listed in `package.json` are not installed.

## Root Cause

Looking at the error stack trace:
```
POST http://192.168.1.159:8081/api/books 500 (Internal Server Error)
```

The server fails when trying to initialize the database because it cannot load the `better-sqlite3` module, which is required by the `BookDatabase` class.

## Quick Fix

Run these commands in your terminal:

```bash
# Navigate to the backend directory
cd "Book Website/backend"

# Install all dependencies
npm install

# Start the server
npm start
```

## Verification Steps

1. After running `npm install`, you should see `better-sqlite3` and other packages being installed
2. The `backend/node_modules` directory should contain the `better-sqlite3` folder
3. When you restart the server, you should see:
   ```
   ✅ Database initialized successfully
   🚀 BookTracker API server running on port 3001
   ```
4. Try adding a book from the frontend - it should work without the 500 error

## Alternative: Manual Installation

If the above doesn't work, try installing the specific packages individually:

```bash
cd "Book Website/backend"
npm install better-sqlite3
npm install express cors helmet compression
npm start
```

## Expected Outcome

After installing the dependencies:
- The 500 error will be resolved
- Books can be added, edited, and deleted successfully
- The backend will create a SQLite database in `backend/data/booktracker.db`
- All API endpoints will function properly

## Files Modified

Created diagnostic files:
- `backend/diagnose.js` - For troubleshooting
- `backend/test-db.js` - For testing database functionality
- `install-backend.sh` - Installation script

## Next Steps

1. Install the dependencies as shown above
2. Test the book creation functionality
3. If everything works, the filter functionality should also work properly since the issue was with the empty dataset, not the filter logic itself
