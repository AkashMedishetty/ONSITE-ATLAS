const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect, restrict } = require('../middleware/auth.middleware');
const { 
  getUsers, 
  createUser, 
  getUserById, 
  updateUser, 
  deleteUser,
  getAssignedAbstractsForReviewer
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

module.exports = router; 