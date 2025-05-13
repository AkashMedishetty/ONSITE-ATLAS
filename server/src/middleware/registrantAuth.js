const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const { Registration } = require('../models');
const asyncHandler = require('./async');
const { ApiError } = require('../utils/ApiError');
const config = require('../config/config');

// Middleware to protect registrant routes
module.exports = asyncHandler(async (req, res, next) => {
  // 1) Get token from header
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new ApiError('You are not logged in. Please log in to get access', 401));
  }

  // 2) Verify token
  let decoded;
  try {
    decoded = await promisify(jwt.verify)(token, config.jwt.secret);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new ApiError(401, 'Token expired'));
    }
    if (err.name === 'JsonWebTokenError') {
      return next(new ApiError(401, 'Invalid token'));
    }
    return next(new ApiError(401, 'Authentication failed'));
  }

  // 3) Check if token is for a registrant (not an admin user)
  if (decoded.type !== 'registrant') {
    return next(new ApiError('Invalid authentication token for registrant portal', 401));
  }

  // REMOVE TEMPORARY BYPASS 
  // console.log('[DEBUG registrantAuth] Decoded token ID (RegistrantAccount ID):', decoded.id, 'Type:', decoded.type);
  // console.log('[DEBUG registrantAuth] Bypassing database lookup for RegistrantAccount.');
  // req.registrant = { id: decoded.id, type: decoded.type, email: decoded.email }; 
  // next();
  // return; 

  // --- ORIGINAL CODE RESTORED (adapted for Registration model) ---
  // 4) Check if registrant still exists
  // The 'decoded.id' from the token is the _id of the Registration document (from generateToken)
  const registration = await Registration.findById(decoded.id);
  if (!registration) {
    return next(new ApiError('The registrant belonging to this token no longer exists', 401));
  }

  // 5) Check if registrant account is active (assuming Registration model has an isActive status)
  // This part needs to be adapted based on your actual Registration model structure.
  // For example, if status is stored in registration.status:
  if (registration.status !== 'active' && registration.status !== 'checked-in') { // Example check
     // return next(new ApiError('This account has been deactivated or is not active', 401));
     console.warn(`[registrantAuth] Registrant ${registration._id} status is ${registration.status}, not active/checked-in. Allowing access for now.`);
  }

  // 6) Check if registrant is verified (if applicable, from Registration model)
  // if (!registration.isVerified) { // Example, if isVerified field exists
  //   return next(new ApiError('This account is not verified', 401));
  // }

  // Grant access to protected route
  // Populate req.registrant with the necessary fields from the Registration document
  req.registrant = {
    id: registration._id.toString(), // Ensure it's a string if other parts of app expect that
    // email: registration.personalInfo.email, // Example: if email is in personalInfo
    // registrationId: registration.registrationId, // The custom registration ID string
    // event: registration.event, // ObjectId of the event
    // category: registration.category, // ObjectId of the category
    // ... include other fields from 'registration' doc needed downstream by controllers
    _doc: registration._doc // Pass the whole document for now for flexibility in controllers
  };
  
  next();
}); 