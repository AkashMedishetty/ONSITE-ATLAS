const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const registrationResourceModalController = require('../controllers/registrationResourceModal.controller');

// GET enriched resource usage for a registration (for modal)
router.get('/events/:eventId/registrations/:registrationId/resource-usage-modal',
  protect,
  registrationResourceModalController.getRegistrationResourceUsageModal
);

module.exports = router; 