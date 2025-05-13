/**
 * Utility functions for service modules
 */

/**
 * Standardized error handler for API requests
 * @param {Error} error - The error object from axios
 * @param {string} message - Custom error message
 */
export const handleError = (error, message = 'API Error') => {
  // Log the error with context
  console.error(`${message}:`, error);
  
  // Log detailed error information if available
  if (error.response) {
    console.error('Status:', error.response.status);
    console.error('Data:', error.response.data);
    console.error('Headers:', error.response.headers);
  } else if (error.request) {
    console.error('Request was made but no response received:', error.request);
  } else {
    console.error('Error setting up request:', error.message);
  }
  
  // Return standardized error object
  return {
    success: false,
    message: error.response?.data?.message || message,
    error
  };
};

/**
 * Format date for display
 * @param {Date|string} date - Date to format
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} - Formatted date
 */
export const formatDate = (date, options = {}) => {
  if (!date) return '';
  
  const defaultOptions = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return new Intl.DateTimeFormat('en-US', { ...defaultOptions, ...options }).format(dateObj);
};

/**
 * Generate a random ID for temporary use
 * @param {number} length - Length of the ID
 * @returns {string} - Random ID
 */
export const generateTempId = (length = 10) => {
  return Math.random().toString(36).substring(2, 2 + length);
};

export default {
  handleError,
  formatDate,
  generateTempId
};
