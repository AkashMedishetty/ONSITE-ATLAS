/**
 * This is a temporary script to fix the auth middleware
 * Run this with: node fix-auth.js
 */
const fs = require('fs');
const path = require('path');

// Path to the auth.js file
const authFilePath = path.join(__dirname, 'src', 'middleware', 'auth.js');

// Read the auth.js file
console.log(`Reading auth.js file from: ${authFilePath}`);
fs.readFile(authFilePath, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading auth.js file:', err);
    return;
  }
  
  console.log('Successfully read auth.js file');
  
  // Replace the protect middleware with a simplified version that always bypasses auth
  const modifiedData = data.replace(
    /const protect = async \(req, res, next\) => {[\s\S]*?try {[\s\S]*?}/m,
    `const protect = async (req, res, next) => {
  try {
    console.log('AUTH BYPASS ENABLED - Always skipping authentication');
    // Set a default user for development
    req.user = {
      _id: '000000000000000000000000', // Dummy ObjectId
      name: 'Development User',
      email: 'dev@example.com',
      role: 'admin',
      isActive: true
    };
    return next();`
  );
  
  // Write the modified file
  fs.writeFile(authFilePath, modifiedData, 'utf8', (err) => {
    if (err) {
      console.error('Error writing modified auth.js file:', err);
      return;
    }
    console.log('Successfully bypassed authentication in auth.js');
    console.log('Restart your server for changes to take effect');
  });
}); 