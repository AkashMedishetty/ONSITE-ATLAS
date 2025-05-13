const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { 
  getCustomFields, 
  createCustomField, 
  getCustomFieldById, 
  updateCustomField, 
  deleteCustomField 
} = require('../controllers/customField.controller');

// Custom field routes
router.route('/')
  .get(protect, getCustomFields)
  .post(protect, createCustomField);

router.route('/:id')
  .get(protect, getCustomFieldById)
  .put(protect, updateCustomField)
  .delete(protect, deleteCustomField);

module.exports = router; 