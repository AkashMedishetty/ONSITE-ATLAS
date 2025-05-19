const mongoose = require('mongoose');
const Registration = require('../models/Registration');
const Event = require('../models/Event');
const Category = require('../models/Category');
const { createApiError } = require('../middleware/error');
const asyncHandler = require('../middleware/async');
const Resource = require('../models/Resource');
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');
const { sendPaginated } = require('../utils/pagination');
const { sendSuccess } = require('../utils/responseFormatter');
const { getNextSequenceValue, getNextSequenceBlock } = require('../utils/counterUtils');
const ExcelJS = require('exceljs');
const ImportJob = require('../models/ImportJob');
const { processBulkImportJob } = require('../services/registrationImportService');
const logger = require('../config/logger');
const jwt = require('jsonwebtoken');

// @desc    Get all registrations
// @route   GET /api/registrations
// @route   GET /api/events/:id/registrations
// @access  Private
const getRegistrations = asyncHandler(async (req, res) => {
  // Extract query parameters
  const { categoryId, status, search, page = 1, limit = 10 } = req.query;
  
  const eventId = req.params.id || req.query.eventId;
  
  console.log('Getting registrations with eventId:', eventId);
  
  const filter = {};
  
  if (eventId) {
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
        return sendSuccess(res, 400, 'Invalid Event ID format');
    }
    filter.event = eventId;
    console.log('Filtering registrations by event:', eventId);
  } else {
    console.warn(`[getRegistrations] Access attempt without eventId. User: ${req.user.id || 'UNKNOWN'}`);
    return sendPaginated(res, {
        message: 'Event ID is required to list registrations.',
        data: [],
        page: 1,
        limit: parseInt(limit),
        total: 0
    }, 400);
  }
  
  if (categoryId) filter.category = categoryId;
  if (status) filter.status = status;
  
  if (search) {
    filter.$or = [
      { registrationId: { $regex: search, $options: 'i' } },
      { 'personalInfo.firstName': { $regex: search, $options: 'i' } },
      { 'personalInfo.lastName': { $regex: search, $options: 'i' } },
      { 'personalInfo.email': { $regex: search, $options: 'i' } },
      { 'personalInfo.organization': { $regex: search, $options: 'i' } },
      { 'personalInfo.phone': { $regex: search, $options: 'i' } }
    ];
  }
  
  console.log('Registration filter:', JSON.stringify(filter, null, 2));
  
  const nLimit = parseInt(limit);
  const nPage = parseInt(page);
  const skip = (nPage - 1) * nLimit;
  
  const registrations = await Registration.find(filter)
    .populate('event', 'name startDate endDate logo')
    .populate('category', 'name color')
    .populate('printedBy', 'name email')
    .skip(skip)
    .limit(nLimit)
    .sort({ createdAt: -1 });
  
  console.log(`Found ${registrations.length} registrations`);
  
  const total = await Registration.countDocuments(filter);
  console.log(`Pagination values: total=${total}, page=${nPage}, limit=${nLimit}`);

  // Check if this is a specific lookup for registrant authentication
  // The frontend abstract portal uses search with registrationId and limit=1
  if (search && nLimit === 1 && total === 1 && registrations.length === 1) {
    const registrant = registrations[0];
    // Generate JWT for the registrant
    const payload = {
        id: registrant._id, // Registrant's MongoDB ID
        eventId: registrant.event?._id || registrant.event, // Ensure eventId is included
        registrationId: registrant.registrationId, // Include the string Registration ID
        type: 'registrant' 
    };
    
    // Use a specific secret for registrants if available, otherwise fallback to general JWT_SECRET
    const secret = process.env.REGISTRANT_JWT_SECRET || process.env.JWT_SECRET;
    const expiresIn = process.env.REGISTRANT_JWT_EXPIRES_IN || process.env.JWT_EXPIRES_IN || '1d';

    if (!secret) {
      console.error('[getRegistrations] JWT_SECRET or REGISTRANT_JWT_SECRET not configured for registrant login.');
      return res.status(500).json({
          success: false,
          message: 'Server configuration error: JWT secret not set.'
      });
    }

    const token = jwt.sign(payload, secret, { expiresIn });

    console.log(`[getRegistrations] Issuing JWT for registrant: ${registrant.registrationId}`);
    return res.status(200).json({
        success: true,
        message: 'Registrant authenticated successfully.',
        data: registrant, // Send the single registration object
        token: token      // Send the token
    });
  }
  
  // Otherwise, return paginated response as usual
  return sendPaginated(res, {
      message: 'Registrations retrieved successfully',
      data: registrations,
      page: nPage,
      limit: nLimit,
      total: total
  });
});

// @desc    Get count of registrations for an event
// @route   GET /api/events/:eventId/registrations/count
// @access  Private
const getRegistrationsCount = asyncHandler(async (req, res) => {
  // Get eventId from route parameters
  const eventId = req.params.eventId;
  
  console.log('Getting registration count for event:', eventId);
  
  if (!eventId) {
    return sendSuccess(res, 400, 'Event ID is required', { count: 0 });
  }
  
  try {
    // Build filter object
    const filter = { event: eventId };
    
    // Get counts for different statuses
    const totalCount = await Registration.countDocuments(filter);
    const checkedInCount = await Registration.countDocuments({
      ...filter,
      status: 'checked-in'
    });
    
    // Get counts by category
    const categoryCounts = await Registration.aggregate([
      { $match: filter },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);
    
    // Create a map of category IDs to counts
    const categoryCountMap = {};
    for (const item of categoryCounts) {
      if (item._id) {
        categoryCountMap[item._id.toString()] = item.count;
      }
    }
    
    // Get registrations created today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    
    const todayCount = await Registration.countDocuments({
      ...filter,
      createdAt: { $gte: startOfToday }
    });
    
    console.log(`Found ${totalCount} total registrations, ${checkedInCount} checked in, ${todayCount} today`);
    
    return sendSuccess(res, 200, 'Registration counts retrieved successfully', {
      total: totalCount,
      checkedIn: checkedInCount,
      categories: categoryCountMap,
      today: todayCount
    });
  } catch (error) {
    console.error('Error getting registration counts:', error);
    return sendSuccess(res, 500, 'Error retrieving registration counts', { count: 0 });
  }
});

// @desc    Get a single registration by ID
// @route   GET /api/registrations/:registrationId
// @route   GET /api/events/:id/registrations/:registrationId  <-- Nested Route
// @access  Private
const getRegistrationById = asyncHandler(async (req, res) => {
  const registrationId = req.params.registrationId;
  const eventId = req.params.id; // Event ID from parent route if nested

  if (!mongoose.Types.ObjectId.isValid(registrationId)) {
     return sendSuccess(res, 400, 'Invalid Registration ID format');
  }

  // Build query - always use registrationId
  const query = { _id: registrationId };
  
  // If eventId is present (nested route), enforce it
  if (eventId) {
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return sendSuccess(res, 400, 'Invalid Event ID format');
    }
    query.event = eventId; 
    console.log(`[getRegistrationById] Scoping query to event ${eventId}`);
  }

  const registration = await Registration.findOne(query)
    .populate('event', 'name startDate endDate logo')
    .populate('category', 'name color permissions');
  
  if (!registration) {
    // Make error message more specific
    const notFoundMessage = eventId
       ? `Registration with ID ${registrationId} not found within event ${eventId}`
       : `Registration not found with ID ${registrationId}`;
    return sendSuccess(res, 404, notFoundMessage);
  }
  
  // If accessed via non-nested route, eventId might be undefined, which is fine.
  // The check above handles the case where it IS nested.
  
  return sendSuccess(res, 200, 'Registration retrieved successfully', registration);
});

// @desc    Create a new registration
// @route   POST /api/registrations
// @route   POST /api/events/:eventId/registrations
// @access  Private
const createRegistration = asyncHandler(async (req, res) => {
  // Get eventId from params if route is nested, otherwise from body
  const eventId = req.params.eventId || req.body.eventId; 
  const { categoryId, personalInfo } = req.body;
  
  // Validate required fields
  if (!eventId || !categoryId || !personalInfo) {
    return sendSuccess(res, 400, 'Missing required fields: eventId, categoryId, personalInfo');
  }
  
  // Check if event exists
  const event = await Event.findById(eventId);
  if (!event) {
    return sendSuccess(res, 404, 'Event not found');
  }
  
  // Check if category exists
  const category = await Category.findById(categoryId);
  if (!category) {
    return sendSuccess(res, 404, 'Category not found');
  }
  
  // --- Use Counter Pattern for ID Generation --- 
  const registrationPrefix = event.registrationSettings?.idPrefix || 'REG';
  const startNumber = event.registrationSettings?.startNumber || 1;
  const sequenceName = `${eventId}_registration_id`; // Unique sequence name per event
  
  let registrationId;
  try {
    const nextNumber = await getNextSequenceValue(sequenceName, startNumber);
    const formattedNumber = nextNumber.toString().padStart(4, '0'); // Pad to 4 digits
    registrationId = `${registrationPrefix}-${formattedNumber}`;

    // Optional: Double-check uniqueness just in case (though counter should handle it)
    const existing = await Registration.findOne({ event: eventId, registrationId: registrationId });
    if (existing) {
       // This case should be extremely rare with the atomic counter
       console.error(`Generated duplicate ID ${registrationId} for event ${eventId} despite using counter. Retrying might be needed or check counter logic.`);
       return sendSuccess(res, 500, 'Failed to generate unique registration ID. Please try again.');
    }

  } catch (error) {
     console.error("Error generating registration ID using counter:", error);
     return sendSuccess(res, 500, 'Failed to generate registration ID');
  }
  // --- End ID Generation ---
  
  // Create new registration
  const registration = await Registration.create({
    registrationId,
    event: eventId,
    category: categoryId,
    personalInfo,
    status: 'active', // Ensure status is valid based on schema enum
    // Include other fields passed in req.body if necessary (e.g., customFields)
    ...(req.body.customFields && { customFields: req.body.customFields }),
    createdAt: new Date(),
    updatedAt: new Date()
  });
  
  // Return created registration with populated references
  const populatedRegistration = await Registration.findById(registration._id)
    .populate('event', 'name startDate endDate logo')
    .populate('category', 'name color permissions');
  
  // Send registration confirmation email if enabled
  if (event.emailSettings?.enabled && 
      event.emailSettings?.automaticEmails?.registrationConfirmation) {
    try {
      const emailService = require('../services/emailService'); // Consider importing at top level
      await emailService.sendRegistrationConfirmationEmail(registration._id);
    } catch (error) {
      console.error('Failed to send registration confirmation email:', error);
      // Don't fail the request if email sending fails
    }
  }
  
  return sendSuccess(res, 201, 'Registration created successfully', populatedRegistration);
});

// @desc    Update an existing registration
// @route   PUT /api/registrations/:registrationId
// @route   PUT /api/events/:id/registrations/:registrationId <-- Nested Route
// @access  Private
const updateRegistration = asyncHandler(async (req, res, next) => {
  const registrationId = req.params.registrationId;
  const eventId = req.params.id; // Event ID from parent route if nested
  
  // Log the entire request body, especially personalInfo, upon arrival
  console.log(`[Backend Update Start] Received PUT request for Registration ID: ${registrationId}, Event ID: ${eventId}`);
  console.log(`[Backend Update Start] Request Body:`, req.body);
  console.log(`[Backend Update Start] req.body.personalInfo:`, req.body.personalInfo);

  const { categoryId, personalInfo, status } = req.body;
  
  // Validate IDs
  if (!mongoose.Types.ObjectId.isValid(registrationId)) {
     return sendSuccess(res, 400, 'Invalid Registration ID format');
  }
  // If eventId is present (nested route), validate it
  if (eventId && !mongoose.Types.ObjectId.isValid(eventId)) {
     return sendSuccess(res, 400, 'Invalid Event ID format');
  }
  
  // Find registration by its ID first
  let registration = await Registration.findById(registrationId);
  
  // Primary check: Does the registration exist?
  if (!registration) {
    return sendSuccess(res, 404, `Registration not found with ID ${registrationId}`);
  }
  
  // Secondary check: If accessed via nested route, does it belong to the correct event?
  if (eventId && registration.event.toString() !== eventId) {
      console.warn(`[AUTH/SCOPE ERROR] Attempted to update registration ${registrationId} via event ${eventId}, but it belongs to event ${registration.event.toString()}`);
      // Return 404 to avoid revealing the registration exists elsewhere
      return sendSuccess(res, 404, `Registration not found within event ${eventId}`); 
  }
  
  // --- Proceed with updates only if checks pass ---
  if (categoryId) registration.category = categoryId;
  
  if (personalInfo) {
    console.log('[Backend Update] Updating personalInfo fields:', personalInfo);
    for (const key in personalInfo) {
      // Update if the key exists in the incoming data, regardless of previous value
      if (personalInfo.hasOwnProperty(key)) { 
        console.log(`[Backend Update] Setting personalInfo.${key} = ${personalInfo[key]}`);
        registration.personalInfo[key] = personalInfo[key];
      }
    }
    // Mongoose needs paths within subdocuments to be explicitly marked sometimes
    registration.markModified('personalInfo'); 
    console.log('[Backend Update] Marked personalInfo as modified.');
  }
  
  if (status) registration.status = status;
  
  registration.updatedAt = new Date();

  console.log('[Backend Pre-Save] Registration object before .save():', JSON.stringify(registration.toObject(), null, 2)); 

  await registration.save();
  console.log('[Backend Post-Save] Registration saved successfully.');

  // Return updated registration with populated references
  const updatedRegistration = await Registration.findById(registrationId)
    .populate('event', 'name startDate endDate logo')
    .populate('category', 'name color permissions');
  
  console.log('[Final Send] Sending updated data:', updatedRegistration);

  return sendSuccess(res, 200, 'Registration updated successfully', updatedRegistration);
});

// @desc    Delete a registration
// @route   DELETE /api/registrations/:registrationId
// @route   DELETE /api/events/:id/registrations/:registrationId <-- Nested Route
// @access  Private (Admin only)
const deleteRegistration = asyncHandler(async (req, res, next) => {
  const registrationId = req.params.registrationId;
  const eventId = req.params.id; // Event ID from parent route if nested

  // Validate IDs
  if (!mongoose.Types.ObjectId.isValid(registrationId)) {
     return sendSuccess(res, 400, 'Invalid Registration ID format');
  }
  // If eventId is present (nested route), validate it
  if (eventId && !mongoose.Types.ObjectId.isValid(eventId)) {
     return sendSuccess(res, 400, 'Invalid Event ID format');
  }

  // Construct query to find the specific registration
  const query = { _id: registrationId };
  
  // IMPORTANT: If called via nested route, ensure the registration BELONGS to the event
  if (eventId) {
      query.event = eventId;
      console.log(`[deleteRegistration] Scoping query to event ${eventId}`);
  }

  // Find the registration using the combined query
  const registration = await Registration.findOne(query);

  if (!registration) {
    // Make error message more specific
    const notFoundMessage = eventId
       ? `Registration with ID ${registrationId} not found within event ${eventId}`
       : `Registration not found with ID ${registrationId}`;
    return sendSuccess(res, 404, notFoundMessage);
  }

  // --- Proceed with deletion checks only if registration found in scope ---

  // Check if any resources have been used by this registration
  const usedResources = await Resource.find({ registration: registration._id }); 
  if (usedResources.length > 0) {
    return sendSuccess(res, 400, 'Cannot delete registration with used resources');
  }

  try {
    await registration.deleteOne();
    return sendSuccess(res, 200, 'Registration deleted successfully');
  } catch (error) {
     console.error(`Error deleting registration ${registrationId}:`, error);
     return next(createApiError(500, 'Failed to delete registration'));
  }
});

// @desc    Check in a registration
// @route   PATCH /api/registrations/:registrationId/check-in
// @route   PATCH /api/events/:id/registrations/:registrationId/check-in <-- Nested Route?
// @access  Private
const checkInRegistration = asyncHandler(async (req, res) => {
  const registrationId = req.params.registrationId;
  const eventId = req.params.id; // Event ID from parent route if nested

  if (!mongoose.Types.ObjectId.isValid(registrationId)) {
     return sendSuccess(res, 400, 'Invalid Registration ID format');
  }
  // Find registration by ID
  const registration = await Registration.findById(registrationId);
  
  if (!registration) {
    return sendSuccess(res, 404, `Registration not found with ID ${registrationId}`);
  }

  // If accessed via nested route, verify event match
  if (eventId) {
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
       return sendSuccess(res, 400, 'Invalid Event ID format');
    }
    if (registration.event.toString() !== eventId) {
      console.warn(`[AUTH/SCOPE ERROR] Attempted to check-in registration ${registrationId} via event ${eventId}, but it belongs to event ${registration.event.toString()}`);
      return sendSuccess(res, 404, `Registration not found within event ${eventId}`); 
  }
  }
  
  // --- Correctly update the nested checkIn object and badgePrinted status --- 
  let changesMade = false; // Flag to track if we need to save
  
  // Update check-in details if not already checked in
  if (!registration.checkIn?.isCheckedIn) {
      registration.checkIn = {
          isCheckedIn: true,
          checkedInAt: new Date(),
          checkedInBy: req.user?._id // Assuming req.user is populated by auth middleware
      };
      registration.markModified('checkIn');
      console.log(`Marked registration ${registrationId} as checked in.`);
      changesMade = true;
  }
  
  // Update badge printed status if not already marked
  if (!registration.badgePrinted) {
    registration.badgePrinted = true;
    registration.printedBy = req.user?._id; // Store who printed
    registration.printedAt = new Date(); // Store when printed
    console.log(`Marked registration ${registrationId} as badge printed by ${req.user?._id}.`);
    changesMade = true;
  }
  
  // Save changes only if any were made
  if (changesMade) {
    registration.updatedAt = new Date(); // Update the main updatedAt timestamp
  await registration.save();
    console.log(`Saved registration ${registrationId} after check-in/badge print update.`);
  } else {
     console.log(`No changes needed for registration ${registrationId} (already checked in and printed).`);
  }
  // --- End CheckIn/Print Update --- 
  
  // Return success, potentially with the updated registration object
  return sendSuccess(res, 200, 'Check-in/Print status updated successfully', registration);
});

// @desc    Import registrations in bulk
// @route   POST /api/events/:eventId/registrations/import
// @access  Private
const importRegistrations = asyncHandler(async (req, res, next) => {
  logger.info('[ImportRegController] Received bulk import request. Raw req.params: ' + JSON.stringify(req.params, null, 2));
  
  const { id: eventId } = req.params;
  const { registrations: incomingRegistrations, originalFileName } = req.body;

  if (!eventId || !mongoose.Types.ObjectId.isValid(eventId)) {
    logger.warn(`[ImportRegController] Invalid or missing eventId after extraction: ${eventId}`);
    return sendSuccess(res, 400, 'Valid Event ID is required.');
  }

  if (!incomingRegistrations || !Array.isArray(incomingRegistrations) || incomingRegistrations.length === 0) {
    logger.warn(`[ImportRegController] No registrations provided for event ${eventId}`);
    return sendSuccess(res, 400, 'No registration data provided or data is not an array.');
  }

  if (!req.user || !req.user._id) {
    logger.error('[ImportRegController] User not found on request. This should be protected by auth middleware.');
    return sendSuccess(res, 401, 'Authentication required.');
  }
  const userId = req.user._id;

  try {
    const event = await Event.findById(eventId).lean();
    if (!event) {
      logger.warn(`[ImportRegController] Event not found: ${eventId}`);
      return sendSuccess(res, 404, 'Event not found.');
    }

    const newJob = await ImportJob.create({
      eventId: eventId,
      totalRecords: incomingRegistrations.length,
      status: 'pending',
      createdBy: userId,
      originalFileName: originalFileName || 'Bulk Import', // Use provided filename or a default
    });

    logger.info(`[ImportRegController] Created ImportJob ${newJob._id} for event ${eventId} with ${incomingRegistrations.length} records by user ${userId}.`);

    // Call the service function asynchronously. DO NOT await it here.
    processBulkImportJob(newJob._id, incomingRegistrations, eventId, userId)
      .then(() => {
        logger.info(`[ImportRegController] processBulkImportJob for ${newJob._id} finished its execution path.`);
      })
      .catch(err => {
        // This catch is for errors in *triggering* or unhandled promise rejections from the async function itself,
        // not for errors *within* the job processing (those are handled by the service and saved to the job document).
        logger.error(`[ImportRegController] Error triggering processBulkImportJob for ${newJob._id}:`, err);
        // Optionally, update the job status to failed here if the trigger itself fails catastrophically.
        // However, the service should ideally handle its own errors and update the job status.
      });

    return sendSuccess(res, 202, 'Registration import process started.', { jobId: newJob._id });

  } catch (error) {
    logger.error(`[ImportRegController] Failed to create ImportJob for event ${eventId}:`, error);
    // Use next(error) for unhandled errors to be caught by global error handler
    // Or use createApiError if you have a specific structure for it
    return next(createApiError(500, 'Failed to start import process.', error.message));
  }
});

/**
 * @desc    Delete a registration
 * @route   DELETE /api/registrations/:id
 * @access  Private (Admin only)
 */
exports.deleteRegistration = asyncHandler(async (req, res, next) => {
  const registration = await Registration.findById(req.params.id);

  if (!registration) {
    return next(createApiError(404, `Registration not found with id of ${req.params.id}`));
  }

  // Check if any resources have been used by this registration
  const usedResources = await Resource.find({ registration: req.params.id });
  if (usedResources.length > 0) {
    return next(createApiError(400, 'Cannot delete registration with used resources'));
  }

  await registration.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});

/**
 * @desc    Generate QR code for registration
 * @route   POST /api/registrations/:id/qr
 * @access  Private (Admin only)
 */
exports.generateQrCode = asyncHandler(async (req, res, next) => {
  // Find registration
  const registration = await Registration.findById(req.params.id);

  if (!registration) {
    return next(createApiError(404, `Registration not found with id of ${req.params.id}`));
  }

  // Generate QR code if it doesn't exist
  if (!registration.qrCode) {
    registration.qrCode = crypto.randomBytes(12).toString('hex');
    await registration.save();
  }

  res.status(200).json({
    success: true,
    data: {
      qrCode: registration.qrCode
    }
  });
});

/**
 * @desc    Check in participant
 * @route   POST /api/registrations/:id/check-in
 * @access  Private
 */
exports.checkInParticipant = asyncHandler(async (req, res, next) => {
  // Find registration by ID
  const registration = await Registration.findById(req.params.id);

  if (!registration) {
    return next(createApiError(404, `Registration not found with id of ${req.params.id}`));
  }

  // Update check-in status
  registration.isCheckedIn = true;
  registration.checkedInAt = Date.now();
  registration.checkedInBy = req.user._id;

  // Add to activity log
  registration.activities = registration.activities || [];
  registration.activities.push({
    action: 'Checked In',
    description: 'Participant was checked in',
    user: req.user.name,
    timestamp: new Date()
  });

  await registration.save();

  res.status(200).json({
    success: true,
    data: registration
  });
});

/**
 * @desc    Find a registration by QR code or Registration ID
 * @route   GET /api/registrations/find/:qrOrRegId
 * @access  Private
 */
exports.findRegistrationByQrOrRegId = asyncHandler(async (req, res, next) => {
  const { qrOrRegId } = req.params;
  const { eventId } = req.query;

  if (!qrOrRegId) {
    return next(createApiError(400, 'QR Code or Registration ID is required'));
  }

  if (!eventId) {
    return next(createApiError(400, 'Event ID is required'));
  }

  // Find registration by QR code or registration ID
  const registration = await Registration.findOne({
    $or: [
      { qrCode: qrOrRegId },
      { registrationId: qrOrRegId }
    ],
    event: eventId
  }).populate('category', 'name description permissions');

  if (!registration) {
    return next(createApiError(404, 'Registration not found'));
  }

  // Get resources used by this registration
  const resources = await Resource.find({
    registration: registration._id,
    isVoided: { $ne: true }
  }).sort({ createdAt: -1 });

  // Format response
  const formattedRegistration = {
    _id: registration._id,
    registrationId: registration.registrationId,
    qrCode: registration.qrCode,
    status: registration.status,
    isCheckedIn: registration.isCheckedIn,
    checkedInAt: registration.checkedInAt,
    personalInfo: registration.personalInfo,
    contactInfo: registration.contactInfo,
    category: registration.category,
    resourceUsage: registration.resourceUsage || {
      meals: [],
      kitItems: [],
      certificates: []
    },
    resources: resources.map(r => ({
      _id: r._id,
      type: r.type,
      details: r.details,
      actionDate: r.actionDate
    }))
  };

  res.status(200).json({
    success: true,
    data: formattedRegistration
  });
});

/**
 * @desc    Send email to registrant
 * @route   POST /api/registrations/:id/send-email
 * @access  Private (Admin only)
 */
exports.sendEmailToRegistrant = asyncHandler(async (req, res, next) => {
  const { subject, message, emailType } = req.body;
  
  if (!subject || !message) {
    return next(createApiError(400, 'Please provide subject and message'));
  }

  // Find registration
  const registration = await Registration.findById(req.params.id)
    .populate('event', 'name startDate endDate location');

  if (!registration) {
    return next(createApiError(404, `Registration not found with id of ${req.params.id}`));
  }

  // Check if email exists
  if (!registration.contactInfo.email) {
    return next(createApiError(400, 'Registrant does not have an email address'));
  }

  try {
    // Send email
    await sendEmail({
      email: registration.contactInfo.email,
      subject,
      message,
      eventName: registration.event.name,
      name: registration.personalInfo.firstName || 'Participant',
      registrationId: registration.registrationId || '',
      qrCode: registration.qrCode || '',
      emailType: emailType || 'custom'
    });

    // Add to activity log
    registration.activities = registration.activities || [];
    registration.activities.push({
      action: 'Email Sent',
      description: `Email with subject "${subject}" was sent to ${registration.contactInfo.email}`,
      user: req.user.name,
      timestamp: new Date()
    });

    await registration.save();

    res.status(200).json({
      success: true,
      data: {
        message: `Email sent to ${registration.contactInfo.email}`
      }
    });
  } catch (err) {
    console.error('Email sending error:', err);
    return next(createApiError(500, 'Email could not be sent'));
  }
});

/**
 * @desc    Create a note on a registration
 * @route   POST /api/registrations/:id/notes
 * @access  Private
 */
exports.addRegistrationNote = asyncHandler(async (req, res, next) => {
  const { note } = req.body;
  
  if (!note) {
    return next(createApiError(400, 'Please provide a note'));
  }

  // Find registration
  const registration = await Registration.findById(req.params.id);

  if (!registration) {
    return next(createApiError(404, `Registration not found with id of ${req.params.id}`));
  }

  // Add note to registration
  registration.notes = registration.notes || [];
  registration.notes.push({
    text: note,
    createdBy: req.user._id,
    createdAt: new Date()
  });

  // Add to activity log
  registration.activities = registration.activities || [];
  registration.activities.push({
    action: 'Note Added',
    description: 'A note was added to the registration',
    user: req.user.name,
    timestamp: new Date()
  });

  await registration.save();

  res.status(200).json({
    success: true,
    data: registration.notes
  });
});

// @desc    Export registrations to Excel
// @route   GET /api/events/:id/registrations/export
// @access  Private
const exportRegistrationsController = asyncHandler(async (req, res) => {
  const eventId = req.params.id;
  const { category, status, search } = req.query; // Get filters from query

  console.log(`[Export] Starting export for event: ${eventId}, Filters:`, req.query);

  if (!eventId || !mongoose.Types.ObjectId.isValid(eventId)) { 
    console.error(`[Export] Invalid or missing Event ID from route params: ${eventId}`);
    return res.status(400).json({ success: false, message: 'Valid Event ID is required in the route.' });
  }

  try {
    // 1. Build Filter Query (using the validated eventId)
    const filter = { event: eventId };
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { registrationId: { $regex: search, $options: 'i' } },
        { 'personalInfo.firstName': { $regex: search, $options: 'i' } },
        { 'personalInfo.lastName': { $regex: search, $options: 'i' } },
        { 'personalInfo.email': { $regex: search, $options: 'i' } },
        { 'personalInfo.organization': { $regex: search, $options: 'i' } }
        // Add more searchable fields if needed
      ];
    }
    console.log('[Export] Applying filter:', filter);

    // 2. Fetch ALL matching registrations (no pagination)
    const registrations = await Registration.find(filter)
      .populate('category', 'name') // Populate category name
      .sort({ createdAt: -1 })
      .lean(); // Use .lean() for performance when not modifying docs
      
    console.log(`[Export] Found ${registrations.length} registrations to export.`);

    if (registrations.length === 0) {
       return sendSuccess(res, 404, 'No registrations found matching the criteria for export.');
    }

    // 3. Create Excel Workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'OnSite Atlas';
    workbook.created = new Date();
    const worksheet = workbook.addWorksheet('Registrations');

    // 4. Define Columns
    worksheet.columns = [
      { header: 'Registration ID', key: 'registrationId', width: 20 },
      { header: 'First Name', key: 'firstName', width: 20 },
      { header: 'Last Name', key: 'lastName', width: 20 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Phone', key: 'phone', width: 20 },
      { header: 'Organization', key: 'organization', width: 30 },
      { header: 'Designation', key: 'designation', width: 20 },
      { header: 'Country', key: 'country', width: 15 },
      { header: 'Category', key: 'category', width: 25 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Type', key: 'registrationType', width: 15 },
      { header: 'Registered At', key: 'createdAt', width: 20 },
      { header: 'Checked In', key: 'checkedIn', width: 15 },
      { header: 'Checked In At', key: 'checkedInAt', width: 20 },
      { header: 'Badge Printed', key: 'badgePrinted', width: 15 },
      // Add custom fields headers dynamically later if needed
    ];
    
    // Style Header Row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern:'solid',
      fgColor:{argb:'FFDDDDDD'} // Light grey fill
    };
    worksheet.getRow(1).border = {
      bottom: { style:'thin' }
    };

    // 5. Add Data Rows
    registrations.forEach(reg => {
      worksheet.addRow({
        registrationId: reg.registrationId,
        firstName: reg.personalInfo?.firstName || '',
        lastName: reg.personalInfo?.lastName || '',
        email: reg.personalInfo?.email || '',
        phone: reg.personalInfo?.phone || '',
        organization: reg.personalInfo?.organization || '',
        designation: reg.personalInfo?.designation || '',
        country: reg.personalInfo?.country || '',
        category: reg.category?.name || '', // Use populated category name
        status: reg.status,
        registrationType: reg.registrationType,
        createdAt: reg.createdAt ? reg.createdAt.toLocaleString() : '',
        checkedIn: reg.checkIn?.isCheckedIn ? 'Yes' : 'No',
        checkedInAt: reg.checkIn?.checkedInAt ? reg.checkIn.checkedInAt.toLocaleString() : '',
        badgePrinted: reg.badgePrinted ? 'Yes' : 'No',
        // Add custom fields data dynamically later if needed
      });
    });
    
    console.log('[Export] Added data rows to worksheet.');

    // 6. Set Response Headers
    const filename = `registrations_${eventId}_${new Date().toISOString().split('T')[0]}.xlsx`;
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"`
    );
    
    console.log(`[Export] Setting headers for filename: ${filename}`);

    // 7. Write Workbook to Response Stream
    await workbook.xlsx.write(res);
    res.end(); // End the response after writing the file
    console.log('[Export] Finished writing workbook to response.');

  } catch (error) {
    console.error('[Export] Error generating Excel export:', error);
    // Ensure response isn't already sent before sending error
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Failed to generate export file.', error: error.message });
    }
  }
});

/**
 * @desc    Get registration statistics for an event
 * @route   GET /api/events/:id/registrations/statistics
 * @access  Private
 */
const getRegistrationStatistics = asyncHandler(async (req, res, next) => {
  const { id: eventId } = req.params; // Get eventId from the merged params

  if (!eventId || !mongoose.Types.ObjectId.isValid(eventId)) {
    // Use createApiError for consistency
    return next(createApiError(400, 'Invalid or missing Event ID')); 
  }

  try {
    // Aggregation pipeline
    const statsPipeline = [
      {
        $match: {
          event: new mongoose.Types.ObjectId(eventId)
        }
      },
      {
        $facet: { // Perform multiple aggregations in parallel
          "total": [
            { $count: "count" }
          ],
          "byStatus": [
            { $group: { _id: "$status", count: { $sum: 1 } } },
            { $group: { _id: null, counts: { $push: { k: "$_id", v: "$count" } } } },
            { $replaceRoot: { newRoot: { $arrayToObject: "$counts" } } }
          ],
          "byCategory": [
            { $group: { _id: "$category", count: { $sum: 1 } } },
            { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'categoryInfo' } },
            { $unwind: { path: "$categoryInfo", preserveNullAndEmptyArrays: true } }, // Keep registrations even if category is deleted
            { $group: { _id: null, counts: { $push: { k: { $ifNull: ["$categoryInfo.name", "Uncategorized"] }, v: "$count" } } } },
            { $replaceRoot: { newRoot: { $arrayToObject: "$counts" } } }
          ],
          "checkedIn": [
            { $match: { isCheckedIn: true } },
            { $count: "count" }
          ],
          "byDay": [
             { $group: { 
                 _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, 
                 count: { $sum: 1 } 
             } },
             { $sort: { _id: 1 } }, // Sort by date
             { $project: { _id: 0, date: "$_id", count: "$count" } }
          ]
        }
      }
    ];

    const results = await Registration.aggregate(statsPipeline);

    // Process the results from the $facet stage
    const statistics = {
      total: results[0]?.total[0]?.count || 0,
      checkedIn: results[0]?.checkedIn[0]?.count || 0,
      byStatus: results[0]?.byStatus[0] || {},
      byCategory: results[0]?.byCategory[0] || {},
      byDay: results[0]?.byDay || []
      // Add default statuses if needed
    };
    
    // Ensure default statuses exist
    const defaultStatuses = { draft: 0, active: 0, inactive: 0, cancelled: 0 };
    statistics.byStatus = { ...defaultStatuses, ...statistics.byStatus };

    sendSuccess(res, 200, 'Registration statistics retrieved successfully', statistics);

  } catch (error) {
    console.error(`Error fetching registration statistics for event ${eventId}:`, error);
    // Use createApiError for consistency
    next(createApiError(500, 'Server error fetching registration statistics', error.message)); 
  }
});

/**
 * @desc    Get status of a bulk import job
 * @route   GET /api/import-jobs/:jobId/status
 * @access  Private (Assumed, ensure 'protect' middleware is added to the route)
 */
const getImportJobStatus = asyncHandler(async (req, res, next) => {
  const { jobId } = req.params;

  if (!jobId || !mongoose.Types.ObjectId.isValid(jobId)) {
    return sendSuccess(res, 400, 'Valid Job ID is required.');
  }

  try {
    const job = await ImportJob.findById(jobId)
      .populate('eventId', 'name') // Populate event name for context
      .populate('createdBy', 'name email'); // Populate user details

    if (!job) {
      return sendSuccess(res, 404, 'Import job not found.');
    }

    // Optionally, check if req.user is admin or owner of the job if more granular access control is needed
    // For now, assuming if they have the jobId and are authenticated, they can see status.

    return sendSuccess(res, 200, 'Import job status retrieved successfully.', job);
  } catch (error) {
    logger.error(`[GetImportJobStatus] Error fetching job ${jobId}:`, error);
    return next(createApiError(500, 'Failed to retrieve import job status.', error.message));
  }
});

/**
 * @desc    Get registration details by QR code string or registration ID string for a specific event
 * @route   POST /api/events/:eventId/registrations/scan
 * @access  Private
 */
const getRegistrationDetailsByScan = asyncHandler(async (req, res, next) => {
  const eventId = req.params.id; // From the parent router :id mapped to /events/:id
  const { qrCode } = req.body; // qrCode can be registrationId string or actual QR content

  logger.info(`[getRegistrationDetailsByScan] Attempting to find registration for event: ${eventId} with QR/ID: ${qrCode}`);

  if (!eventId || !mongoose.Types.ObjectId.isValid(eventId)) {
    logger.warn(`[getRegistrationDetailsByScan] Invalid or missing eventId: ${eventId}`);
    return sendSuccess(res, 400, 'Valid Event ID is required.');
  }

  if (!qrCode) {
    logger.warn(`[getRegistrationDetailsByScan] Missing qrCode in request body.`);
    return sendSuccess(res, 400, 'QR code or Registration ID is required in the request body.');
  }

  // Find the registration by QR code or registrationId string
  // The 'qrCode' field in the model stores the unique QR code content.
  // The 'registrationId' field stores the human-readable ID like "REG-1234".
  // The scanned value could be either.
  const registration = await Registration.findOne({
    event: eventId,
    $or: [
      { qrCode: qrCode },
      { registrationId: qrCode }
    ]
  })
  .populate('event', 'name startDate endDate logo')
  .populate('category', 'name color permissions resourcePermissions') // Added resourcePermissions
  .populate('personalInfo'); // Assuming personalInfo is a subdocument or separate populated field

  if (!registration) {
    logger.warn(`[getRegistrationDetailsByScan] Registration not found for event ${eventId} with QR/ID: ${qrCode}`);
    return sendSuccess(res, 404, 'Registration not found for the given QR code/ID and event.');
  }

  logger.info(`[getRegistrationDetailsByScan] Found registration: ${registration._id} (${registration.registrationId})`);
  
  return sendSuccess(res, 200, 'Registration details retrieved successfully.', registration);
});

module.exports = {
  getRegistrations,
  getRegistrationsCount,
  getRegistrationById,
  createRegistration,
  updateRegistration,
  deleteRegistration,
  checkInRegistration,
  importRegistrations,
  exportRegistrationsController,
  getRegistrationStatistics,
  getImportJobStatus,
  getRegistrationDetailsByScan
}; 