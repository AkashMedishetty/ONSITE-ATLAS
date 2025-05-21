const express = require('express');
const {
  getAbstracts,
  getAbstract,
  createAbstract,
  updateAbstract,
  deleteAbstract,
  updateAbstractStatus,
  addReviewComment,
  uploadAbstractFile,
  downloadAbstracts,
  getAbstractStatistics,
  submitIndividualReview,
  assignAbstractReviewer,
  downloadAbstractAttachment,
  approveAbstract,
  rejectAbstract,
  requestRevision,
  resubmitRevisedAbstract,
  getAbstractsByRegistration,
  getAbstractsWithReviewProgress,
  autoAssignReviewers
} = require('../controllers/abstract.controller');

// Include middleware
const { protect, protectRegistrant, restrict } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validator.js');

// Include validation schemas
const schemas = require('../validation/abstract.schemas');

// Enable params from merged routes
const router = express.Router({ mergeParams: true });

// --- Define MOST SPECIFIC Admin/Staff routes FIRST ---

// Admin/Staff get all abstracts for the event
router.route('/all-event-abstracts')
  .get(protect, restrict('admin', 'staff', 'reviewer'), getAbstracts);

// Statistics - Admin/Staff/Reviewer
router.route('/statistics')
  .get(protect, restrict('admin', 'staff', 'reviewer'), getAbstractStatistics);

// Download - Admin/Staff
router.route('/download')
  .get(protect, restrict('admin', 'staff'), downloadAbstracts);

// New route for abstracts pending review with progress stats
router.route('/pending-review-progress')
  .get(protect, restrict('admin', 'staff'), getAbstractsWithReviewProgress);

// --- Define Admin/Reviewer routes for SPECIFIC abstract MANAGEMENT (using /:id/...) ---
// These are more specific than the generic /:id routes for registrants

router.route('/:id/status')
  .put(protect, restrict('admin', 'reviewer'), validate(schemas.updateStatus), updateAbstractStatus);

router.route('/:id/comments')
  .post(protect, restrict('admin', 'reviewer'), validate(schemas.addComment), addReviewComment);

router.route('/:id/reviews')
  .post(protect, restrict('admin', 'reviewer'), submitIndividualReview);

// Add this route for review submission via /:id/review
router.route('/:id/review')
  .post(protect, restrict('admin', 'reviewer'), submitIndividualReview);

router.route('/:id/assign-reviewer')
  .post(protect, restrict('admin'), assignAbstractReviewer);

// New Admin/Staff decision routes
router.route('/:id/approve')
  .put(protect, restrict('admin', 'staff'), approveAbstract);

router.route('/:id/reject')
  .put(protect, restrict('admin', 'staff'), rejectAbstract);

router.route('/:id/request-revision')
  .put(protect, restrict('admin', 'staff'), requestRevision);

// New Author resubmission route
router.route('/:id/resubmit-revision')
  .post(protectRegistrant, resubmitRevisedAbstract);

// New Admin/Staff get by registration route
// Note: This route doesn't have /:id, it uses a different param from the parent event router
// So it should be defined before the generic /:id routes if there's any ambiguity,
// or ensure its path is distinct enough. Given it's /by-registration/:registrationId, it should be fine.
// Let's place it with other specific lookup routes, or near admin routes.
// For clarity, adding it here before the generic / routes for an abstract id.

router.route('/by-registration/:registrationId')
  .get(protect, restrict('admin', 'staff'), getAbstractsByRegistration);

// --- Define Public/Registrant accessible routes LAST (less specific paths) ---

// Create abstract (POST /) or Get OWN abstracts (GET /)
router.route('/')
  .post(protectRegistrant, validate(schemas.createAbstract), createAbstract)
  .get(protectRegistrant, getAbstracts);

// GET/PUT/DELETE specific abstract (if owner or admin/staff)
// This will now correctly handle requests for a specific abstract ID 
// without capturing requests like /all-event-abstracts or /statistics
router.route('/:id')
  .get(protect, getAbstract)
  .put(protectRegistrant, validate(schemas.updateAbstract), updateAbstract)
  .delete(protectRegistrant, deleteAbstract);

// Download attachment for a specific abstract
router.route('/:id/download-attachment')
  .get(protect, downloadAbstractAttachment);

// Upload file for own abstract (if owner)
router.route('/:id/file')
  .post(protectRegistrant, uploadAbstractFile);

// Add after other event-level routes
router.route('/auto-assign-reviewers').post(protect, restrict('admin', 'staff'), autoAssignReviewers);

module.exports = router; 