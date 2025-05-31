const express = require('express');
const router = express.Router();
const clientPortalController = require('../controllers/clientPortal.controller');
const { protectClient, protectAdmin } = require('../middleware/auth.middleware');

// Client Portal Auth
router.post('/auth/login', clientPortalController.loginClient);
router.post('/auth/logout', protectClient, clientPortalController.logoutClient);

// Client Portal Self-Service
router.get('/me/dashboard', protectClient, clientPortalController.getClientDashboard);
router.get('/me/registrants', protectClient, clientPortalController.getClientRegistrants);
router.post('/me/registrants/bulk-import', protectClient, clientPortalController.bulkImportClientRegistrants);
router.get('/me/registrants/export', protectClient, clientPortalController.exportClientRegistrants);
router.get('/me/abstracts', protectClient, clientPortalController.getClientAbstracts);
router.get('/me/sponsors', protectClient, clientPortalController.getClientSponsors);
router.get('/me/categories', protectClient, clientPortalController.getClientCategories);
router.get('/me/payments', protectClient, clientPortalController.getClientPayments);
router.get('/me/workshops', protectClient, clientPortalController.getClientWorkshops);
router.get('/me/reports', protectClient, clientPortalController.getClientReports);
router.get('/me/reports/export', protectClient, clientPortalController.exportClientReport);
router.get('/me/analytics', protectClient, clientPortalController.getClientAnalytics);
router.get('/me/recent', protectClient, clientPortalController.getClientRecent);
router.post('/me/registrants', protectClient, clientPortalController.addClientRegistrant);

// Admin CRUD for Event Clients
router.get('/admin/event-clients', protectAdmin, clientPortalController.listEventClients);
router.post('/admin/event-clients', protectAdmin, clientPortalController.createEventClient);
router.put('/admin/event-clients/:id', protectAdmin, clientPortalController.updateEventClient);
router.delete('/admin/event-clients/:id', protectAdmin, clientPortalController.deleteEventClient);
router.post('/admin/event-clients/:id/reset-password', protectAdmin, clientPortalController.resetEventClientPassword);

module.exports = router; 