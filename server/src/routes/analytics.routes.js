const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate');
const analyticsValidation = require('../validations/analytics.validation');
const analyticsController = require('../controllers/analytics.controller');

// Base route is /api/analytics

// Get registration analytics
router.get(
  '/:eventId/registration',
  protect,
  validate(analyticsValidation.getRegistrationAnalytics),
  analyticsController.getRegistrationAnalytics
);

// Get financial analytics (admin/manager only)
router.get(
  '/:eventId/financial',
  protect,
  validate(analyticsValidation.getFinancialAnalytics),
  analyticsController.getFinancialAnalytics
);

// Get workshop analytics
router.get(
  '/:eventId/workshops',
  protect,
  validate(analyticsValidation.getWorkshopAnalytics),
  analyticsController.getWorkshopAnalytics
);

// Get abstract analytics
router.get(
  '/:eventId/abstracts',
  protect,
  validate(analyticsValidation.getAbstractAnalytics),
  analyticsController.getAbstractAnalytics
);

// Get sponsor analytics
router.get(
  '/:eventId/sponsors',
  protect,
  validate(analyticsValidation.getSponsorAnalytics),
  analyticsController.getSponsorAnalytics
);

// Export analytics data
router.get(
  '/:eventId/export/:type',
  protect,
  validate(analyticsValidation.exportAnalyticsData),
  analyticsController.exportAnalyticsData
);

module.exports = router; 