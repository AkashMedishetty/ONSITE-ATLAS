const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware'); // Assuming this is your auth middleware
const { getImportJobStatus } = require('../controllers/registration.controller');

// @route   GET /api/import-jobs/:jobId/status
// @desc    Get the status of a specific bulk import job
// @access  Private (Protected by 'protect' middleware)
router.get('/:jobId/status', protect, getImportJobStatus);

module.exports = router; 