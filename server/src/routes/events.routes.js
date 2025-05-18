const express = require('express');
const router = express.Router();
const { protect, restrict } = require('../middleware/auth.middleware');
const {
  getEvents,
  createEvent,
  getEventById,
  updateEvent,
  deleteEvent,
  getEventDashboard,
  getEventStatistics,
  getEventResourceConfig,
  getAbstractSettings,
  updateAbstractSettings,
  getBadgeSettings,
  updateBadgeSettings,
  getEmailSettings,
  updateEmailSettings,
  getPortalSettings,
  updatePortalSettings
} = require('../controllers/event.controller');
const { getEventResourceStatistics, exportResourceUsage } = require('../controllers/resource.controller');
const { createCategory, getCategories } = require('../controllers/category.controller');
const { validate, schemas } = require('../middleware/validator');

// --- Import Registration Router --- 
const registrationRouter = require('./registrations.routes');
// --- Import Resource Router ---
const resourceRouter = require('./resource.routes');
// --- Import Announcement Router ---
const announcementRouter = require('./announcementRoutes.js');

// --- Import Category Router (if not already done elsewhere) ---
// Assuming category routes are handled here or imported as needed
// const categoryRouter = require('./category.routes'); 

// Get all events and create new event
router.route('/')
  .get(getEvents)
  .post(protect, createEvent);

// Event by ID routes
router.route('/:id')
  .get(getEventById)
  .put(protect, updateEvent)
  .delete(protect, restrict('admin'), deleteEvent);

// Event dashboard
router.route('/:id/dashboard')
  .get(protect, getEventDashboard);

// Event statistics
router.route('/:id/stats')
  .get(protect, getEventStatistics);

// Event Resource Configuration
router.route('/:id/resource-config')
  .get(protect, getEventResourceConfig);

// --- Mount Nested Routers --- 

// Handle category routes specific to an event
router.route('/:id/categories')
  // Get categories for a specific event
  .get(protect, getCategories) 
  // Create a new category for a specific event
  .post(protect, createCategory);
  
// Mount the registration router for paths starting with /:id/registrations
// This handles GET /, POST /, GET /:regId, PUT /:regId, DELETE /:regId relative to the mount point
router.use('/:id/registrations', registrationRouter); 

// Mount the resource router for paths starting with /:id/resources
router.use('/:id/resources', resourceRouter);

// Mount the abstract router
router.use('/:eventId/abstracts', require('./abstracts.routes'));

// Mount the landing page router
router.use('/:eventId/landing-pages', require('./landingPages.routes'));

// Mount the announcement router for paths starting with /:id/announcements
// Note: Ensure :id parameter name consistency with other event-specific routes.
router.use('/:id/announcements', announcementRouter);

// --- End Mount Nested Routers --- 

// Abstract settings route
router.route('/:id/abstract-settings')
  .get(getAbstractSettings)
  .put(updateAbstractSettings);

// Resource statistics endpoint for the event
router.get('/:id/resources/statistics', protect, getEventResourceStatistics);

// --- ADD Resource Export Route --- 
router.get('/:id/resources/export', protect, exportResourceUsage);

// Badge routes
router.route('/:id/badge-settings')
  .get(getBadgeSettings)
  .put(updateBadgeSettings);

// Email Settings routes
router.route('/:id/email-settings')
  .get(getEmailSettings)
  .put(updateEmailSettings);

// Event Portal Settings Routes
router.route('/:id/portal-settings')
  .get(getPortalSettings)
  .put(updatePortalSettings);

module.exports = router;