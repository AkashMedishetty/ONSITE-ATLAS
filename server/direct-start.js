/**
 * Direct server start script that bypasses nodemon
 * Use this to directly start the server without the watching/restarting behavior
 */

console.log('Starting server directly...');

// Import and run the server directly
require('./src/server');

console.log('Server module imported, server should be running...');

// Keep the process alive explicitly
setInterval(() => {
  console.log('Direct starter heartbeat - server should be running');
}, 30000);

// Prevent accidental exits
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception in direct-start.js:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection in direct-start.js:', reason);
});

console.log('Direct start script running, server should be active...'); 