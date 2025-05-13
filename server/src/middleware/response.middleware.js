/**
 * Response formatting middleware
 * Ensures consistent API response structure across the application
 */

/**
 * Standard success response formatter
 * Modifies the res.json method to ensure all responses follow a consistent format
 */
const responseFormatter = (req, res, next) => {
  // Store the original res.json method
  const originalJson = res.json;
  
  // Override the res.json method with a standardized version
  res.json = function(data) {
    // If data is already in the standard format, don't modify it
    if (data && typeof data === 'object' && 'success' in data) {
      return originalJson.call(this, data);
    }
    
    // Format the response in a standard structure
    const formattedResponse = {
      success: true,
      data: data
    };
    
    // Call the original json method with our formatted response
    return originalJson.call(this, formattedResponse);
  };
  
  // Continue to the next middleware
  next();
};

/**
 * Success response helper method
 * @param {Object} res - Express response object
 * @param {Number} statusCode - HTTP status code
 * @param {String} message - Success message
 * @param {*} data - Response data
 * @returns {Object} Formatted response
 */
const sendSuccess = (res, statusCode = 200, message = 'Success', data = null) => {
  const response = {
    success: true,
    message
  };
  
  if (data !== null) {
    response.data = data;
  }
  
  return res.status(statusCode).json(response);
};

/**
 * Error response helper method
 * @param {Object} res - Express response object
 * @param {Number} statusCode - HTTP status code
 * @param {String} message - Error message
 * @param {Array} errors - Error details array
 * @returns {Object} Formatted error response
 */
const sendError = (res, statusCode = 500, message = 'Error', errors = []) => {
  const response = {
    success: false,
    message
  };
  
  if (errors && errors.length > 0) {
    response.errors = errors;
  }
  
  return res.status(statusCode).json(response);
};

module.exports = {
  responseFormatter,
  sendSuccess,
  sendError
}; 