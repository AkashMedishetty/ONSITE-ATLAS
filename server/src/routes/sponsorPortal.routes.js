const express = require('express');
const router = express.Router();
const sponsorPortalController = require('../controllers/sponsorPortal.controller');
const { protect } = require('../middleware/auth.middleware');

// Dashboard endpoint
router.get(
  '/me/dashboard',
  protect,
  sponsorPortalController.getSponsorDashboard
);

// Registrant list and export endpoint
router.get(
  '/me/registrants',
  protect,
  sponsorPortalController.getSponsorPortalRegistrants
);

// Add registrant endpoint
router.post(
  '/me/registrants',
  protect,
  sponsorPortalController.addSponsorPortalRegistrant
);

// Edit registrant endpoint
router.put(
  '/me/registrants/:id',
  protect,
  sponsorPortalController.editSponsorPortalRegistrant
);

// Delete registrant endpoint
router.delete(
  '/me/registrants/:id',
  protect,
  sponsorPortalController.deleteSponsorPortalRegistrant
);

// Bulk import registrants endpoint
router.post(
  '/me/registrants/bulk-import',
  protect,
  sponsorPortalController.bulkImportSponsorPortalRegistrants
);

// Export registrants endpoint
router.get(
  '/me/registrants/export',
  protect,
  sponsorPortalController.exportSponsorPortalRegistrants
);

// Add sponsor categories endpoint
router.get(
  '/me/categories',
  protect,
  sponsorPortalController.getSponsorCategories
);

module.exports = router; 