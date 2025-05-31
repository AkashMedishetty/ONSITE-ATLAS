const httpStatus = require('http-status');
const { EventSponsor } = require('../models');
const { ApiError } = require('../utils/ApiError');
const asyncHandler = require('../middleware/async'); // Changed from catchAsync to asyncHandler
const jwt = require('jsonwebtoken');
const config = require('../config/config'); // For JWT secret and expiry

/**
 * Generates a JWT for a given sponsor user.
 * @param {Object} sponsor - The EventSponsor mongoose document.
 * @returns {string} JWT token.
 */
const generateSponsorToken = (sponsor) => {
  const payload = {
    id: sponsor._id, // EventSponsor document _id
    eventId: sponsor.event, // ObjectId of the event
    sponsorId: sponsor.sponsorId, // The generated SPN-xxxx-nnn ID
    type: 'sponsor', // To distinguish from other user/registrant types
  };
  // Set sponsor JWT expiry to 4 hours regardless of config
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: '4h', // 4 hours for sponsor sessions
  });
};

const loginSponsor = asyncHandler(async (req, res) => { // Used asyncHandler here
  const { eventId } = req.params;
  const { sponsorId, password } = req.body; // password here is the contactPhone

  if (!sponsorId || !password) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Sponsor ID and password are required');
  }

  const sponsor = await EventSponsor.findOne({ sponsorId, event: eventId });

  if (!sponsor) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect Sponsor ID or password');
  }

  // Check if password matches
  const isPasswordMatch = await sponsor.isPasswordMatch(password);
  if (!isPasswordMatch) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect Sponsor ID or password');
  }

  // Check if sponsor account is active
  if (sponsor.status === 'Inactive') {
    throw new ApiError(httpStatus.FORBIDDEN, 'Sponsor account is inactive. Please contact event admin.');
  }

  // Generate token
  const token = generateSponsorToken(sponsor);

  // Send response
  res.status(httpStatus.OK).json({
    success: true,
    message: 'Sponsor login successful',
    token,
    sponsor: {
      // Return only necessary sponsor details, exclude sensitive info like hashed password
      id: sponsor._id,
      sponsorId: sponsor.sponsorId,
      companyName: sponsor.companyName,
      email: sponsor.email, // Changed from contactEmail
      eventId: sponsor.event,
      status: sponsor.status,
    },
  });
});

// @desc    Get the profile of the currently logged-in sponsor
// @route   GET /api/sponsor-auth/me
// @access  Private (Sponsor)
const getSponsorProfile = asyncHandler(async (req, res) => {
  // The protect middleware should have already populated req.user with the sponsor document
  // req.user will be the full EventSponsor document if using the existing protect middleware strategy
  const sponsor = await EventSponsor.findById(req.user.id);

  if (!sponsor) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Sponsor profile not found.');
  }

  res.status(httpStatus.OK).json({
    success: true,
    data: {
      id: sponsor._id,
      sponsorId: sponsor.sponsorId,
      companyName: sponsor.companyName,
      authorizedPerson: sponsor.authorizedPerson,
      email: sponsor.email,
      displayPhoneNumber: sponsor.displayPhoneNumber, // Added this field
      sponsoringAmount: sponsor.sponsoringAmount,
      registrantAllotment: sponsor.registrantAllotment,
      description: sponsor.description,
      status: sponsor.status,
      event: sponsor.event,
    },
  });
});

// @desc    Get registrants associated with the currently logged-in sponsor for their event
// @route   GET /api/sponsor-auth/me/registrants
// @access  Private (Sponsor)
const getSponsorRegistrants = asyncHandler(async (req, res) => {
  const sponsorId = req.user.id; // This is EventSponsor._id from protect middleware
  const eventId = req.user.eventId; // This is event._id from protect middleware

  if (!sponsorId || !eventId) {
    // This case should ideally be prevented by the protect middleware ensuring user and eventId are set
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Authentication details are missing.');
  }

  // Find registrations for the given event that are sponsored by this sponsor
  const registrants = await EventSponsor.findById(sponsorId).populate({
    path: 'event',
    match: { _id: eventId }, // Ensure we are fetching for the correct event context from token
    populate: {
        path: 'registrations',
        match: { sponsoredBy: sponsorId }, // Filter registrations by the sponsorId
        select: 'personalInfo.firstName personalInfo.lastName personalInfo.email status createdAt registrationId',
        // Add any other fields you want to return for the registrant list
    }
  });

  // The above query structure might be complex due to how sponsor and event are linked in the token.
  // A more direct query on the Registration model might be simpler if req.user.id is the Sponsor's _id
  // and req.user.eventId is the event's _id.

  const directRegistrantsQuery = await require('../models').Registration.find({
    event: eventId,
    sponsoredBy: sponsorId,
  }).select('personalInfo.firstName personalInfo.lastName personalInfo.email status createdAt registrationId event category'); 
  // Added event and category to the selection for completeness, if needed by frontend.

  if (!directRegistrantsQuery) {
    // This is unlikely to be null if the query runs, more likely an empty array.
    // Consider if specific error handling for "no registrants found" is different from success with empty list.
    return res.status(httpStatus.OK).json({
      success: true,
      message: 'No registrants found for this sponsor and event.',
      data: [],
    });
  }

  res.status(httpStatus.OK).json({
    success: true,
    count: directRegistrantsQuery.length,
    data: directRegistrantsQuery,
  });
});

module.exports = {
  loginSponsor,
  generateSponsorToken, // Exporting for potential use elsewhere if needed (e.g. sponsor creation)
  getSponsorProfile, // Export the new function
  getSponsorRegistrants, // Export the new function for fetching registrants
}; 