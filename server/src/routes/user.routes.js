const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect, restrict } = require('../middleware/auth.middleware');
const { 
  getUsers, 
  createUser, 
  getUserById, 
  updateUser, 
  deleteUser,
  getAssignedAbstractsForReviewer,
  exportReviewerAbstractDetails,
  downloadReviewerAbstractFiles
} = require('../controllers/user.controller');

// User routes
router.route('/')
  .get(protect, getUsers)
  .post(protect, restrict('admin'), createUser);

// User by ID routes
router.route('/:id')
  .get(protect, getUserById)
  .put(protect, updateUser)
  .delete(protect, deleteUser);

// Route for logged-in user to get their assigned abstracts for review
router.route('/me/reviewer/assigned-abstracts')
  .get(protect, getAssignedAbstractsForReviewer);

// New route for reviewer to export assigned abstract details
router.route('/me/reviewer/events/:eventId/export-assigned-details')
  .get(protect, restrict('reviewer'), exportReviewerAbstractDetails);

// New route for reviewer to download assigned abstract files
router.route('/me/reviewer/events/:eventId/download-assigned-files')
  .get(protect, restrict('reviewer'), downloadReviewerAbstractFiles);

module.exports = router; 