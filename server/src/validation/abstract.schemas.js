const { body, param } = require('express-validator');
const mongoose = require('mongoose');

// Custom validator to check for valid MongoDB ObjectId
const isValidObjectId = (value) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new Error('Invalid ObjectId');
  }
  return true;
};

/**
 * Schema for creating a new abstract (using express-validator)
 */
const createAbstract = [
  // eventId is usually from req.params in nested routes, not body
  // param('eventId').custom(isValidObjectId).withMessage('Invalid Event ID'), 
  // registrationId needs clarification - is it the user ID or the string ID?
  // Assuming it refers to the registrant's MongoDB _id, passed in the body:
  body('registration')
    .custom(isValidObjectId).withMessage('Invalid Registration ID'),
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters'),
  body('authors')
    .trim()
    .notEmpty().withMessage('Authors are required'),
  body('affiliations') // Assuming affiliations corresponds to authorAffiliations
    .optional()
    .trim(),
  body('category') // Assuming category corresponds to topic/category ID
    .trim()
    .notEmpty().withMessage('Category is required')
    .custom(isValidObjectId).withMessage('Invalid Category ID format'), // Check if it should be ObjectId
  body('content')
    .trim()
    .notEmpty().withMessage('Content is required')
    .isLength({ max: 5000 }).withMessage('Content cannot exceed 5000 characters') // Match Joi schema length
];

/**
 * Schema for updating an abstract (using express-validator)
 * NOTE: Convert other schemas (update, status, comment) similarly if needed.
 */
const updateAbstract = [
  param('id') // Validate the abstract ID from the URL param
    .custom(isValidObjectId).withMessage('Invalid Abstract ID'),
  body('title')
    .optional()
    .trim()
    .notEmpty().withMessage('Title cannot be empty if provided')
    .isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters'),
  body('authors')
    .optional()
    .trim()
    .notEmpty().withMessage('Authors cannot be empty if provided'),
  body('affiliations')
    .optional()
    .trim(),
  body('category')
    .optional()
    .trim()
    .notEmpty().withMessage('Category cannot be empty if provided')
    .custom(isValidObjectId).withMessage('Invalid Category ID format'),
  body('content')
    .optional()
    .trim()
    .notEmpty().withMessage('Content cannot be empty if provided')
    .isLength({ max: 5000 }).withMessage('Content cannot exceed 5000 characters'),
  // Ensure at least one field is being updated - express-validator doesn't have a direct .min(1) for body
  // This logic might need to be in the controller or use a custom validator on the whole body.
];

/**
 * Schema for updating abstract status
 */
const updateStatus = []; // Placeholder

/**
 * Schema for adding a comment
 */
const addComment = []; // Placeholder

module.exports = {
  createAbstract,
  updateAbstract,
  updateStatus, // Exporting placeholder
  addComment    // Exporting placeholder
}; 