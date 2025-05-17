const express = require('express');
const { protect } = require('../middleware/auth.middleware');
const resourceController = require('../controllers/resource.controller');

const router = express.Router();

// Resource settings routes
router.route('/settings')
  .get(resourceController.getResourceSettings)
  .put(protect, resourceController.updateResourceSettings);

// Validate scan route
router.route('/validate-scan')
  .post(protect, resourceController.validateResourceScan);

// Record usage route
router.route('/record-usage')
  .post(protect, resourceController.recordResourceUsage);

// Recent scans route
router.route('/recent-scans')
  .get(protect, resourceController.getRecentScans);

// Route for getting resource statistics for a specific type
router.get('/statistics/:eventId/:resourceType', protect, resourceController.getResourceTypeStatistics);

// Main resource routes
router.route('/')
  .get(protect, resourceController.getResources)
  .post(protect, resourceController.createResource);

// Certificate Template Upload Route
router.post('/certificate-template/upload', protect, resourceController.uploadCertificateTemplateFile);

// New route for generating a specific certificate PDF for a registrant
router.get('/events/:eventId/certificate-templates/:templateId/registrations/:registrationId/generate-pdf',
    protect, // Or a more specific role/permission check if needed
    resourceController.generateCertificatePdf
);

module.exports = router; 