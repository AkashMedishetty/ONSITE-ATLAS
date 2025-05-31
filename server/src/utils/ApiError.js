/**
 * Custom error class for API errors
 * Extends the built-in Error class
 */
class ApiError extends Error {
  /**
   * Creates an API error instance
   * @param {number} statusCode - HTTP status code
   * @param {string} message - Error message
   * @param {boolean} [isOperational=true] - Whether the error is operational or programming
   * @param {string} [stack=''] - Error stack trace
   */
  constructor(statusCode, message, isOperational = true, stack = '') {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

// Remove errorHandler from this file and export only the class
module.exports = ApiError; 