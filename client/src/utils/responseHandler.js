/**
 * Utility functions for handling standardized API responses
 */

/**
 * Extract data from a standardized API response
 * @param {Object} response - The standardized API response object
 * @param {*} defaultValue - Default value to return if data is not available
 * @returns {*} - The data from the response or the default value
 */
export const extractData = (response, defaultValue = null) => {
  if (!response) return defaultValue;
  if (!response.success) return defaultValue;
  if (response.data === undefined) return defaultValue;
  return response.data;
};

/**
 * Check if an API response was successful
 * @param {Object} response - The standardized API response object
 * @returns {boolean} - True if the response was successful
 */
export const isSuccess = (response) => {
  return response && response.success === true;
};

/**
 * Get the message from a standardized API response
 * @param {Object} response - The standardized API response object
 * @param {string} defaultMessage - Default message to return if not available
 * @returns {string} - The message from the response or the default
 */
export const getMessage = (response, defaultMessage = '') => {
  if (!response) return defaultMessage;
  return response.message || defaultMessage;
};

/**
 * Get errors from a standardized API response
 * @param {Object} response - The standardized API response object
 * @returns {Array} - Array of error messages
 */
export const getErrors = (response) => {
  if (!response) return [];
  return response.errors || [];
};

/**
 * Create a standard error response object
 * @param {string} message - Error message
 * @param {Array} errors - Detailed error information
 * @returns {Object} - Standard error response
 */
export const createErrorResponse = (message = 'An error occurred', errors = []) => {
  return {
    success: false,
    message,
    errors: Array.isArray(errors) ? errors : [errors],
    data: null
  };
};

/**
 * Create a standard success response object
 * @param {*} data - Response data
 * @param {string} message - Success message
 * @returns {Object} - Standard success response
 */
export const createSuccessResponse = (data = null, message = 'Operation successful') => {
  return {
    success: true,
    message,
    data
  };
};

export default {
  extractData,
  isSuccess,
  getMessage,
  getErrors,
  createErrorResponse,
  createSuccessResponse
}; 