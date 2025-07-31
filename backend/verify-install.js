#!/usr/bin/env node

console.log('🔧 BookTracker Backend Dependency Check\n');

// Check if we're in the right directory
const fs = require('fs');
const path = require('path');

if (!fs.existsSync('package.json')) {
    console.error('❌ Error: package.json not found');
    console.error('   Make sure you run this from the backend directory');
    console.error('   Usage: cd backend && node verify-install.js');
    process.exit(1);
}

// Check package.json
const packageJson = require('./package.json');
console.log('📦 Package.json found');
console.log(`   Name: ${packageJson.name}`);
console.log(`   Version: ${packageJson.version}\n`);

// Check each dependency
console.log('🔍 Checking dependencies:');
const deps = packageJson.dependencies || {};
const missingDeps = [];

Object.keys(deps).forEach(dep => {
    try {
        require.resolve(dep);
        console.log(`   ✅ ${dep}`);
    } catch (error) {
        console.log(`   ❌ ${dep} - NOT INSTALLED`);
        missingDeps.push(dep);
    }
});

console.log('\n📊 Summary:');
if (missingDeps.length === 0) {
    console.log('✅ All dependencies are installed!');
    console.log('\n🧪 Testing database initialization...');
    
    try {
        const BookDatabase = require('./database');
        const db = new BookDatabase();
        console.log('✅ Database initialization successful');
        
        // Test database operations
        const stats = db.getStats();
        console.log(`✅ Database stats: ${stats.totalBooks} books`);
        
        db.close();
        console.log('✅ All tests passed! Backend should work correctly.');
        
    } catch (error) {
        console.error('❌ Database test failed:', error.message);
        console.error('   Check the database configuration');
    }
    
} else {
    console.log(`❌ Missing ${missingDeps.length} dependencies:`);
    missingDeps.forEach(dep => console.log(`   - ${dep}`));
    console.log('\n🔧 To fix this, run:');
    console.log('   npm install');
    console.log('\n   Or install missing packages individually:');
    missingDeps.forEach(dep => console.log(`   npm install ${dep}`));
}
