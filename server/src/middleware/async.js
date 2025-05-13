/**
 * Async handler to wrap controller functions and handle exceptions
 * Eliminates the need for try/catch blocks in each controller
 * @param {Function} fn The async controller function to wrap
 * @returns {Function} Express middleware function with error handling
 */
const asyncHandler = fn => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler; 