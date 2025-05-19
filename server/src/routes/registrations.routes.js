const express = require('express');
// Enable mergeParams to access :id from parent router (events.routes.js)
const router = express.Router({ mergeParams: true });
const { protect } = require('../middleware/auth.middleware');
const {
  getRegistrations,
  getRegistrationById,
  createRegistration,
  updateRegistration,
  deleteRegistration,
  checkInRegistration,
  importRegistrations,
  exportRegistrationsController,
  getRegistrationStatistics,
  getRegistrationDetailsByScan
} = require('../controllers/registration.controller');

// Import the router for resources related to a specific registration
const registrationResourceRouter = require('./registrationResource.routes');

// Protect all routes defined here
router.use(protect);

// Routes relative to the mount point (e.g., /api/events/:id/registrations)
router.route('/')
  .get(getRegistrations)    // Handles GET /api/events/:id/registrations
  .post(createRegistration);   // Handles POST /api/events/:id/registrations

// Route for bulk import
router.route('/import')
  .post(importRegistrations); // Handles POST /api/events/:id/registrations/import

// Route for export
router.route('/export')
  .get(exportRegistrationsController); // Handles GET /api/events/:id/registrations/export

// Route for statistics
router.route('/statistics')
  .get(getRegistrationStatistics);

// Add new scan route here
router.route('/scan')
  .post(getRegistrationDetailsByScan); // Handles POST /api/events/:eventId/registrations/scan

// Mount the registration-specific resource router at /:registrationId/resources
// This will handle paths like /api/events/:eventId/registrations/:registrationId/resources/ 
// and /api/events/:eventId/registrations/:registrationId/resources/:resourceUsageId/void
router.use('/:registrationId/resources', registrationResourceRouter);

// Routes for specific registration by its own ID (e.g., Mongo _id)
// IMPORTANT: Use a distinct param name like :registrationId to avoid conflict with parent :id
router.route('/:registrationId') 
  .get(getRegistrationById) // Handles GET /api/events/:id/registrations/:registrationId
  .put(updateRegistration)    // Handles PUT /api/events/:id/registrations/:registrationId
  .delete(deleteRegistration); // Handles DELETE /api/events/:id/registrations/:registrationId

// Route for check-in
router.route('/:registrationId/check-in')
  .patch(checkInRegistration); // Handles PATCH /api/events/:id/registrations/:registrationId/check-in

module.exports = router; 