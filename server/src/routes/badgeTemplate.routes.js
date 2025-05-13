const express = require('express');
const {
  getBadgeTemplates,
  getBadgeTemplateById,
  createBadgeTemplate,
  updateBadgeTemplate,
  deleteBadgeTemplate,
  duplicateBadgeTemplate
} = require('../controllers/badgeTemplate.controller');

const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

// Protect all routes
router.use(protect);

// Routes
router.route('/')
  .get(getBadgeTemplates)
  .post(createBadgeTemplate);

router.route('/:id')
  .get(getBadgeTemplateById)
  .put(updateBadgeTemplate)
  .delete(deleteBadgeTemplate);

router.route('/:id/duplicate')
  .post(duplicateBadgeTemplate);

module.exports = router; 