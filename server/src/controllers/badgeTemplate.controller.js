const asyncHandler = require('../middleware/async');
const BadgeTemplate = require('../models/BadgeTemplate');
const ErrorResponse = require('../utils/errorResponse');

/**
 * @desc    Get all badge templates
 * @route   GET /api/badge-templates
 * @access  Private
 */
const getBadgeTemplates = asyncHandler(async (req, res) => {
  let query = {};
  
  // Filter by event ID or global templates
  if (req.query.event) {
    query = { 
      $or: [
        { event: req.query.event },
        { isGlobal: true }
      ]
    };
  } else {
    // If no event ID specified, only return global templates and templates created by the user
    query = { 
      $or: [
        { isGlobal: true },
        { createdBy: req.user.id }
      ]
    };
  }
  
  // Add console log here to see the final query
  console.log('[getBadgeTemplates] Executing query:', JSON.stringify(query));

  const templates = await BadgeTemplate.find(query);

  // Add console log to see the result
  console.log('[getBadgeTemplates] Found templates:', JSON.stringify(templates)); // Log the found templates
  
  res.status(200).json({
    success: true,
    count: templates.length,
    data: templates
  });
});

/**
 * @desc    Get single badge template
 * @route   GET /api/badge-templates/:id
 * @access  Private
 */
const getBadgeTemplateById = asyncHandler(async (req, res) => {
  const template = await BadgeTemplate.findById(req.params.id);
  
  if (!template) {
    return next(new ErrorResponse(`Badge template not found with id of ${req.params.id}`, 404));
  }
  
  res.status(200).json({
    success: true,
    data: template
  });
});

/**
 * @desc    Create new badge template
 * @route   POST /api/badge-templates
 * @access  Private
 */
const createBadgeTemplate = asyncHandler(async (req, res) => {
  // Add user to req.body
  req.body.createdBy = req.user.id;
  
  const template = await BadgeTemplate.create(req.body);
  
  res.status(201).json({
    success: true,
    data: template
  });
});

/**
 * @desc    Update badge template
 * @route   PUT /api/badge-templates/:id
 * @access  Private
 */
const updateBadgeTemplate = asyncHandler(async (req, res, next) => {
  let template = await BadgeTemplate.findById(req.params.id);
  
  if (!template) {
    return next(new ErrorResponse(`Badge template not found with id of ${req.params.id}`, 404));
  }
  
  // Make sure user is template owner or admin
  if (template.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse(`User ${req.user.id} is not authorized to update this template`, 401));
  }
  
  template = await BadgeTemplate.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  
  res.status(200).json({
    success: true,
    data: template
  });
});

/**
 * @desc    Delete badge template
 * @route   DELETE /api/badge-templates/:id
 * @access  Private
 */
const deleteBadgeTemplate = asyncHandler(async (req, res, next) => {
  const template = await BadgeTemplate.findById(req.params.id);
  
  if (!template) {
    return next(new ErrorResponse(`Badge template not found with id of ${req.params.id}`, 404));
  }
  
  // Make sure user is template owner or admin
  if (template.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse(`User ${req.user.id} is not authorized to delete this template`, 401));
  }
  
  await template.remove();
  
  res.status(200).json({
    success: true,
    data: {}
  });
});

/**
 * @desc    Duplicate a badge template
 * @route   POST /api/badge-templates/:id/duplicate
 * @access  Private
 */
const duplicateBadgeTemplate = asyncHandler(async (req, res, next) => {
  const template = await BadgeTemplate.findById(req.params.id);
  
  if (!template) {
    return next(new ErrorResponse(`Badge template not found with id of ${req.params.id}`, 404));
  }
  
  // Create a new template based on the existing one
  const newTemplate = {
    ...template.toObject(),
    _id: undefined, // Remove the ID so a new one is created
    name: `${template.name} (Copy)`,
    createdBy: req.user.id,
    isGlobal: false, // Always create copies as non-global
    event: req.body.event || template.event // Optionally assign to a different event
  };
  
  const duplicatedTemplate = await BadgeTemplate.create(newTemplate);
  
  res.status(201).json({
    success: true,
    data: duplicatedTemplate
  });
});

/**
 * @desc    Set default badge template
 * @route   POST /api/badge-templates/:eventId/:templateId/set-default
 * @access  Private
 */
const setDefaultTemplate = asyncHandler(async (req, res, next) => {
  // Get eventId and templateId from route parameters
  const { eventId, templateId } = req.params;

  const template = await BadgeTemplate.findById(templateId);
  
  if (!template) {
    return next(new ErrorResponse(`Badge template not found with id of ${templateId}`, 404));
  }

  // Optional: Check if template belongs to the event if not global
  if (!template.isGlobal && template.event?.toString() !== eventId) {
     return next(new ErrorResponse(`Template ${templateId} does not belong to event ${eventId}`, 400));
  }
  
  // Update all other templates FOR THIS EVENT to be non-default
  // This prevents accidentally unsetting defaults in other events
  await BadgeTemplate.updateMany(
    { event: eventId, _id: { $ne: templateId } }, // Scope to eventId, exclude current template
    { $set: { isDefault: false } } // Use $set for clarity
  );
  
  template.isDefault = true;
  await template.save();
  
  res.status(200).json({
    success: true,
    data: template
  });
});

module.exports = {
  getBadgeTemplates,
  getBadgeTemplateById,
  createBadgeTemplate,
  updateBadgeTemplate,
  deleteBadgeTemplate,
  duplicateBadgeTemplate,
  setDefaultTemplate
}; 