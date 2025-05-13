const express = require('express');
const router = express.Router();
const registrantPortalController = require('../controllers/registrantPortalController');
const registrantAuth = require('../middleware/registrantAuth');
const validateBody = require('../middleware/validate');
const registrantSchema = require('../validation/registrantSchema');

// Public routes (no authentication required)
router.post('/login', validateBody(registrantSchema.login), registrantPortalController.login);
router.post('/register', validateBody(registrantSchema.register), registrantPortalController.register);
router.post('/forgot-password', validateBody(registrantSchema.forgotPassword), registrantPortalController.forgotPassword);
router.post('/reset-password', validateBody(registrantSchema.resetPassword), registrantPortalController.resetPassword);
router.post('/verify', validateBody(registrantSchema.verify), registrantPortalController.verifyAccount);

// Protected routes (require registrant authentication)
router.get('/dashboard', registrantAuth, registrantPortalController.getDashboardData);
router.get('/profile', registrantAuth, registrantPortalController.getProfile);
router.put('/profile', registrantAuth, validateBody(registrantSchema.updateProfile), registrantPortalController.updateProfile);

// Route to download registrant's badge
router.get('/events/:eventId/registrants/:registrantId/badge', registrantAuth, registrantPortalController.downloadBadge);

router.get('/registration', registrantAuth, registrantPortalController.getCurrentRegistrant);
router.get('/payments', registrantAuth, registrantPortalController.getPayments);
router.get('/payments/:id/invoice', registrantAuth, registrantPortalController.getInvoice);

router.get('/events/:eventId', registrantAuth, registrantPortalController.getEventDetails);
router.get('/announcements', registrantAuth, registrantPortalController.getAnnouncements);
router.get('/resources', registrantAuth, registrantPortalController.getResources);
router.get('/resources/:id', registrantAuth, registrantPortalController.downloadResource);

router.get('/workshops', registrantAuth, registrantPortalController.getAvailableWorkshops);
router.post('/workshops/:id/register', registrantAuth, registrantPortalController.registerForWorkshop);

// Adjusted abstract routes to be event-specific
router.get('/events/:eventId/abstracts', registrantAuth, registrantPortalController.getAbstractsForEvent);
router.post('/events/:eventId/abstracts', registrantAuth, validateBody(registrantSchema.submitAbstract), registrantPortalController.submitAbstractForEvent);
router.get('/events/:eventId/abstracts/:abstractId', registrantAuth, registrantPortalController.getAbstractByIdForEvent);
router.put('/events/:eventId/abstracts/:abstractId', registrantAuth, validateBody(registrantSchema.updateAbstract), registrantPortalController.updateAbstractForEvent);

router.get('/certificates', registrantAuth, registrantPortalController.getCertificates);
router.get('/certificates/:id', registrantAuth, registrantPortalController.downloadCertificate);

module.exports = router; 