const express = require('express');
const router = express.Router();

// Get environment variables (safe version for debugging)
router.get('/env', (req, res) => {
  // Return a safe subset of environment variables
  res.json({
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    BYPASS_AUTH: process.env.BYPASS_AUTH,
    // Don't include sensitive information like database connection strings or secrets
  });
});

// Health check route
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'Server is running'
  });
});

module.exports = router; 