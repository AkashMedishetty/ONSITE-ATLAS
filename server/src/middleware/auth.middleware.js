const jwt = require('jsonwebtoken');
const { User, Registration } = require('../models');
const { createApiError } = require('./error');
const logger = require('../utils/logger');
const asyncHandler = require('./async');
const ErrorResponse = require('../utils/errorResponse');
const config = require('../config/config');

/**
 * Middleware to protect routes that require authentication
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Set token from Bearer token in header
    token = req.headers.authorization.split(' ')[1];
  }
  
  console.log('[Protect Middleware] Path:', req.originalUrl);
  console.log('[Protect Middleware] Received token:', token);

  // Make sure token exists
  if (!token) {
    console.log('[Protect Middleware] No token provided, access denied.');
    return next(new ErrorResponse('Not authorized to access this route (token missing)', 401));
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, config.jwt.secret || process.env.JWT_SECRET);
    console.log('[Protect Middleware] Token decoded successfully:', decoded);

    // Check token type and query appropriate model
    if (decoded.type === 'registrant') {
      req.registrant = await Registration.findById(decoded.id).select('-password'); // Assuming password is not stored or relevant for registrant directly
      if (!req.registrant) {
        console.log('[Protect Middleware] Registrant not found for decoded token ID:', decoded.id);
        return next(new ErrorResponse('Not authorized, registrant not found', 401));
      }
      console.log(`[Protect Middleware] Registrant (ID: ${req.registrant._id}) authenticated for ${req.originalUrl}`);
      // Optionally, to maintain compatibility if some downstream middleware expects req.user
      // you might set req.user = req.registrant here, but it's cleaner to use req.registrant for registrants.
    } else {
      // Assume 'user' type or default to User model if type is undefined
      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        console.log('[Protect Middleware] User not found for decoded token ID:', decoded.id);
        return next(new ErrorResponse('Not authorized, user not found', 401));
      }
      console.log(`[Protect Middleware] User ${req.user.email} (ID: ${req.user._id}, Role: ${req.user.role}) authenticated for ${req.originalUrl}`);
    }

    next();
  } catch (err) {
    console.error('[Protect Middleware] Token verification failed:', err.message);
    // More detailed error logging for different JWT errors
    if (err.name === 'JsonWebTokenError') {
        return next(new ErrorResponse('Not authorized, token invalid', 401));
    } else if (err.name === 'TokenExpiredError') {
        return next(new ErrorResponse('Not authorized, token expired', 401));
    }
    return next(new ErrorResponse('Not authorized to access this route (token verification issue)', 401));
  }
});

/**
 * Middleware to protect routes that require registrant authentication
 */
const protectRegistrant = asyncHandler(async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.registrantToken) { 
      token = req.cookies.registrantToken;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Registrant not authorized, no token provided'
      });
    }

    try {
      const secret = process.env.REGISTRANT_JWT_SECRET || process.env.JWT_SECRET;
      if (!secret) {
        logger.error('[ProtectRegistrant] JWT_SECRET or REGISTRANT_JWT_SECRET not configured.');
        return res.status(500).json({ success: false, message: 'Server configuration error: JWT secret not set.' });
      }
      const decoded = jwt.verify(token, secret);

      if (decoded.type !== 'registrant') {
        return res.status(401).json({
          success: false,
          message: 'Not a valid registrant token'
        });
      }

      const registrant = await Registration.findById(decoded.id);

      if (!registrant) {
        return res.status(401).json({
          success: false,
          message: 'Registrant not found for this token'
        });
      }
      
      req.registrant = registrant;
      // For routes that might also use generic user checks but are registrant-specific
      // It might be safer to rely on req.registrant explicitly in those controllers
      // req.user = registrant; // Avoid if possible to prevent confusion, unless controllers are adapted
      console.log('[ProtectRegistrant Middleware] Path:', req.originalUrl);
      next();
    } catch (error) {
      logger.error('Registrant token verification error:', error.name, error.message);
      let message = 'Registrant not authorized, token failed';
      if (error.name === 'JsonWebTokenError') message = 'Invalid token format.';
      if (error.name === 'TokenExpiredError') message = 'Token expired. Please log in again.';
      return res.status(401).json({
        success: false,
        message: message
      });
    }
  } catch (error) {
    logger.error('Registrant auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error in registrant auth middleware'
    });
  }
});

/**
 * Middleware to restrict access to specific roles
 * @param  {...String} roles - Array of allowed roles
 * @returns {Function} - Express middleware function
 */
const restrict = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required for role restriction'
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' not authorized to access this route. Allowed: ${roles.join(', ')}`
      });
    }
    
    next();
  };
};

module.exports = {
  protect,
  protectRegistrant,
  restrict
}; 