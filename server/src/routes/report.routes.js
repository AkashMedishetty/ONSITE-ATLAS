const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate');
const reportValidation = require('../validations/report.validation');
const reportController = require('../controllers/report.controller');

// Base route is /api/reports

// Create a new report configuration
router.post(
  '/:eventId',
  protect,
  validate(reportValidation.createReport),
  reportController.createReport
);

// Get a report by ID
router.get(
  '/:eventId/:reportId',
  protect,
  validate(reportValidation.getReportById),
  reportController.getReportById
);

// Update a report configuration
router.put(
  '/:eventId/:reportId',
  protect,
  validate(reportValidation.updateReport),
  reportController.updateReport
);

// Delete a report
router.delete(
  '/:eventId/:reportId',
  protect,
  validate(reportValidation.deleteReport),
  reportController.deleteReport
);

// Get all reports for an event
router.get(
  '/:eventId',
  protect,
  validate(reportValidation.getReports),
  reportController.getReports
);

// Generate a report based on configuration
router.post(
  '/:eventId/:reportId/generate',
  protect,
  validate(reportValidation.generateReport),
  reportController.generateReport
);

// Schedule a report for periodic generation
router.post(
  '/:eventId/:reportId/schedule',
  protect,
  validate(reportValidation.scheduleReport),
  reportController.scheduleReport
);

// Export a report in the specified format
router.get(
  '/:eventId/:reportId/export',
  protect,
  validate(reportValidation.exportReport),
  reportController.exportReport
);

module.exports = router; 