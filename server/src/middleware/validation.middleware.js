const { validationResult } = require('express-validator');
const { createApiError } = require('./error');
const logger = require('../utils/logger');

/**
 * Validation middleware for general request validation
 * @param {function} validators - Express-validator middleware functions
 * @returns {function} Express middleware function
 */
const validate = (validators) => {
  return async (req, res, next) => {
    try {
      // Run all validators
      await Promise.all(validators.map(validator => validator.run(req)));
      
      // Check for validation errors
      const errors = validationResult(req).array();
      
      if (errors.length > 0) {
        // Extract error messages
        const errorMessages = errors.map(({ param, msg }) => 
          `${param}: ${msg}`
        );
        
        // Return validation error
        return next(createApiError(400, errors.join(', ')));
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Validation middleware for registration data
 * @param {function} validators - Express-validator middleware functions
 * @returns {function} Express middleware function
 */
const validateRegistration = (validators) => {
  return async (req, res, next) => {
    try {
      // Run all validators
      await Promise.all(validators.map(validator => validator.run(req)));
      
      // Check for validation errors
      const errors = validationResult(req).array();
      
      if (errors.length > 0) {
        // Extract error messages
        const errorMessages = errors.map(({ param, msg }) => 
          `${param}: ${msg}`
        );
        
        // Return validation error
        return next(createApiError(400, errors.join(', ')));
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Validation middleware for event data
 * @param {function} validators - Express-validator middleware functions
 * @returns {function} Express middleware function
 */
const validateEvent = (validators) => {
  return async (req, res, next) => {
    try {
      // Run all validators
      await Promise.all(validators.map(validator => validator.run(req)));
      
      // Check for validation errors
      const errors = validationResult(req).array();
      
      if (errors.length > 0) {
        // Extract error messages
        const errorMessages = errors.map(({ param, msg }) => 
          `${param}: ${msg}`
        );
        
        // Return validation error
        return next(createApiError(400, errors.join(', ')));
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Validate login request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  // Email validation
  if (!email) {
    errors.push('Email is required');
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.push('Please provide a valid email address');
    }
  }

  // Password validation
  if (!password) {
    errors.push('Password is required');
  }

  if (errors.length > 0) {
    logger.warn(`Login validation failed: ${errors.join(', ')}`);
    return next(createApiError(400, errors.join(', ')));
  }

  next();
};

/**
 * Validate user creation request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const validateUserCreation = (req, res, next) => {
  const { firstName, lastName, email, role } = req.body;
  const errors = [];

  // First name validation
  if (!firstName || firstName.trim() === '') {
    errors.push('First name is required');
  }

  // Last name validation
  if (!lastName || lastName.trim() === '') {
    errors.push('Last name is required');
  }

  // Email validation
  if (!email) {
    errors.push('Email is required');
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.push('Please provide a valid email address');
    }
  }

  // Role validation
  if (role && !['admin', 'manager', 'staff', 'scanner', 'analyst'].includes(role)) {
    errors.push('Invalid role. Must be one of: admin, manager, staff, scanner, analyst');
  }

  if (errors.length > 0) {
    logger.warn(`User creation validation failed: ${errors.join(', ')}`);
    return next(createApiError(400, errors.join(', ')));
  }

  next();
};

module.exports = {
  validate,
  validateRegistration,
  validateEvent,
  validateLogin,
  validateUserCreation
}; 