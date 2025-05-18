/**
 * Async handler to wrap controller functions and handle exceptions
 * Eliminates the need for try/catch blocks in each controller
 * @param {Function} fn The async controller function to wrap
 * @returns {Function} Express middleware function with error handling
 */
const asyncHandler = fn => (req, res, next) => {
  // console.log('[asyncHandler] Wrapping function:', fn.name); // Removed
  Promise.resolve(fn(req, res, next)).catch(next); // Reverted to original .catch(next)
  // Promise.resolve(fn(req, res, next)).catch(err => { // Removed detailed logging
  //   console.error('[asyncHandler] CAUGHT ERROR:', err);
  //   console.error('[asyncHandler] Error Name:', err.name);
  //   console.error('[asyncHandler] Error Message:', err.message);
  //   console.error('[asyncHandler] Error Stack:', err.stack);
  //   console.error('[asyncHandler] Is ApiError instance?', err instanceof require('../utils/ApiError').ApiError);
  //   next(err);
  // });
};

module.exports = asyncHandler; 