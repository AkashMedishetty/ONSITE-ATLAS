// This is a minimal server script to test if Node.js is working properly
const http = require('http');

console.log('Starting pre-start test server...');

const server = http.createServer((req, res) => {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('Pre-start test server is running\n');
});

server.listen(3000, () => {
  console.log('Pre-start test server running on port 3000');
  console.log('If you see this message, Node.js is able to start and keep a server running');
});

// Keep the server running for 10 seconds then exit
setTimeout(() => {
  console.log('Pre-start test completed successfully');
  process.exit(0);
}, 10000); 