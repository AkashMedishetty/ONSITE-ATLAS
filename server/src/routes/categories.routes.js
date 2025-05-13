const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getAllCategories,
  updateCategoryPermissions
} = require('../controllers/category.controller');

// Get all categories (with optional event filtering)
router.get('/', getAllCategories);

// Categories for a specific event
router.route('/event/:eventId')
  .get(protect, getCategories)
  .post(protect, createCategory);

// Category by ID
router.route('/:id')
  .get(protect, getCategoryById)
  .put(protect, updateCategory)
  .delete(protect, deleteCategory);

// Category permissions
router.route('/:id/permissions')
  .put(protect, updateCategoryPermissions);

module.exports = router; 