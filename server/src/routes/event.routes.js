const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect, restrict } = require('../middleware/auth.middleware');
const {
  getEvents,
  createEvent,
  getEventById,
  updateEvent,
  deleteEvent,
  getEventDashboard,
  getEventStatistics,
  getRegistrationCountsByCategory,
  getBadgeSettings,
  getResourceConfig,
  getEventReviewers,
  getEventRegistrantCounts
} = require('../controllers/event.controller');

// Import the new user controller function
const { getUsersForEvent } = require('../controllers/user.controller');

// Import the email routes
const emailRoutes = require('./email.routes');

// Route for abstracts settings
router.route('/:id/abstract-settings')
  .put(protect, async (req, res) => {
    try {
      const { id } = req.params;
      const { settings } = req.body;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Event ID is required'
        });
      }
      
      if (!settings) {
        return res.status(400).json({
          success: false, 
          message: 'Abstract settings are required'
        });
      }
      
      // Update the event with the new abstract settings
      const event = await require('../models/Event').findByIdAndUpdate(
        id,
        { $set: { abstractSettings: settings } },
        { new: true, runValidators: true }
      );
      
      if (!event) {
        return res.status(404).json({
          success: false,
          message: `Event not found with ID: ${id}`
        });
      }
      
      return res.status(200).json({
        success: true,
        message: 'Abstract settings updated successfully',
        data: event.abstractSettings
      });
    } catch (error) {
      console.error(`Error updating abstract settings: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: 'Error updating abstract settings',
        error: error.message
      });
    }
  });

// Other event routes
router.route('/')
  .get(getEvents)
  .post(protect, createEvent);

router.route('/:id')
  .get(getEventById)
  .put(protect, updateEvent)
  .delete(protect, deleteEvent);

router.route('/:id/stats')
  .get(protect, getEventStatistics);

router.route('/:id/dashboard')
  .get(protect, getEventDashboard);

router.route('/:eventId/registrations/counts-by-category')
  .get(protect, getRegistrationCountsByCategory);

// Add route for getting badge settings
router.route('/:id/badge-settings')
  .get(protect, getBadgeSettings);

router.route('/:id/publish')
  .put(protect, (req, res) => {
    res.status(501).json({ message: "Not implemented yet" });
  });

router.route('/:id/unpublish')
  .put(protect, (req, res) => {
    res.status(501).json({ message: "Not implemented yet" });
  });

// Get Event Resource Config
router.get('/:id/resource-config', protect, restrict('admin', 'staff'), getResourceConfig);

// Route to get reviewers for an event's abstract workflow
router.route('/:eventId/abstract-workflow/reviewers')
  .get(protect, restrict('admin', 'staff', 'event-manager'), getEventReviewers);

// Route to get users for a specific event
router.route('/:eventId/users')
  .get(protect, restrict('admin', 'manager', 'staff'), getUsersForEvent);

// Mount the email routes
router.use('/:eventId/emails', emailRoutes);

module.exports = router; 