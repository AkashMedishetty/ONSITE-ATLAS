const mongoose = require('mongoose');
const httpStatus = require('http-status');
const config = require('../config/config');
const logger = require('../config/logger');

/**
 * Custom error class for API responses
 * Extends the built-in Error class to include status code
 */
class ErrorResponse extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Create a standardized API error
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 * @returns {Object} Standardized error object
 */
const createApiError = (statusCode, message) => {
  return {
    statusCode: statusCode || httpStatus.INTERNAL_SERVER_ERROR,
    message: message || httpStatus[statusCode] || 'Internal Server Error',
    isOperational: true
  };
};

/**
 * Convert error object to standardized error format
 * @param {Error} err - Error object
 * @param {import('express').Request} req - Express request object 
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 */
const errorConverter = (err, req, res, next) => {
  // Create a standardized error object
  const error = {
    statusCode: 
      err.statusCode && typeof err.statusCode === 'number' 
        ? err.statusCode 
        : err instanceof mongoose.Error 
          ? httpStatus.BAD_REQUEST 
          : httpStatus.INTERNAL_SERVER_ERROR,
    message: err.message || 'An unexpected error occurred',
    isOperational: err.isOperational || false,
    stack: err.stack
  };
  
  // Pass the error to the next handler
  next(error);
};

/**
 * Handle API errors
 * @param {Object} err - Error object
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 */
const errorHandler = (err, req, res, next) => {
  // Extract statusCode and message directly from the error passed
  // (Could be original ApiError or the object from errorConverter)
  let { statusCode, message } = err;

  // Default if properties are missing or invalid
  if (!statusCode || typeof statusCode !== 'number') {
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
  }
  if (!message) {
    message = httpStatus[statusCode] || 'An unexpected error occurred';
  }

  // In production, hide non-operational error details
  if (config.env === 'production' && !err.isOperational) {
    statusCode = httpStatus.INTERNAL_SERVER_ERROR; // Ensure 500 for hidden errors
    message = httpStatus[httpStatus.INTERNAL_SERVER_ERROR];
  }

  res.locals.errorMessage = message; // Keep for potential logging/rendering

  const response = {
    success: false,
    status: 'error',
    code: statusCode,
    message,
    ...(config.env === 'development' && { stack: err.stack }),
  };

  if (config.env === 'development') {
    logger.error(err);
  }

  // Send the response with the appropriate status code
  res.status(statusCode).send(response);
};

module.exports = {
  ErrorResponse,
  createApiError,
  errorConverter,
  errorHandler,
}; 