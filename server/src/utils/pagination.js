/**
 * Pagination utility functions
 */

/**
 * Formats and sends a paginated response
 * @param {Object} res - Express response object
 * @param {Object} options - Pagination options
 * @param {Array} options.data - The array of items
 * @param {number} options.page - Current page (default: 1)
 * @param {number} options.limit - Items per page (default: 25)
 * @param {number} options.total - Total number of items
 * @param {string} options.message - Optional success message
 * @returns {Object} Express response
 */
const sendPaginated = (res, { data, page = 1, limit = 25, total, message = 'Data retrieved successfully' }) => {
  // Calculate pagination info
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;
  
  return res.status(200).json({
    success: true,
    message,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage,
      hasPrevPage,
      nextPage: hasNextPage ? page + 1 : null,
      prevPage: hasPrevPage ? page - 1 : null
    },
    data
  });
};

/**
 * Calculates pagination parameters from request query
 * @param {Object} query - Express request query object
 * @returns {Object} Pagination parameters
 */
const getPaginationParams = (query) => {
  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || 25;
  const skip = (page - 1) * limit;
  
  return { page, limit, skip };
};

/**
 * Builds a MongoDB query for pagination
 * @param {Object} model - Mongoose model
 * @param {Object} query - Query parameters 
 * @param {Object} options - Additional options
 * @returns {Promise} Promise resolving to { data, total }
 */
const paginateQuery = async (model, query = {}, options = {}) => {
  const { page = 1, limit = 25, sort = { createdAt: -1 }, populate = '', select = '' } = options;
  
  const skip = (page - 1) * limit;
  
  const [data, total] = await Promise.all([
    model.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate(populate)
      .select(select),
    model.countDocuments(query)
  ]);
  
  return { data, total };
};

module.exports = {
  sendPaginated,
  getPaginationParams,
  paginateQuery
}; 