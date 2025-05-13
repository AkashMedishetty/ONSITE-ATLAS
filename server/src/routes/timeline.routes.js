const express = require('express');
const router = express.Router();
const timelineController = require('../controllers/timeline.controller');

/**
 * @route GET /api/timeline
 * @desc Get project timeline data
 * @access Public
 */
router.get('/', timelineController.getTimelineData);

module.exports = router; 