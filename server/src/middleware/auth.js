const jwt = require('jsonwebtoken');
const httpStatus = require('http-status');
const { User } = require('../models');
const { createApiError } = require('./error');
const { Registration } = require('../models');
const ErrorResponse = require('../utils/errorResponse');

/**
 * Authentication middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const authenticate = async (req, res, next) => {
  try {
    let token;
    
    // Get token from Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    // Check if token exists
    if (!token) {
      throw createApiError(httpStatus.UNAUTHORIZED, 'Please authenticate');
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from token
    const user = await User.findById(decoded.id);
    
    if (!user) {
      throw createApiError(httpStatus.UNAUTHORIZED, 'User not found');
    }
    
    // Set user on request
    req.user = user;
    
    next();
  } catch (error) {
    // Handle specific JWT errors
    if (error.name === 'TokenExpiredError') {
      next(createApiError(httpStatus.UNAUTHORIZED, 'Token expired'));
    } else if (error.name === 'JsonWebTokenError') {
      next(createApiError(httpStatus.UNAUTHORIZED, 'Invalid token'));
    } else {
      next(error);
    }
  }
};

/**
 * Authorization middleware
 * @param {string[]} roles - Array of allowed roles
 * @returns {Function} Express middleware
 */
const authorize = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(createApiError(httpStatus.UNAUTHORIZED, 'Please authenticate'));
    }
    
    if (roles.length && !roles.includes(req.user.role)) {
      return next(createApiError(httpStatus.FORBIDDEN, 'Insufficient permissions'));
    }
    
    next();
  };
};

/**
 * Middleware to protect routes for registrant portal
 * Verify JWT token and attach registrant to request object
 */
const protectRegistrant = async (req, res, next) => {
  try {
    let token;
    
    // Extract token from Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    // Check if token exists
    if (!token) {
      return next(new ErrorResponse('Not authorized to access this route', 401));
    }
    
    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      
      // Find registrant by decoded ID
      const registration = await Registration.findById(decoded.id);
      
      if (!registration) {
        return next(new ErrorResponse('Registration not found', 404));
      }
      
      // Attach registrant to request object
      req.registrant = registration;
      
      next();
    } catch (error) {
      return next(new ErrorResponse('Not authorized to access this route', 401));
    }
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  authenticate,
  authorize,
  protectRegistrant
};
