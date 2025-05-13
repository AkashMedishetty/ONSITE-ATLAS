const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const customFieldValidation = require('../../validations/customField.validation');
const customFieldController = require('../../controllers/customField.controller');

// Routes for general custom field management
router.post(
  '/',
  auth,
  authorize('admin', 'manager'),
  validate(customFieldValidation.create),
  customFieldController.createCustomField
);

router.get(
  '/:id',
  auth,
  validate(customFieldValidation.getById),
  customFieldController.getCustomFieldById
);

router.put(
  '/:id',
  auth,
  authorize('admin', 'manager'),
  validate(customFieldValidation.update),
  customFieldController.updateCustomField
);

router.delete(
  '/:id',
  auth,
  authorize('admin', 'manager'),
  validate(customFieldValidation.deleteCustomField),
  customFieldController.deleteCustomField
);

// Routes for event-specific custom fields
router.get(
  '/event/:eventId',
  auth,
  validate(customFieldValidation.getByEvent),
  customFieldController.getCustomFieldsByEvent
);

module.exports = router; 