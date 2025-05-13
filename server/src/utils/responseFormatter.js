/**
 * Format success response
 * @param {Object} res - Express response object
 * @param {Number} statusCode - HTTP status code
 * @param {String} message - Success message
 * @param {*} data - Response data
 * @param {Object} meta - Metadata (pagination, etc.)
 * @returns {Object} Formatted response
 */
const sendSuccess = (res, statusCode = 200, message = 'Success', data = null, meta = null) => {
  const response = {
    success: true,
    message
  };
  
  if (data !== null) {
    response.data = data;
  }
  
  if (meta !== null) {
    response.meta = meta;
  }
  
  return res.status(statusCode).json(response);
};

/**
 * Format paginated response
 * @param {Object} res - Express response object
 * @param {Number} statusCode - HTTP status code
 * @param {String} message - Success message
 * @param {Array} data - Response data array
 * @param {Number} page - Current page number
 * @param {Number} limit - Items per page
 * @param {Number} total - Total number of items
 * @returns {Object} Formatted paginated response
 */
const sendPaginated = (res, statusCode = 200, message = 'Success', data = [], page = 1, limit = 10, total = 0) => {
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;
  
  return sendSuccess(res, statusCode, message, data, {
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage,
      hasPrevPage
    }
  });
};

module.exports = {
  sendSuccess,
  sendPaginated
}; 