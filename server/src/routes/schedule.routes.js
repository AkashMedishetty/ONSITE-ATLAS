const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/schedule.controller');
const { authenticate, authorize } = require('../middleware/auth');

// Public routes (no authentication required)
router.get('/events/current/schedule', scheduleController.getCurrentEventSchedule);
router.get('/events/:eventId/schedule', scheduleController.getEventSchedule);

// Admin-only routes (authentication required + admin role)
router.post('/admin/events/:eventId/schedule', authenticate, authorize(['admin']), scheduleController.createSchedule);
router.put('/admin/events/:eventId/schedule', authenticate, authorize(['admin']), scheduleController.updateSchedule);
router.delete('/admin/events/:eventId/schedule', authenticate, authorize(['admin']), scheduleController.deleteSchedule);

module.exports = router; 
