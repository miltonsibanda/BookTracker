console.log('Testing better-sqlite3 installation...');

try {
    const Database = require('better-sqlite3');
    console.log('✅ better-sqlite3 is installed and can be loaded');
} catch (error) {
    console.error('❌ better-sqlite3 cannot be loaded:', error.message);
    console.log('This is the root cause of the 500 error');
    console.log('');
    console.log('To fix this issue:');
    console.log('1. Open a terminal');
    console.log('2. Navigate to the backend directory: cd backend');
    console.log('3. Install dependencies: npm install');
    console.log('4. Restart the server');
}

console.log('');
console.log('Checking package.json...');

try {
    const packageJson = require('./package.json');
    console.log('📦 Dependencies in package.json:');
    Object.keys(packageJson.dependencies).forEach(dep => {
        console.log(`  - ${dep}: ${packageJson.dependencies[dep]}`);
    });
} catch (error) {
    console.error('❌ Could not read package.json:', error.message);
}
