const { 
  Registration,
  Event,
  Workshop,
  Resource,
  Abstract,
  Category,
  Payment
} = require('../models');
const jwt = require('jsonwebtoken');
const asyncHandler = require('../middleware/async');
const { ApiError } = require('../utils/ApiError');
const config = require('../config/config');
const mongoose = require('mongoose');
const { ErrorResponse, createApiError } = require('../middleware/error');
const BadgeTemplate = require('../models/BadgeTemplate');
const RegistrantAccount = require('../models/RegistrantAccount');
const { sendSuccess } = require('../utils/responseFormatter');
const { generateRegistrationId } = require('../utils/idGenerator');
const { verifyPayment } = require('../controllers/paymentController');
// const { generateCertificate } = require('../services/certificateGenerator'); // Commented out as file doesn't exist yet
const qrcode = require('qrcode');
const pdfkit = require('pdfkit');
const logger = require('../config/logger'); // Assuming logger is setup and can be imported

// Import controllers for re-exporting specific functions
const registrantController = require('./registrant.controller'); // Contains getProfile, forgotPassword, resetPassword
const paymentController = require('./paymentController'); // Contains getInvoice
const resourceController = require('./resource.controller'); // Contains getResources (list version)

const Announcement = require('../models/Announcement'); // Import Announcement model

// Generate JWT token for registrant
const generateToken = (registrantId) => {
  return jwt.sign(
    { id: registrantId, type: 'registrant' },
    config.jwt.secret,
    { expiresIn: `${config.jwt.accessExpirationMinutes}m` }
  );
};

// Create and send token to client
// Modified to add defaultEventId to the registrant object in the response
const createSendToken = (registrant, statusCode, res, defaultEventId) => {
  const token = generateToken(registrant._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + config.jwt.refreshExpirationDays * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/' // Make cookie available to all paths
  };

  res.cookie('jwt', token, cookieOptions);

  // Create a plain object from the Mongoose document to be able to add properties
  const registrantData = registrant.toObject ? registrant.toObject() : { ...registrant };

  // Remove password from output if it exists
  delete registrantData.password; 

  // Add defaultEventId to the response data
  if (defaultEventId) {
    registrantData.defaultEventId = defaultEventId;
  }

  res.status(statusCode).json({
    status: 'success',
    success: true, // Added success field to match frontend expectation
    token,
    data: registrantData // Send modified registrantData (was 'data: { registrant }')
  });
};

/**
 * Authenticate a registrant
 */
exports.login = asyncHandler(async (req, res, next) => {
  console.log('EXECUTING LOGIN FROM registrantPortalController.js (PLURAL) - THIS IS THE CORRECT ONE!');
  // Get eventId from request body
  const { registrationId, mobileNumber, eventId } = req.body; 
  
  // Validate required fields
  if (!registrationId) {
    return next(new ApiError('Please provide your Registration ID', 400));
  }
  if (!mobileNumber) {
    return next(new ApiError('Please provide your Mobile Number', 400));
  }
  if (!eventId) {
    return next(new ApiError('Event context is required for login.', 400));
  }
  
  // Find registration by the custom registration ID field AND eventId
  const registration = await Registration.findOne({
    registrationId: registrationId,
    event: eventId // Enforce event context
  })
    .select('+personalInfo.phone +password');
  
  // If no registration found for this ID AND this event
  if (!registration) {
    return next(new ApiError('Invalid Registration ID or Mobile Number for this event.', 401));
  }

  // Verify mobile number (or password if implemented)
  if (!registration.personalInfo || registration.personalInfo.phone !== mobileNumber) {
      return next(new ApiError('Invalid Registration ID or Mobile Number for this event.', 401));
  }

  // Successfully authenticated for this specific event
  const defaultEventId = registration.event; // This will now match the eventId from the request

  createSendToken(registration, 200, res, defaultEventId ? defaultEventId.toString() : null);
});

/**
 * Get current registrant
 */
exports.getCurrentRegistrant = asyncHandler(async (req, res, next) => {
  const registration = await Registration.findById(req.registrant.id)
    .populate('event', 'name startDate endDate')
    .populate('category', 'name color')
    .populate('customFields.field', 'label type options');
  
  if (!registration) {
    return next(new ApiError('Registration not found', 404));
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      registration
    }
  });
});

/**
 * Update profile information
 */
exports.updateProfile = asyncHandler(async (req, res, next) => {
  const { 
    firstName, 
    lastName, 
    email, 
    phone, 
    organization, 
    designation,
    country,
    customFieldValues 
  } = req.body;
  
  const registration = await Registration.findById(req.registrant.id);
  
  if (!registration) {
    return next(new ApiError('Registration not found', 404));
  }
  
  // Ensure personalInfo object exists
  if (!registration.personalInfo) {
    registration.personalInfo = {};
  }

  // Update personalInfo fields
  if (firstName !== undefined) registration.personalInfo.firstName = firstName;
  if (lastName !== undefined) registration.personalInfo.lastName = lastName;
  if (email !== undefined) registration.personalInfo.email = email;
  if (phone !== undefined) registration.personalInfo.phone = phone;
  if (organization !== undefined) registration.personalInfo.organization = organization;
  if (designation !== undefined) registration.personalInfo.designation = designation;
  if (country !== undefined) registration.personalInfo.country = country;
  
  // Handle custom field updates if provided
  if (customFieldValues && Array.isArray(customFieldValues)) {
    customFieldValues.forEach(item => {
      const existingFieldIndex = registration.customFields.findIndex(
        field => field.field && field.field.toString() === item.fieldId
      );
      
      if (existingFieldIndex >= 0) {
        registration.customFields[existingFieldIndex].value = item.value;
      } else {
        // Ensure fieldId is a valid ObjectId if it's supposed to be
        if (mongoose.Types.ObjectId.isValid(item.fieldId)) {
          registration.customFields.push({
            field: item.fieldId,
            value: item.value
          });
        } else {
          logger.warn(`Invalid fieldId provided for custom field update: ${item.fieldId}`);
        }
      }
    });
  }
  
  await registration.save();
  
  // Populate necessary fields for the response
  const updatedRegistration = await Registration.findById(registration._id)
    .populate('event', 'name startDate endDate')
    .populate('category', 'name color')
    .populate('customFields.field', 'label type options');

  // Generate a new token for the registrant
  const newToken = jwt.sign(
    { id: updatedRegistration._id, type: 'registrant' },
    config.jwt.secret,
    { expiresIn: `${config.jwt.accessExpirationMinutes}m` }
  );

  res.status(200).json({
    status: 'success',
    token: newToken,
    data: {
      registration: updatedRegistration
    }
  });
});

/**
 * Get event details for registrant
 */
exports.getEventDetails = asyncHandler(async (req, res, next) => {
  const { eventId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(eventId)) {
    return next(new ApiError('Invalid Event ID format', 400));
  }
  
  const event = await Event.findById(eventId);
  
  if (!event) {
    return next(new ApiError('Event not found', 404));
  }
  
  // Optional: Check if the registrant is actually registered for this event if needed.
  // This depends on your business logic. For now, any authenticated registrant can fetch any event's details by ID.
  // const registration = await Registration.findOne({ _id: req.registrant.id, event: eventId });
  // if (!registration) {
  //   return next(new ApiError('You are not registered for this event or event not found.', 403));
  // }

  res.status(200).json({
    status: 'success',
    data: {
      event
    }
  });
});

/**
 * Get available workshops
 */
exports.getAvailableWorkshops = asyncHandler(async (req, res, next) => {
  const registration = await Registration.findById(req.registrant.id);
  
  if (!registration) {
    return next(new ApiError('Registration not found', 404));
  }
  
  // Find workshops for the event
  const workshops = await Workshop.find({
    event: registration.event,
    isActive: true,
    startDateTime: { $gte: new Date() }  // Only future workshops
  }).sort({ startDateTime: 1 });
  
  // Add availability information
  const workshopsWithAvailability = workshops.map(workshop => {
    const registrationCount = workshop.registrations ? workshop.registrations.length : 0;
    const isRegistered = workshop.registrations && 
      workshop.registrations.some(reg => reg.toString() === req.registrant.id);
    
    return {
      ...workshop.toObject(),
      availableSeats: workshop.capacity - registrationCount,
      isRegistered
    };
  });
  
  res.status(200).json({
    status: 'success',
    results: workshopsWithAvailability.length,
    data: {
      workshops: workshopsWithAvailability
    }
  });
});

/**
 * Register for a workshop
 */
exports.registerForWorkshop = asyncHandler(async (req, res, next) => {
  const { workshopId } = req.params;
  
  // Find the registration
  const registration = await Registration.findById(req.registrant.id);
  if (!registration) {
    return next(new ApiError('Registration not found', 404));
  }
  
  // Find the workshop
  const workshop = await Workshop.findOne({
    _id: workshopId,
    event: registration.event
  });
  
  if (!workshop) {
    return next(new ApiError('Workshop not found', 404));
  }
  
  // Check if already registered
  if (workshop.registrations && workshop.registrations.includes(req.registrant.id)) {
    return next(new ApiError('Already registered for this workshop', 400));
  }
  
  // Check capacity
  const registrationCount = workshop.registrations ? workshop.registrations.length : 0;
  if (registrationCount >= workshop.capacity) {
    return next(new ApiError('Workshop is at full capacity', 400));
  }
  
  // Add registration to workshop
  workshop.registrations = workshop.registrations || [];
  workshop.registrations.push(req.registrant.id);
  await workshop.save();
  
  // Add workshop to registration
  registration.workshops = registration.workshops || [];
  registration.workshops.push(workshopId);
  await registration.save();
  
  res.status(200).json({
    status: 'success',
    message: 'Successfully registered for workshop',
    data: {
      workshop
    }
  });
});

/**
 * Cancel workshop registration
 */
exports.cancelWorkshopRegistration = asyncHandler(async (req, res, next) => {
  const { workshopId } = req.params;
  
  // Find the registration
  const registration = await Registration.findById(req.registrant.id);
  if (!registration) {
    return next(new ApiError('Registration not found', 404));
  }
  
  // Find the workshop
  const workshop = await Workshop.findOne({
    _id: workshopId,
    event: registration.event
  });
  
  if (!workshop) {
    return next(new ApiError('Workshop not found', 404));
  }
  
  // Check if registered
  if (!workshop.registrations || !workshop.registrations.includes(req.registrant.id)) {
    return next(new ApiError('Not registered for this workshop', 400));
  }
  
  // Remove registration from workshop
  workshop.registrations = workshop.registrations.filter(
    regId => regId.toString() !== req.registrant.id
  );
  await workshop.save();
  
  // Remove workshop from registration
  registration.workshops = registration.workshops.filter(
    wsId => wsId.toString() !== workshopId
  );
  await registration.save();
  
  res.status(200).json({
    status: 'success',
    message: 'Workshop registration cancelled successfully'
  });
});

/**
 * Get registered workshops
 */
exports.getRegisteredWorkshops = asyncHandler(async (req, res, next) => {
  const registration = await Registration.findById(req.registrant.id)
    .populate({
      path: 'workshops',
      select: 'title description startDateTime endDateTime location capacity'
    });
  
  if (!registration) {
    return next(new ApiError('Registration not found', 404));
  }
  
  res.status(200).json({
    status: 'success',
    results: registration.workshops ? registration.workshops.length : 0,
    data: {
      workshops: registration.workshops || []
    }
  });
});

/**
 * Get resource history (meals, kits, etc)
 */
exports.getResourceHistory = asyncHandler(async (req, res, next) => {
  const registration = await Registration.findById(req.registrant.id);
  
  if (!registration) {
    return next(new ApiError('Registration not found', 404));
  }
  
  // Get resource tracking records
  const resourceRecords = await Resource.find({
    registration: req.registrant.id
  })
    .populate('resource', 'name type description')
    .populate('issuedBy', 'name')
    .sort({ createdAt: -1 });
  
  // Group by resource type
  const groupedResources = resourceRecords.reduce((acc, record) => {
    const type = record.resource ? record.resource.type : 'other';
    
    if (!acc[type]) {
      acc[type] = [];
    }
    
    acc[type].push(record);
    return acc;
  }, {});
  
  res.status(200).json({
    status: 'success',
    data: {
      resourceHistory: groupedResources
    }
  });
});

/**
 * Get abstracts submitted by the registrant for a specific event
 */
exports.getAbstractsForEvent = asyncHandler(async (req, res, next) => {
  const { eventId } = req.params;
  const registrantId = req.registrant.id;

  if (!mongoose.Types.ObjectId.isValid(eventId)) {
    return next(new ApiError('Invalid Event ID format', 400));
  }

  // Optional: Check if registrant is associated with this event if necessary
  // const registration = await Registration.findOne({ _id: registrantId, event: eventId });
  // if (!registration) {
  //   return next(new ApiError('Access denied: You are not registered for this event or event not found.', 403));
  // }

  const abstracts = await Abstract.find({
    event: eventId,
    registration: registrantId // Ensure abstracts are fetched only for the logged-in registrant for that event
  }).sort({ submissionDate: -1 });
  
  res.status(200).json({
    status: 'success',
    results: abstracts.length,
    data: {
      abstracts
    }
  });
});

/**
 * Submit an abstract for a specific event
 */
exports.submitAbstractForEvent = asyncHandler(async (req, res, next) => {
  const { eventId } = req.params;
  const registrantId = req.registrant.id;

  if (!mongoose.Types.ObjectId.isValid(eventId)) {
    return next(new ApiError('Invalid Event ID format', 400));
  }

  // Verify the registrant is part of the event they are submitting an abstract to
  const registration = await Registration.findOne({ _id: registrantId, event: eventId });
  if (!registration) {
    return next(new ApiError('Cannot submit abstract: You are not registered for this event or the event is invalid.', 403));
  }
  
  const abstractData = {
    ...req.body,
    registration: registrantId,
    event: eventId, // Ensure the abstract is associated with the correct eventId from the URL
    submissionDate: new Date(),
    status: 'submitted'
  };
  
  const abstract = await Abstract.create(abstractData);
  
  res.status(201).json({
    status: 'success',
    data: {
      abstract
    }
  });
});

/**
 * Get QR code for registration
 */
exports.getQRCode = asyncHandler(async (req, res, next) => {
  const registration = await Registration.findById(req.registrant.id);
  
  if (!registration) {
    return next(new ApiError('Registration not found', 404));
  }
  
  // In a real implementation, you would generate a QR code
  // For now, we'll return registration details
  res.status(200).json({
    status: 'success',
    data: {
      registrationId: registration._id,
      qrCodeData: `REG-${registration._id}`,
      name: `${registration.firstName} ${registration.lastName}`,
      category: registration.category
    }
  });
});

/**
 * Get available resources for registration
 */
exports.getAvailableResources = asyncHandler(async (req, res, next) => {
  const registration = await Registration.findById(req.registrant.id)
    .populate('category');
  
  if (!registration) {
    return next(new ApiError('Registration not found', 404));
  }
  
  // Get resources for the event
  const resources = await Resource.find({
    event: registration.event,
    isActive: true
  }).populate('allowedCategories', 'name');
  
  // Filter resources by category
  const availableResources = resources.filter(resource => {
    // If no category restrictions, resource is available to all
    if (!resource.allowedCategories || resource.allowedCategories.length === 0) {
      return true;
    }
    
    // Check if user's category is in allowed categories
    return resource.allowedCategories.some(
      cat => cat._id.toString() === registration.category._id.toString()
    );
  });
  
  // Get used resources
  const usedResources = await Resource.find({
    registration: req.registrant.id,
    isVoided: false
  }).populate('resource');
  
  // Add availability status to each resource
  const resourcesWithStatus = availableResources.map(resource => {
    const resourceObj = resource.toObject();
    const usedRecord = usedResources.find(
      record => record.resource._id.toString() === resource._id.toString()
    );
    
    resourceObj.isUsed = !!usedRecord;
    resourceObj.usageDate = usedRecord ? usedRecord.createdAt : null;
    
    return resourceObj;
  });
  
  res.status(200).json({
    status: 'success',
    results: resourcesWithStatus.length,
    data: {
      resources: resourcesWithStatus
    }
  });
});

/**
 * Get a specific abstract by ID for a specific event
 */
exports.getAbstractByIdForEvent = asyncHandler(async (req, res, next) => {
  const { eventId, abstractId } = req.params;
  const registrantId = req.registrant.id;

  if (!mongoose.Types.ObjectId.isValid(eventId) || !mongoose.Types.ObjectId.isValid(abstractId)) {
    return next(new ApiError('Invalid Event ID or Abstract ID format', 400));
  }

  try {
    const abstract = await Abstract.findOne({
      _id: abstractId,
      event: eventId,
      registration: registrantId
    })
      .populate('event', 'name startDate endDate abstractSettings')
      .populate('category', 'name')
      .lean();

    if (!abstract) {
      return next(new ApiError(404, 'Abstract not found or access denied'));
    }

    // Always include the category ObjectId as a string for frontend matching
    let categoryIdString = null;
    if (abstract.category && typeof abstract.category === 'object' && abstract.category._id) {
      categoryIdString = String(abstract.category._id);
    } else if (abstract.category && abstract.category.$oid) {
      categoryIdString = String(abstract.category.$oid);
    } else if (abstract.category && typeof abstract.category === 'string') {
      categoryIdString = abstract.category;
    } else if (abstract.category) {
      categoryIdString = String(abstract.category);
    }

    let categoryName = null;
    let subTopicName = null;

    // Robustly match category by _id or $oid
    if (
      abstract.event &&
      abstract.event.abstractSettings &&
      Array.isArray(abstract.event.abstractSettings.categories)
    ) {
      const eventCategories = abstract.event.abstractSettings.categories;
      let foundCategory = null;
      let foundById = false;
      // Try to match by ObjectId if present
      if (categoryIdString) {
        foundCategory = eventCategories.find(cat => String(cat._id && cat._id.$oid ? cat._id.$oid : cat._id) === categoryIdString);
        foundById = !!foundCategory;
      }
      // Fallback: match by topic string if no ObjectId match and topic is present
      if (!foundCategory && abstract.topic && typeof abstract.topic === 'string') {
        foundCategory = eventCategories.find(cat => (cat.name || '').toLowerCase().trim() === abstract.topic.toLowerCase().trim());
        if (foundCategory) {
          categoryIdString = String(foundCategory._id && foundCategory._id.$oid ? foundCategory._id.$oid : foundCategory._id);
        }
      }
      if (foundCategory) {
        categoryName = foundCategory.name;
        // Try to resolve subTopic name if present
        if (abstract.subTopic && foundCategory.subTopics && Array.isArray(foundCategory.subTopics)) {
          let foundSubTopic = null;
          // Try to match by ObjectId
          foundSubTopic = foundCategory.subTopics.find(st => String(st._id && st._id.$oid ? st._id.$oid : st._id) === String(abstract.subTopic && abstract.subTopic.$oid ? abstract.subTopic.$oid : abstract.subTopic));
          // Fallback: match by subTopic string if no ObjectId match and subTopic is present
          if (!foundSubTopic && typeof abstract.subTopic === 'string' && abstract.subTopic.length > 0) {
            foundSubTopic = foundCategory.subTopics.find(st => (st.name || '').toLowerCase().trim() === abstract.subTopic.toLowerCase().trim());
          }
          if (foundSubTopic) {
            subTopicName = foundSubTopic.name;
          }
        }
      }
    }

    // Fallback: Try to get category name from populated category
    if (!categoryName && abstract.category && abstract.category.name) {
      categoryName = abstract.category.name;
    }

    // Always include the categoryIdString for frontend matching
    const abstractToSend = {
      ...abstract,
      category: categoryIdString,
      categoryName: categoryName || 'Not specified',
      subTopicName: subTopicName || 'Not specified'
    };

    // Log the full object being sent to the frontend for debugging
    console.log('[getAbstractByIdForEvent] FINAL abstractToSend:', JSON.stringify(abstractToSend, null, 2));

    console.log(`[getAbstractByIdForEvent] Sending abstract with category: ${categoryIdString}, categoryName: ${categoryName}, subTopicName: ${subTopicName}`);

    res.status(200).json({
      success: true,
      data: abstractToSend
    });
  } catch (error) {
    console.error(`[getAbstractByIdForEvent] Error: ${error.message}`);
    return next(new ApiError(500, 'Error processing abstract details', error.stack));
  }
});

/**
 * Update an abstract for a specific event
 */
exports.updateAbstractForEvent = asyncHandler(async (req, res, next) => {
  const { eventId, abstractId } = req.params;
  const registrantId = req.registrant.id;
  const updateData = req.body;

  if (!mongoose.Types.ObjectId.isValid(eventId) || !mongoose.Types.ObjectId.isValid(abstractId)) {
    return next(new ApiError('Invalid Event ID or Abstract ID format', 400));
  }

  // Ensure users cannot update critical fields like registration or event association
  delete updateData.registration;
  delete updateData.event;
  delete updateData.status; // Status should likely be managed by admins/reviewers

  const abstract = await Abstract.findOneAndUpdate(
    { 
      _id: abstractId, 
      event: eventId, 
      registration: registrantId // Ensure registrant owns this abstract for this event
    },
    updateData,
    { new: true, runValidators: true }
  );

  if (!abstract) {
    return next(new ApiError('Abstract not found, access denied, or no changes made', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      abstract
    }
  });
});

// STUB FUNCTIONS FOR MISSING IMPLEMENTATIONS

exports.register = asyncHandler(async (req, res, next) => {
  return next(new ApiError('Registrant registration functionality is not yet implemented.', 501));
});

exports.verifyAccount = asyncHandler(async (req, res, next) => {
  return next(new ApiError('Account verification functionality is not yet implemented.', 501));
});

exports.getPayments = asyncHandler(async (req, res, next) => {
  // TODO: Implement logic to fetch payments for req.registrant.id
  // Consider event scoping if payments are event-specific
  return next(new ApiError('Get payments functionality is not yet implemented.', 501));
});

exports.getAnnouncements = asyncHandler(async (req, res, next) => {
  // TODO: Implement logic to fetch announcements.
  // Announcements are likely scoped by event. Need to determine eventId:
  // 1. If route is /events/:eventId/announcements, use req.params.eventId
  // 2. Otherwise, use event from req.registrant.event (after fetching registration)
  return next(new ApiError('Get announcements functionality is not yet implemented.', 501));
});

exports.downloadResource = asyncHandler(async (req, res, next) => {
  const { id: resourceId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(resourceId)) {
    return next(new ApiError('Invalid Resource ID format', 400));
  }
  // TODO: Implement logic to fetch and stream/download the resource file for resourceId.
  // Consider permissions and event scoping.
  return next(new ApiError('Download resource functionality is not yet implemented.', 501));
});

exports.getCertificates = asyncHandler(async (req, res, next) => {
  // TODO: Implement logic to fetch available certificates for req.registrant.id.
  // Certificates are likely scoped by event.
  return next(new ApiError('Get certificates functionality is not yet implemented.', 501));
});

exports.downloadCertificate = asyncHandler(async (req, res, next) => {
  const { id: certificateId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(certificateId)) {
    return next(new ApiError('Invalid Certificate ID format', 400));
  }
  // TODO: Implement logic to fetch and stream/download the certificate file for certificateId.
  // Consider permissions and event scoping for req.registrant.id.
  return next(new ApiError('Download certificate functionality is not yet implemented.', 501));
});

// Placeholder for Dashboard Data
exports.getDashboardData = asyncHandler(async (req, res, next) => {
  logger.info('[DashboardController] getDashboardData called.');
  // logger.debug('[DashboardController] req.registrant from auth middleware:', JSON.stringify(req.registrant, null, 2));
  
  const registrantId = req.registrant ? req.registrant.id : null;
  const eventIdFromAuth = req.registrant ? (req.registrant._doc ? req.registrant._doc.event : req.registrant.event) : null;
  const eventIdFromQuery = req.query.event; // Event ID passed in query by frontend

  // Prioritize eventId from query if available, otherwise use from auth context
  const eventId = eventIdFromQuery || eventIdFromAuth;

  logger.info(`[DashboardController] Extracted registrantId: ${registrantId}`);
  // logger.debug(`[DashboardController] Extracted eventId (from query or auth): ${JSON.stringify(eventId, null, 2)}`);

  if (!registrantId) {
    logger.error('[DashboardController] Critical: Missing registrantId from req.registrant context.');
    return next(new ApiError('Registrant ID context is missing for dashboard.', 400));
  }
  if (!eventId) {
    logger.error('[DashboardController] Critical: Missing eventId (either from query or auth context).');
    return next(new ApiError('Event ID context is missing for dashboard.', 400));
  }

  const queryEventId = (typeof eventId === 'object' && eventId !== null && eventId._id) 
    ? eventId._id.toString() 
    : eventId.toString();

  if (!mongoose.Types.ObjectId.isValid(queryEventId)) {
    logger.error(`[DashboardController] Invalid Event ID format after processing: ${queryEventId}`);
    return next(new ApiError('Invalid Event ID format for dashboard.', 400));
  }

  logger.info(`[DashboardController] Using queryEventId: ${queryEventId} for database lookups.`);

  // Fetch basic registration details
  const registration = await Registration.findById(registrantId)
    .populate('event', 'name slug startDate endDate location venue timezone basicInfo registrationSettings') // Added more fields to event
    .populate('category', 'name permissions') // Added permissions to category
    .lean();

  if (!registration) {
    logger.error(`[DashboardController] Registration not found for ID: ${registrantId}`);
    return next(new ApiError('Registration not found', 404));
  }

  // Ensure the registration's event matches the queryEventId to prevent data leakage if eventId in token is stale
  if (registration.event && registration.event._id.toString() !== queryEventId) {
    logger.warn(`[DashboardController] Mismatch: Registrant ${registrantId} event (${registration.event._id}) vs query/token event (${queryEventId}). Denying access.`);
    return next(new ApiError('Access denied: Registration event does not match requested event.', 403));
  }

  // Fetch abstract submissions
  const abstracts = await Abstract.find({ registrant: registrantId, event: queryEventId }).lean();

  // Fetch payment information
  const payments = await Payment.find({ registration: registrantId, event: queryEventId }).sort({ createdAt: -1 }).lean();

  // Fetch resource usage
  const resourceUsage = await Resource.find({ registration: registrantId, event: queryEventId }).lean();

  // Fetch active announcements for the event, sorted by creation date (newest first)
  const announcements = await Announcement.find({ eventId: queryEventId, isActive: true })
    .sort({ createdAt: -1 })
    .limit(10) // Limit to 10 most recent active announcements for the dashboard
    .populate('postedBy', 'name') // Optionally populate who posted it
    .lean();

  logger.info(`[DashboardController] Successfully fetched dashboard data for registrant ${registrantId}, event ${queryEventId}. Announcements found: ${announcements.length}`);
  res.status(200).json({
    success: true, // Changed from status: 'success' for consistency
    data: {
      registration, 
      abstracts,
      payments,
      resourceUsage,
      announcements, // Added announcements to the response
      // upcomingDeadlines: [], // Placeholder for upcoming deadlines from event settings or specific deadlines model
      // eventDetails: registration.event // Already part of registration.event but can be explicit if frontend expects it here
    },
  });
});

/**
 * @desc    Download a registrant's badge
 * @route   GET /api/registrant-portal/events/:eventId/registrants/:registrantId/badge
 * @access  Private (Registrant)
 */
const downloadBadge = asyncHandler(async (req, res, next) => {
  const { eventId, registrantId } = req.params;
  const { preview } = req.query; // Get preview query parameter
  const loggedInRegistrantId = req.registrant.id;

  // 1. Validate inputs
  if (!mongoose.Types.ObjectId.isValid(eventId) || !mongoose.Types.ObjectId.isValid(registrantId)) {
    return next(new ApiError(400, 'Invalid Event ID or Registrant ID'));
  }

  // 2. Fetch Registration with Event and Category details
  const registration = await Registration.findById(registrantId)
    .populate('event') // Populate the event details
    .populate({
      path: 'category',
      model: 'Category' // Explicitly specify Category model if not automatically inferred
    });

  if (!registration) {
    return next(new ApiError(404, 'Registration not found'));
  }

  // 3. Verify the logged-in registrant matches the requested registrant ID
  if (registrantId !== loggedInRegistrantId) {
    return next(new ApiError(403, 'Forbidden: You can only download your own badge.'));
  }

  // 4. Ensure the registration belongs to the specified event
  if (registration.event._id.toString() !== eventId) {
    return next(new ApiError(400, 'Registration does not belong to the specified event.'));
  }

  const event = registration.event;
  const category = registration.category;

  logger.info(`Generating badge for: ${registration.personalInfo.firstName} ${registration.personalInfo.lastName}, Event: ${event.name}, Category: ${category ? category.name : 'N/A'}`);

  // --- Always use event's default badge template for badge generation ---
  let badgeTemplateDoc = null;
  let badgeLayoutConfig = {
    orientation: 'portrait',
    size: { width: 3.5, height: 5 },
    unit: 'in',
    background: '#FFFFFF',
    elements: []
  };

  // Fetch the event's default badge template
  badgeTemplateDoc = await BadgeTemplate.findOne({ event: event._id, isDefault: true });
  if (badgeTemplateDoc) {
    logger.info(`Using event default BadgeTemplate ID: ${badgeTemplateDoc._id}`);
    badgeLayoutConfig = {
      orientation: badgeTemplateDoc.orientation,
      size: badgeTemplateDoc.size,
      unit: badgeTemplateDoc.unit,
      background: badgeTemplateDoc.background,
      backgroundImage: badgeTemplateDoc.backgroundImage,
      logoUrl: badgeTemplateDoc.logo,
      elements: badgeTemplateDoc.elements.map(el => ({ ...el.toObject() }))
    };
  } else {
    logger.warn('No default BadgeTemplate found for event. Falling back to event.badgeSettings.');
    // ... fallback to event.badgeSettings logic ...
  }

  // Log element count after generation
  logger.info(`Fallback logic generated ${badgeLayoutConfig.elements.length} elements.`);

  // Log the final layout config being used (Keep attempting, but maybe simplified)
  // logger.info('Using Badge Layout Config:', JSON.stringify(badgeLayoutConfig, null, 2)); // Potentially problematic log

  const qrCodeDataString = registration.registrationId || registration._id.toString();
  let qrCodeImage = null;
  try {
    // Force black modules and white background within the QR code image
    qrCodeImage = await qrcode.toDataURL(qrCodeDataString, { 
        errorCorrectionLevel: 'H', 
        margin: 1, 
        color: { 
            dark: '#000000', // Black modules
            light: '#FFFFFF'  // White background
        }
    });
    logger.info(`Generated QR Code Image Data URL (start): ${qrCodeImage.substring(0, 100)}...`); // Log start of Data URL
  } catch (err) {
    logger.error('QR Code generation failed:', err);
    return next(new ApiError(500, 'Failed to generate QR code for badge.'));
  }

  try {
    // Calculate page size in pixels for PDFKit (to match frontend)
    const pageWidth = convertToPixels(badgeLayoutConfig.size.width, badgeLayoutConfig.unit);
    const pageHeight = convertToPixels(badgeLayoutConfig.size.height, badgeLayoutConfig.unit);

    // Log the calculated dimensions
    logger.info(`PDF Page Dimensions (pixels): ${pageWidth}x${pageHeight}`);

    const doc = new pdfkit({
      size: [pageWidth, pageHeight],
      layout: badgeLayoutConfig.orientation,
      margin: 0
    });

    let buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      const pdfData = Buffer.concat(buffers);
      res.writeHead(200, {
        'Content-Type': 'application/pdf',
        'Content-Disposition': preview === 'true' 
            ? `inline; filename="badge-${registration.registrationId || registration._id}.pdf"` 
            : `attachment; filename="badge-${registration.registrationId || registration._id}.pdf"`,
        'Content-Length': pdfData.length
      });
      res.end(pdfData);
    });

    // 1. Draw Background Color or Image
    if (badgeLayoutConfig.backgroundImage) {
      try {
        doc.image(badgeLayoutConfig.backgroundImage, 0, 0, { width: pageWidth, height: pageHeight });
      } catch (bgImgErr) {
        logger.error(`Failed to load background image ${badgeLayoutConfig.backgroundImage}: ${bgImgErr.message}`);
        doc.rect(0, 0, pageWidth, pageHeight).fill(badgeLayoutConfig.background || '#FFFFFF');
      }
    } else {
      doc.rect(0, 0, pageWidth, pageHeight).fill(badgeLayoutConfig.background || '#FFFFFF');
    }
    // Draw blue border (simulate rounded corners by leaving white margin if desired)
    if (badgeLayoutConfig.border) {
      doc.save();
      doc.lineWidth(badgeLayoutConfig.border.width || 2);
      doc.strokeColor(badgeLayoutConfig.border.color || blueColor);
      doc.rect(0, 0, pageWidth, pageHeight).stroke();
      doc.restore();
    }

    // 2. Draw Elements (all absolutely positioned within the single badge page)
    logger.info(`Attempting to draw ${badgeLayoutConfig.elements.length} elements...`); // Log element count
    for (const element of badgeLayoutConfig.elements) {
      doc.save(); // Save drawing state for this element

      // --- Absolute Position Calculation (pixels) ---
      const xPos = element.position?.x || 0;
      const yPos = element.position?.y || 0;
      const elWidth = element.size?.width || 0;
      const elHeight = element.size?.height || 0;
      
      // --- Fetch dynamic content ---
      let dynamicContent = element.content;
      switch (element.fieldType) {
        case 'name': dynamicContent = `${registration.personalInfo.firstName || ''} ${registration.personalInfo.lastName || ''}`.trim(); break;
        case 'organization': dynamicContent = registration.personalInfo.organization || ''; break;
        case 'registrationId': dynamicContent = registration.registrationId || ''; break;
        case 'category': dynamicContent = category ? category.name : ''; break;
        case 'country': dynamicContent = registration.personalInfo.country || ''; break;
        case 'eventName': dynamicContent = event.name || ''; break; 
      }

      // --- Element Drawing --- 
      if (element.type === 'text') {
        doc.fillColor(element.style?.color || 'black');
        let fontName = 'Helvetica';
        if (element.style?.font && typeof element.style.font === 'string') {
            fontName = element.style.font;
        } 
        if (element.style?.fontWeight === 'bold' && !fontName.toLowerCase().includes('bold')) {
            fontName = 'Helvetica-Bold';
        }
        try { doc.font(fontName); } catch(e){ logger.warn(`Failed to set font: ${fontName}`); doc.font('Helvetica');}
        const fontSize = element.style?.fontSize || 10;
        doc.fontSize(fontSize);
        // Vertically center text if height is specified
        let textY = yPos;
        if (elHeight > 0) {
          textY = yPos + (elHeight - fontSize) / 2;
        }
        const textOptions = {
            width: elWidth > 0 ? elWidth : undefined,
            height: elHeight > 0 ? elHeight : undefined,
            align: element.style?.textAlign || element.style?.align || 'center',
            baseline: element.position?.baseline
        };
        doc.text(dynamicContent || '', xPos, textY, textOptions);
      } else if (element.type === 'qrCode' && element.fieldType === 'qrCode') {
        const qrWidth = elWidth > 0 ? elWidth : 100;
        const qrHeight = elHeight > 0 ? elHeight : qrWidth;
        // Center QR code in its box if width/height are specified
        let qrX = xPos, qrY = yPos;
        if (elWidth > 0 && qrWidth < elWidth) qrX = xPos + (elWidth - qrWidth) / 2;
        if (elHeight > 0 && qrHeight < elHeight) qrY = yPos + (elHeight - qrHeight) / 2;
        if (qrCodeImage) {
            doc.image(qrCodeImage, qrX, qrY, { width: qrWidth, height: qrHeight }); 
        } else {
            doc.text('[QR Err]', qrX, qrY);
        }
      } else if (element.type === 'image' && element.content) {
        const imgWidth = elWidth > 0 ? elWidth : 100; 
        const imgHeight = elHeight > 0 ? elHeight : imgWidth;
        // Center image in its box if width/height are specified
        let imgX = xPos, imgY = yPos;
        if (elWidth > 0 && imgWidth < elWidth) imgX = xPos + (elWidth - imgWidth) / 2;
        if (elHeight > 0 && imgHeight < elHeight) imgY = yPos + (elHeight - imgHeight) / 2;
        const imageOptions = { width: imgWidth, height: imgHeight };
        if (element.style?.fit) imageOptions.fit = element.style.fit === 'contain' ? [imgWidth, imgHeight] : undefined;
        if (element.style?.fit === 'cover') imageOptions.cover = [imgWidth, imgHeight];
        if (element.style?.align) imageOptions.align = element.style.align;
        if (element.style?.valign) imageOptions.valign = element.style.valign;
        try {
          doc.image(element.content, imgX, imgY, imageOptions);
        } catch (imgErr) {
            logger.error(`Failed to load image ${element.content} for element ${element.id}: ${imgErr.message}`);
            doc.text(`[Img Err: ${element.id}]`, imgX, imgY);
        }
      } else if (element.type === 'line') {
          doc.moveTo(element.position.x1, element.position.y1)
             .lineTo(element.position.x2, element.position.y2)
             .lineWidth(element.style?.lineWidth || 1)
             .strokeColor(element.style?.strokeColor || 'black')
             .stroke();
      }
      // TODO: Add other shape drawing (rect, circle)
      doc.restore(); // Restore drawing state
    }
    doc.end();

  } catch (error) {
    logger.error('Error generating PDF badge:', error);
    return next(new ApiError(500, 'Failed to generate badge PDF.'));
  }
});

// Helper function to convert units to pixels (DPIN = 100)
const convertToPixels = (value, unit) => {
  const DPIN = 100;
  if (!value) return 0;
  if (unit === 'in') return value * DPIN;
  if (unit === 'cm') return value * (DPIN / 2.54);
  if (unit === 'mm') return value * (DPIN / 25.4);
  return value;
};

module.exports = {
  login: exports.login,
  getCurrentRegistrant: exports.getCurrentRegistrant,
  updateProfile: exports.updateProfile,
  getEventDetails: exports.getEventDetails,
  getAvailableWorkshops: exports.getAvailableWorkshops,
  registerForWorkshop: exports.registerForWorkshop,
  cancelWorkshopRegistration: exports.cancelWorkshopRegistration,
  getRegisteredWorkshops: exports.getRegisteredWorkshops,
  getResourceHistory: exports.getResourceHistory,
  getAbstractsForEvent: exports.getAbstractsForEvent,
  submitAbstractForEvent: exports.submitAbstractForEvent,
  getAbstractByIdForEvent: exports.getAbstractByIdForEvent,
  updateAbstractForEvent: exports.updateAbstractForEvent,
  getQRCode: exports.getQRCode,
  getAvailableResources: exports.getAvailableResources,

  // Re-exported functions
  getProfile: registrantController.getProfile,
  forgotPassword: registrantController.forgotPassword,
  resetPassword: registrantController.resetPassword,
  getInvoice: paymentController.getInvoice,
  getResources: resourceController.getResources, // This is the list version

  // Newly added STUB functions
  register: exports.register,
  verifyAccount: exports.verifyAccount,
  getPayments: exports.getPayments,
  getAnnouncements: exports.getAnnouncements,
  downloadResource: exports.downloadResource,
  getCertificates: exports.getCertificates,
  downloadCertificate: exports.downloadCertificate,
  getDashboardData: exports.getDashboardData,
  downloadBadge: downloadBadge
}; 