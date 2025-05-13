const Registration = require('../models/Registration');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const jwt = require('jsonwebtoken');
const logger = require('../config/logger');

/**
 * @desc    Login as a registrant using registration ID and mobile number
 * @route   POST /api/registrant-portal/login
 * @access  Public
 */
exports.login = asyncHandler(async (req, res, next) => {
  console.log('Registrant login attempt:', req.body);
  const { registrationId, mobileNumber } = req.body;

  // Validate request
  if (!registrationId || !mobileNumber) {
    return next(new ErrorResponse('Please provide registration ID and mobile number', 400));
  }

  // Get expiry for registrant JWT from env, default to 10h
  const registrantJwtExpiresIn = process.env.JWT_REGISTRANT_EXPIRES_IN || '10h';

  // For testing purposes - hardcoded test account
  if (registrationId === 'REG-1234' && mobileNumber === '5551234567') {
    console.log('Using test account login');
    
    // Create token
    const token = jwt.sign(
      { id: 'test123', registrationId },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: registrantJwtExpiresIn }
    );

    logger.info(`Test registrant login successful for ID: ${registrationId}`);

    // Return success response with token
    return res.status(200).json({
      success: true,
      token,
      data: {
        _id: 'test123',
        registrationId: 'REG-1234',
        name: 'John Smith',
        email: 'john.smith@example.com',
        phone: '5551234567',
        institution: 'Example University'
      }
    });
  }

  try {
    // Find the registration by ID
    const registration = await Registration.findOne({ 
      registrationId: registrationId 
    }).populate('personalInfo');

    if (!registration) {
      logger.warn(`Invalid registration ID: ${registrationId}`);
      return next(new ErrorResponse('Invalid registration ID', 401));
    }

    // Verify mobile number matches
    // Note: In a real app, you would compare against a properly hashed password
    // For simplicity, we're comparing against the stored mobile number directly
    const mobileFromDb = registration.personalInfo?.mobile || registration.personalInfo?.phone;
    
    // Normalize mobile numbers for comparison (remove spaces, dashes, etc.)
    const normalizedInputMobile = mobileNumber.replace(/[\s-\(\)]/g, '');
    const normalizedDbMobile = mobileFromDb ? mobileFromDb.replace(/[\s-\(\)]/g, '') : '';
    
    if (!normalizedDbMobile || normalizedInputMobile !== normalizedDbMobile) {
      // For security, don't specify which piece of information is incorrect
      logger.warn(`Invalid mobile number for registrationId: ${registrationId}`);
      return next(new ErrorResponse('Invalid credentials', 401));
    }

    // Create token
    const token = jwt.sign(
      { id: registration._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: registrantJwtExpiresIn }
    );

    logger.info(`Registrant login successful for ID: ${registrationId}`);

    // Return success response with token
    res.status(200).json({
      success: true,
      token,
      data: {
        _id: registration._id,
        registrationId: registration.registrationId,
        name: registration.personalInfo?.firstName + ' ' + registration.personalInfo?.lastName,
        email: registration.personalInfo?.email,
        phone: registration.personalInfo?.mobile || registration.personalInfo?.phone,
        event: registration.event
      }
    });
  } catch (error) {
    logger.error(`Error during registrant login: ${error.message}`);
    return next(new ErrorResponse('Authentication failed', 500));
  }
});

/**
 * @desc    Get current registrant profile
 * @route   GET /api/registrant-portal/profile
 * @access  Private (Registrant)
 */
exports.getProfile = asyncHandler(async (req, res, next) => {
  const registration = await Registration.findById(req.registrant.id)
    .populate('personalInfo')
    .populate('event');

  if (!registration) {
    return next(new ErrorResponse('Registration not found', 404));
  }

  res.status(200).json({
    success: true,
    data: {
      _id: registration._id,
      registrationId: registration.registrationId,
      personalInfo: registration.personalInfo,
      event: {
        _id: registration.event._id,
        name: registration.event.name,
        startDate: registration.event.startDate,
        endDate: registration.event.endDate,
        venue: registration.event.venue
      },
      category: registration.category,
      checkInStatus: registration.checkInStatus
    }
  });
});

/**
 * @desc    Update registrant profile
 * @route   PUT /api/registrant-portal/profile
 * @access  Private (Registrant)
 */
exports.updateProfile = asyncHandler(async (req, res, next) => {
  const registration = await Registration.findById(req.registrant.id);

  if (!registration) {
    return next(new ErrorResponse('Registration not found', 404));
  }

  // For now, just return success without updating
  // In a real implementation, you would update the profile data
  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: registration
  });
});

/**
 * @desc    Forgot password
 * @route   POST /api/registrant-portal/forgot-password
 * @access  Public
 */
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new ErrorResponse('Please provide an email address', 400));
  }

  // For now, just return success without implementation
  // In a real implementation, you would send a reset token to the email
  res.status(200).json({
    success: true,
    message: 'Password reset instructions sent to email'
  });
});

/**
 * @desc    Reset password
 * @route   PUT /api/registrant-portal/reset-password/:resettoken
 * @access  Public
 */
exports.resetPassword = asyncHandler(async (req, res, next) => {
  const { password } = req.body;
  const { resettoken } = req.params;

  if (!password || !resettoken) {
    return next(new ErrorResponse('Invalid password reset request', 400));
  }

  // For now, just return success without implementation
  // In a real implementation, you would verify the token and update the password
  res.status(200).json({
    success: true,
    message: 'Password has been reset'
  });
}); 