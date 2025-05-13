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

// Add a test route that doesn't require authentication
router.get('/test', (req, res) => {
  console.log('Badge template test route hit');
  return res.status(200).json({
    success: true,
    message: 'Badge template routes are working!'
  });
});

// Protect all other routes
router.use(protect);

// Debugging middleware to log all requests to badge template routes
router.use((req, res, next) => {
  console.log(`[BADGE-TEMPLATE] ${req.method} request to ${req.originalUrl}`);
  console.log('[BADGE-TEMPLATE] Request body:', req.body);
  console.log('[BADGE-TEMPLATE] User:', req.user ? req.user.id : 'Not authenticated');
  next();
});

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

console.log('Badge template routes have been defined in the router');

module.exports = router; 