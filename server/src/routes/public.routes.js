const express = require('express');
const publicController = require('../controllers/publicController');

const router = express.Router();

// Public routes that don't require authentication
router.get('/events/:slug/landing', publicController.renderLandingPage);
router.get('/go/:shortCode', publicController.handleShortUrl);

module.exports = router; 