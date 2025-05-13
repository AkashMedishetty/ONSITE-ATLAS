const express = require('express');
const router = express.Router();
const registrantController = require('../controllers/registrant.controller');
const { protectRegistrant } = require('../middleware/auth');
const registrantPortalController = require('../controllers/registrantPortal.controller');
const abstractController = require('../controllers/abstract.controller');
const registrantAbstractController = require('../controllers/registrant.abstract.controller');

// Public routes
router.post('/login', registrantController.login);
router.post('/forgot-password', registrantController.forgotPassword);
router.put('/reset-password/:resettoken', registrantController.resetPassword);

// Protected routes - User Profile
router.get('/profile', protectRegistrant, registrantController.getProfile);
router.put('/profile', protectRegistrant, registrantController.updateProfile);

// Portal Dashboard routes
router.get('/dashboard', protectRegistrant, registrantPortalController.getDashboard);
router.get('/events/current', protectRegistrant, registrantPortalController.getCurrentEventDetails);

// Abstract routes for registrants
router.get('/abstracts', protectRegistrant, registrantAbstractController.getRegistrantAbstracts);
router.get('/abstracts/:abstractId', protectRegistrant, registrantAbstractController.getRegistrantAbstractById);
router.post('/abstracts', protectRegistrant, registrantAbstractController.createRegistrantAbstract);
router.put('/abstracts/:abstractId', protectRegistrant, registrantAbstractController.updateRegistrantAbstract);
router.delete('/abstracts/:abstractId', protectRegistrant, registrantAbstractController.deleteRegistrantAbstract);
router.get('/abstracts/:abstractId/download', protectRegistrant, registrantAbstractController.downloadAbstract);
router.get('/events/:eventId/abstracts', protectRegistrant, abstractController.getAbstracts);

module.exports = router; 