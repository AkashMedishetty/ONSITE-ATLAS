const { Category, Event, Registration, ResourceSetting } = require('../models');
const { createApiError } = require('../middleware/error');
const logger = require('../utils/logger');
const { sendSuccess, sendPaginated } = require('../utils/responseFormatter');
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');

/**
 * Get all categories for an event
 * @route GET /api/events/:eventId/categories
 * @access Private
 */
const getCategories = async (req, res, next) => {
  try {
    const { id: eventId } = req.params;
    
    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return next(createApiError(404, 'Event not found'));
    }
    
    // Check if user has access to this event
    if (req.user.role !== 'admin' && event.createdBy.toString() !== req.user._id.toString()) {
      return next(createApiError(403, 'Not authorized to access this event'));
    }
    
    const categories = await Category.find({ event: eventId });
    
    return sendSuccess(res, 200, 'Categories retrieved successfully', categories);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all categories for an event (public)
 * @route GET /api/events/:eventId/public-categories
 * @access Public
 */
const getCategoriesPublic = async (req, res, next) => {
  try {
    const { id: eventId } = req.params;
    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return next(createApiError(404, 'Event not found'));
    }
    const categories = await Category.find({ event: eventId });
    return sendSuccess(res, 200, 'Categories retrieved successfully', categories);
  } catch (error) {
    next(error);
  }
};

/**
 * Get category by ID
 * @route GET /api/categories/:id
 * @access Private
 */
const getCategoryById = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return next(createApiError(404, 'Category not found'));
    }
    
    // Check if user has access to this category's event
    const event = await Event.findById(category.event);
    if (req.user.role !== 'admin' && event.createdBy.toString() !== req.user._id.toString()) {
      return next(createApiError(403, 'Not authorized to access this category'));
    }
    
    return sendSuccess(res, 200, 'Category retrieved successfully', category);
  } catch (error) {
    next(error);
  }
};

/**
 * Create new category
 * @route POST /api/events/:eventId/categories
 * @access Private
 */
const createCategory = async (req, res, next) => {
  try {
    const { id: eventId } = req.params;
    const { 
      name, 
      description, 
      color, 
      permissions,
      mealEntitlements,
      kitItemEntitlements,
      certificateEntitlements
    } = req.body;
    
    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return next(createApiError(404, 'Event not found'));
    }
    
    // Check if user has access to this event
    if (req.user.role !== 'admin' && event.createdBy.toString() !== req.user._id.toString()) {
      return next(createApiError(403, 'Not authorized to create categories for this event'));
    }
    
    // Check if category with same name already exists for this event
    const existingCategory = await Category.findOne({ event: eventId, name });
    if (existingCategory) {
      return next(createApiError(400, 'Category with this name already exists for this event'));
    }
    
    // Create category
    const category = await Category.create({
      name,
      description,
      event: eventId,
      color: color || '#3B82F6', // Default blue color
      permissions,
      mealEntitlements,
      kitItemEntitlements,
      certificateEntitlements
    });
    
    logger.info(`New category created: ${category.name} for event ${event.name} by ${req.user.email}`);
    
    return sendSuccess(res, 201, 'Category created successfully', category);
  } catch (error) {
    next(error);
  }
};

/**
 * Update category
 * @route PUT /api/categories/:id
 * @access Private
 */
const updateCategory = async (req, res, next) => {
  try {
    const { 
      name, 
      description, 
      color, 
      permissions,
      mealEntitlements,
      kitItemEntitlements,
      certificateEntitlements
    } = req.body;
    
    let category = await Category.findById(req.params.id);
    
    if (!category) {
      return next(createApiError(404, 'Category not found'));
    }
    
    // Check if user has access to this category's event
    const event = await Event.findById(category.event);
    if (req.user.role !== 'admin' && event.createdBy.toString() !== req.user._id.toString()) {
      return next(createApiError(403, 'Not authorized to update this category'));
    }
    
    // Check if category with same name already exists for this event (excluding this category)
    if (name && name !== category.name) {
      const existingCategory = await Category.findOne({ 
        event: category.event, 
        name,
        _id: { $ne: category._id }
      });
      
      if (existingCategory) {
        return next(createApiError(400, 'Category with this name already exists for this event'));
      }
    }
    
    // Update category
    category = await Category.findByIdAndUpdate(
      req.params.id,
      {
        name,
        description,
        color,
        permissions,
        mealEntitlements,
        kitItemEntitlements,
        certificateEntitlements
      },
      { new: true, runValidators: true }
    );
    
    logger.info(`Category updated: ${category.name} by ${req.user.email}`);
    
    return sendSuccess(res, 200, 'Category updated successfully', category);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete category
 * @route DELETE /api/categories/:id
 * @access Private
 */
const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return next(createApiError(404, 'Category not found'));
    }
    
    // Check if user has access to this category's event
    const event = await Event.findById(category.event);
    if (req.user.role !== 'admin' && event.createdBy.toString() !== req.user._id.toString()) {
      return next(createApiError(403, 'Not authorized to delete this category'));
    }
    
    // Check if category has registrations
    const registrationCount = await Registration.countDocuments({ category: req.params.id });
    if (registrationCount > 0) {
      return next(createApiError(400, 'Cannot delete category with registrations'));
    }
    
    await category.deleteOne();
    
    logger.info(`Category deleted: ${category.name} by ${req.user.email}`);
    
    return sendSuccess(res, 200, 'Category deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all categories with optional filtering
 * @route   GET /api/categories
 * @access  Private
 */
const getAllCategories = asyncHandler(async (req, res) => {
  try {
    console.log('getAllCategories called with query:', req.query);
    const { eventId } = req.query;
    
    // Validate eventId format if provided
    if (eventId && !mongoose.Types.ObjectId.isValid(eventId)) {
      console.log(`Invalid event ID format: ${eventId}`);
      return res.status(200).json({
        success: true,
        message: 'Invalid event ID format, returning empty result',
        data: []
      });
    }
    
    let query = {};
    
    // If eventId is provided, filter by event
    if (eventId) {
      query.event = eventId;
    }
    
    console.log('Executing category query:', JSON.stringify(query));
    
    // Use a safe try-catch for the database operation
    let categories = [];
    try {
      categories = await Category.find(query);
      console.log(`Found ${categories.length} categories`);
    } catch (dbError) {
      console.error(`Database error fetching categories: ${dbError.message}`);
    }
    
    // Always return a successful response with consistent format
    return res.status(200).json({
      success: true,
      message: categories.length > 0 
        ? 'Categories retrieved successfully' 
        : 'No categories found for the given query',
      data: categories
    });
  } catch (error) {
    console.error(`Error in getAllCategories: ${error.message}`);
    console.error(error.stack);
    // Return empty data instead of error
    return res.status(200).json({
      success: true,
      message: 'Error fetching categories, returning empty result',
      data: []
    });
  }
});

/**
 * Update category permissions
 * @route PUT/PATCH /api/categories/:id/permissions
 * @access Private
 */
const updateCategoryPermissions = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { eventId } = req.query;
    const { permissions } = req.body;

    // Find category
    let category = await Category.findById(id);
    if (!category) {
      return next(createApiError(404, 'Category not found'));
    }

    // Check if user has access to this category's event
    const event = await Event.findById(category.event);
    if (req.user.role !== 'admin' && event.createdBy.toString() !== req.user._id.toString()) {
      return next(createApiError(403, 'Not authorized to update this category'));
    }
    // Verify this is the right event
    if (eventId && category.event.toString() !== eventId) {
      return next(createApiError(400, 'Category does not belong to specified event'));
    }

    // --- Fetch current resource settings for this event ---
    const [foodSetting, kitSetting, certSetting] = await Promise.all([
      ResourceSetting.findOne({ event: category.event, type: 'food' }),
      ResourceSetting.findOne({ event: category.event, type: 'kitBag' }),
      ResourceSetting.findOne({ event: category.event, type: 'certificate' })
    ]);
    const flattenMeals = (settings) => {
      const allMeals = [];
      const seen = new Set();
      (settings?.days || []).forEach(day => {
        (day.meals || []).forEach(meal => {
          const idStr = meal._id && meal._id.toString();
          if (idStr && !seen.has(idStr)) {
            allMeals.push(meal);
            seen.add(idStr);
          }
        });
      });
      return allMeals;
    };
    const validMeals = foodSetting ? flattenMeals(foodSetting.settings) : [];
    const validMealIds = new Set(validMeals.map(m => m._id.toString()));
    const validKits = kitSetting?.settings?.items || [];
    const validKitIds = new Set(validKits.map(k => k._id.toString()));
    const validCerts = certSetting?.settings?.types || [];
    const validCertIds = new Set(validCerts.map(c => c._id.toString()));

    // --- Clean and sync entitlements ---
    let mealEntitlements = Array.isArray(req.body.mealEntitlements) ? req.body.mealEntitlements : category.mealEntitlements || [];
    let kitItemEntitlements = Array.isArray(req.body.kitItemEntitlements) ? req.body.kitItemEntitlements : category.kitItemEntitlements || [];
    let certificateEntitlements = Array.isArray(req.body.certificateEntitlements) ? req.body.certificateEntitlements : category.certificateEntitlements || [];

    // Meals
    mealEntitlements = mealEntitlements.filter(e => e.mealId && validMealIds.has(e.mealId.toString()));
    for (const meal of validMeals) {
      const mealId = meal._id.toString();
      if (!mealEntitlements.some(e => e.mealId && e.mealId.toString() === mealId)) {
        mealEntitlements.push({ mealId: meal._id, entitled: true });
        logger.info(`[updateCategoryPermissions] Added missing meal entitlement for meal ${meal.name} (${mealId}) to category ${category.name}`);
      }
    }
    // Kits
    kitItemEntitlements = kitItemEntitlements.filter(e => e.itemId && validKitIds.has(e.itemId.toString()));
    for (const kit of validKits) {
      const kitId = kit._id.toString();
      if (!kitItemEntitlements.some(e => e.itemId && e.itemId.toString() === kitId)) {
        kitItemEntitlements.push({ itemId: kit._id, entitled: true });
        logger.info(`[updateCategoryPermissions] Added missing kit entitlement for kit ${kit.name} (${kitId}) to category ${category.name}`);
      }
    }
    // Certificates
    certificateEntitlements = certificateEntitlements.filter(e => e.certificateId && validCertIds.has(e.certificateId.toString()));
    for (const cert of validCerts) {
      const certId = cert._id.toString();
      if (!certificateEntitlements.some(e => e.certificateId && e.certificateId.toString() === certId)) {
        certificateEntitlements.push({ certificateId: cert._id, entitled: true });
        logger.info(`[updateCategoryPermissions] Added missing certificate entitlement for certificate ${cert.name} (${certId}) to category ${category.name}`);
      }
    }

    // --- Prepare update data ---
    const updateData = {
      permissions: {
        meals: permissions.meals || false,
        kitItems: permissions.kitItems || false,
        certificates: permissions.certificates || false,
        abstractSubmission: permissions.abstractSubmission || false
      },
      mealEntitlements,
      kitItemEntitlements,
      certificateEntitlements
    };

    // --- Save and respond ---
    category = await Category.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    logger.info(`[updateCategoryPermissions] Category permissions and entitlements updated and synced: ${category.name} by ${req.user.email}`);
    return sendSuccess(res, 200, 'Category permissions updated and entitlements synced successfully', category);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCategories,
  getCategoriesPublic,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getAllCategories,
  updateCategoryPermissions
}; 