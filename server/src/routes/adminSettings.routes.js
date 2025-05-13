const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate');
const adminSettingsValidation = require('../validations/adminSettings.validation');
const adminSettingsController = require('../controllers/adminSettings.controller');

// Event setting tabs
router.get(
  '/event-settings/:eventId/tabs',
  protect,
  adminSettingsController.getEventSettingTabs
);

router.get(
  '/event-settings/:eventId/:tab',
  protect,
  adminSettingsController.getEventTabSettings
);

router.put(
  '/event-settings/:eventId/:tab',
  protect,
  validate(adminSettingsValidation.updateTab),
  adminSettingsController.updateEventTabSettings
);

// User permissions
router.put(
  '/user-permissions/:userId',
  protect,
  validate(adminSettingsValidation.updatePermissions),
  adminSettingsController.updateUserPermissions
);

// Sponsor admin management
router.post(
  '/sponsor-admin',
  protect,
  validate(adminSettingsValidation.createSponsorAdmin),
  adminSettingsController.createSponsorAdmin
);

router.route('/')
  .get(protect, adminSettingsController.getSettings)
  .put(protect, adminSettingsController.updateSettings);

module.exports = router; 