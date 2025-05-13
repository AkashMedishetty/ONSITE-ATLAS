const express = require('express'); // Import express
const router = express.Router({ mergeParams: true }); // Initialize router
const { protect, restrict } = require('../middleware/auth.middleware'); // Changed restrictTo to restrict
const abstractController = require('../controllers/abstract.controller');

// Route for bulk assigning reviewers to abstracts
// This path assumes that this router will be mounted under /api in your main app.js
// resulting in the full path /api/events/:eventId/abstracts/assign-reviewers
router.post(
    '/events/:eventId/abstracts/assign-reviewers', // Keep this path as is for now based on frontend call
    protect,
    restrict('admin', 'staff'), // Changed restrictTo to restrict
    abstractController.assignReviewersToAbstracts
);

/**
 * @route   GET /events/:eventId/abstracts/download
 * @desc    Download all abstracts for an event (with optional filters: category, topic, minScore, maxScore, reviewer)
 * @access  Private/Admin
 * @query   exportMode=excel-single|excel-multi (optional)
 * @query   category=categoryId (optional)
 * @query   topic=topicName (optional)
 * @query   minScore=number (optional)
 * @query   maxScore=number (optional)
 * @query   reviewer=UserId (optional)
 */
router.get(
  '/events/:eventId/abstracts/download',
  protect,
  restrict('admin', 'staff'),
  abstractController.downloadAbstracts
);

// Add other abstract-related routes here if they belong in this file.
// For example:
// router.get('/events/:eventId/abstracts/all-event-abstracts', protect, abstractController.getAbstracts);
// router.get('/events/:eventId/abstracts/:id', protect, abstractController.getAbstract);
// Make sure these do not conflict with how abstract routes are defined elsewhere if this file is new or refactored.

module.exports = router; 