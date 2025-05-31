const express = require('express');
const router = express.Router();

// Import all route modules
const eventRoutes = require('./events.routes');
const userRoutes = require('./user.routes');
const authRoutes = require('./auth.routes');
const registrationRoutes = require('./registration.routes');
const registrationResourceRoutes = require('./registrationResource.routes');
const dashboardRoutes = require('./dashboard.routes');
const analyticsRoutes = require('./analytics.routes');
const reportRoutes = require('./report.routes');
const categoryRoutes = require('./categories.routes');
const resourceRoutes = require('./resources.routes');
const importJobRoutes = require('./importJob.routes');
const abstractRoutes = require('./abstract.routes.js'); // IMPORT abstract.routes
const registrantPortalRoutesFile = require('./registrantPortalRoutes.js'); // CORRECTED FILENAME (plural Routes)
const scheduleRoutes = require('./schedule.routes'); // IMPORT schedule.routes
const sponsorAuthRoutes = require('./sponsorAuth.routes'); // Added Sponsor Auth Routes
const registrationResourceModalRoutes = require('./registrationResourceModal.routes');
const clientPortalRoutes = require('./clientPortal.routes');
const clientBulkImportRoutes = require('./clientBulkImport.routes');

// Mount routes
router.use('/events', eventRoutes);
router.use('/users', userRoutes);
router.use('/auth', authRoutes);
router.use('/sponsor-auth', sponsorAuthRoutes); // Added Sponsor Auth Routes
router.use('/events/:eventId/registrations', registrationRoutes);
router.use('/events', registrationResourceRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/reports', reportRoutes);

// Mount resource and category routes at root level
router.use('/categories', categoryRoutes);
router.use('/resources', resourceRoutes);

// Also mount them at event level for backward compatibility or specific needs
router.use('/events/:eventId/categories', categoryRoutes);
router.use('/import-jobs', importJobRoutes);

// Mount abstractRoutes. Since paths in abstract.routes.js start with /events/...
// and this main router is mounted under /api, this should correctly establish paths like /api/events/:eventId/abstracts/...
// Abstract routes (including /events/:eventId/abstracts/download with score filtering support)
router.use(abstractRoutes); // MOUNT abstractRoutes

// Mount schedule routes
router.use(scheduleRoutes); // MOUNT scheduleRoutes

// Mount registrant portal routes
router.use('/registrant-portal', registrantPortalRoutesFile); // Use the correctly required file

router.use(registrationResourceModalRoutes);

router.use('/client-portal', clientPortalRoutes);

router.use('/client-bulk-import', clientBulkImportRoutes);

module.exports = router; 