/**
 * Server wrapper script to ensure the Node.js process stays alive
 * This helps prevent the "clean exit" issue with nodemon
 */

// Start the actual server in a separate process
const { spawn } = require('child_process');
const path = require('path');

console.log('Starting server through wrapper...');

// Spawn the actual server process with detailed logging
const serverProcess = spawn('node', [
  '--trace-warnings',
  path.join(__dirname, 'src/server.js')
], {
  stdio: 'inherit', // This passes the IO directly to the parent process
  detached: false,  // Keep the child process linked to parent
  env: {
    ...process.env,
    DEBUG: 'true',  // Enable debug mode
    FORCE_COLOR: '1' // Ensure colors are preserved
  }
});

// Log server process PID
console.log(`Server process started with PID: ${serverProcess.pid}`);

// Also handle events from the child process
serverProcess.on('error', (err) => {
  console.error('Failed to start server process:', err);
});

serverProcess.on('close', (code, signal) => {
  console.log(`Server process exited with code ${code} and signal ${signal}`);
});

// Keep this wrapper script running with a shorter interval for debugging
const keepAlive = setInterval(() => {
  console.log(`[WRAPPER] Heartbeat - Server process running: ${!serverProcess.killed}`);
}, 30000); // Log every 30 seconds

// Handle wrapper process signals
process.on('SIGTERM', () => {
  console.log('Wrapper received SIGTERM, forwarding to server process...');
  clearInterval(keepAlive);
  serverProcess.kill('SIGTERM');
});

process.on('SIGINT', () => {
  console.log('Wrapper received SIGINT, forwarding to server process...');
  clearInterval(keepAlive);
  serverProcess.kill('SIGINT');
});

// Log that wrapper is initialized and running
console.log('Wrapper initialized and running...');

// Keep reference to server process
module.exports = serverProcess; 