const { validationResult } = require('express-validator');
const { createApiError } = require('./error');
const logger = require('../utils/logger');
const Joi = require('joi');

/**
 * Middleware to validate request data based on defined validation rules
 * @param {Array} validations - An array of express-validator validation rules
 * @returns {Function} Express middleware
 */
const validate = (validations) => {
  return async (req, res, next) => {
    // Execute all validations
    await Promise.all(validations.map(validation => validation.run(req)));
    
    // Check if there are any validation errors
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      // Format the error details
      const errorDetails = errors.array().map(error => {
        return `${error.param} - ${error.msg}`;
      }).join('; ');
      
      // Return a validation error
      return next(createApiError(400, `Validation Error: ${errorDetails}`));
    }
    
    // If no errors, proceed to the next middleware
    try {
      next();
    } catch (error) {
      // If there's an unexpected error, convert it to API error
      next(createApiError(400, 'Validation Error'));
    }
  };
};

// Event validation schemas
const eventCreateSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().allow(''),
  startDate: Joi.date().required(),
  endDate: Joi.date().required(),
  venue: Joi.object({
    name: Joi.string().required(),
    address: Joi.string().required(),
    city: Joi.string().required(),
    state: Joi.string().allow(''),
    country: Joi.string().required(),
    zipCode: Joi.string().allow('')
  }),
  status: Joi.string().valid('draft', 'published', 'archived')
});

const schemas = {
  eventCreate: eventCreateSchema
};

module.exports = {
  validate,
  schemas
};
