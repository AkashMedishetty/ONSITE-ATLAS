/**
 * Fixes for Model Export Issues
 * 
 * This file provides the correct implementation for models/index.js
 * to fix the missing Resource model export that's causing statistics
 * endpoint failures.
 */

// models/index.js - Corrected implementation
const User = require('./User');
const Event = require('./Event');
const Registration = require('./Registration');
const Category = require('./Category');
const Resource = require('./Resource');  // This was missing
const Abstract = require('./Abstract');

module.exports = {
  User,
  Event,
  Registration,
  Category,
  Resource,  // This was missing
  Abstract
};

/**
 * Standardized Error Response Utility
 * 
 * Use this utility in controllers to ensure consistent error responses
 */
const errorResponse = (res, message, statusCode = 400, errors = null) => {
  const response = {
    success: false,
    message
  };
  
  if (errors) {
    response.errors = errors;
  }
  
  return res.status(statusCode).json(response);
};

/**
 * Success Response Utility
 * 
 * Use this utility in controllers to ensure consistent success responses
 */
const successResponse = (res, data, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    data
  });
};

/**
 * Paginated Response Utility
 * 
 * Use this utility in controllers to ensure consistent paginated responses
 */
const paginatedResponse = (res, data, page, limit, total) => {
  const totalPages = Math.ceil(total / limit);
  
  return res.status(200).json({
    success: true,
    data,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages,
      totalItems: total
    }
  });
};

/**
 * MongoDB ObjectID Validation Utility
 * 
 * Use this utility to validate MongoDB ObjectIDs
 */
const isValidObjectId = (id) => {
  const mongoose = require('mongoose');
  return mongoose.Types.ObjectId.isValid(id);
};

/**
 * Environment Variable Validation
 * 
 * Use this at application startup to validate required environment variables
 */
const validateEnvVariables = () => {
  const requiredVars = [
    'PORT',
    'NODE_ENV',
    'MONGODB_URI',
    'JWT_SECRET',
    'JWT_EXPIRE'
  ];
  
  const missing = requiredVars.filter(variable => !process.env[variable]);
  
  if (missing.length > 0) {
    console.error('Required environment variables are missing:', missing.join(', '));
    process.exit(1);
  }
  
  console.log('Environment variables validated successfully.');
};

module.exports = {
  errorResponse,
  successResponse,
  paginatedResponse,
  isValidObjectId,
  validateEnvVariables
}; 