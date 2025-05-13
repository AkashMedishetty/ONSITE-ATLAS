const mongoose = require('mongoose');
const Resource = require('../models/Resource');
const ResourceSetting = require('../models/ResourceSetting');
const Event = require('../models/Event');
const { createApiError } = require('../middleware/error');
const asyncHandler = require('../middleware/async');
const Registration = require('../models/Registration');
const Category = require('../models/Category');
const { sendSuccess, sendPaginated } = require('../utils/responseFormatter');
const logger = require('../utils/logger');
const ExcelJS = require('exceljs');

/**
 * @desc    Get resource settings
 * @route   GET /api/resources/settings
 * @access  Private
 */
const getResourceSettings = asyncHandler(async (req, res) => {
  console.log('[getResourceSettings] Received query:', req.query);
  const { eventId, type } = req.query;

  // 1. Validate Input
  if (!eventId || !type) {
    console.log('[getResourceSettings] Missing eventId or type. Returning default.');
    return res.status(200).json({
      success: true,
      message: 'Default resource settings (missing parameters)',
      data: { settings: defaultResourceSettings(type || 'food') } // Wrap in {settings: ...}
    });
  }

  if (!mongoose.Types.ObjectId.isValid(eventId)) {
    console.log(`[getResourceSettings] Invalid event ID format: ${eventId}. Returning default.`);
    return res.status(200).json({
      success: true,
      message: 'Default resource settings (invalid event ID)',
      data: { settings: defaultResourceSettings(type) } // Wrap in {settings: ...}
    });
  }

  // Normalize type received from frontend request query
  let requestType = type.toLowerCase();
  let dbQueryType = requestType; // Default to using the request type
  
  // Convert variants to the correct database type with proper casing
  if (requestType === 'kits' || requestType === 'kit' || requestType === 'kitbag') {
    dbQueryType = 'kitBag';  // Ensure correct casing
    console.log(`[getResourceSettings] Normalized request type '${requestType}' to db type 'kitBag'`);
  } else if (requestType === 'certificates' || requestType === 'certificate') {
    dbQueryType = 'certificate';
    console.log(`[getResourceSettings] Normalized request type '${requestType}' to db type 'certificate'`);
  } else if (requestType === 'certificateprinting') {
    dbQueryType = 'certificatePrinting';  // Ensure correct casing
    console.log(`[getResourceSettings] Normalized request type '${requestType}' to db type 'certificatePrinting'`);
  }

  // Check for valid type using case-insensitive comparison
  const validTypes = ['food', 'kitbag', 'certificate', 'certificateprinting'].map(t => t.toLowerCase());
  if (!validTypes.includes(dbQueryType.toLowerCase())) {
    console.log(`[getResourceSettings] Invalid resource type after normalization: ${dbQueryType}. Returning default.`);
    return res.status(200).json({
      success: true,
      message: `Default resource settings (invalid type: ${type})`,
      data: { settings: defaultResourceSettings(dbQueryType) } // Use normalized type for default lookup
    });
  }

  try {
    // 2. Find the Specific ResourceSetting Document using the DB type
    console.log(`[getResourceSettings] Querying ResourceSetting for event: ${eventId}, type: ${dbQueryType}`);
    const resourceSettingDoc = await ResourceSetting.findOne({
      event: eventId,
      type: dbQueryType // Now using properly cased dbQueryType
    });

    let settingsData;
    let message;

    if (resourceSettingDoc) {
      console.log(`[getResourceSettings] Found existing ResourceSetting document.`);
      // Use the settings from the found document
      settingsData = resourceSettingDoc.settings || defaultResourceSettings(dbQueryType); // Use normalized type for default fallback
      message = `${type} settings retrieved successfully`; // Use original request type in success message
    } else {
      console.log(`[getResourceSettings] No ResourceSetting document found. Returning default.`);
      // No specific setting found, return the default for the type
      settingsData = defaultResourceSettings(dbQueryType); // Use normalized type for default
      message = `Default ${type} settings returned (no specific config found)`; // Use original request type in message
    }

    // 3. Return Response in Expected Format
    console.log(`[getResourceSettings] Responding with settings for ${type}:`, settingsData);
    return res.status(200).json({
      success: true,
      message: message,
      data: { 
        settings: settingsData 
      } 
    });

  } catch (error) {
    console.error(`[getResourceSettings] Error retrieving settings for event ${eventId}, type ${dbQueryType}: ${error.message}`);
    console.error(error.stack);
    // Fallback to default on error
    return res.status(500).json({
      success: false, // Indicate error on server failure
      message: `Error getting ${type} settings, returned defaults`, // Use original request type
      data: { settings: defaultResourceSettings(dbQueryType) } // Use normalized type for default
    });
  }
});

/**
 * @desc    Update resource settings
 * @route   PUT /api/resources/settings
 * @access  Private
 */
exports.updateResourceSettings = asyncHandler(async (req, res, next) => {
  const { eventId, type } = req.query;
  const { settings, isEnabled } = req.body;

  if (!eventId) {
    return res.status(400).json({
      success: false,
      message: 'Event ID is required'
    });
  }

  if (!type) {
    return res.status(400).json({
      success: false,
      message: 'Resource type is required'
    });
  }

  // Normalize the resource type from the request for DB operations
  let requestType = type.toLowerCase();
  let dbType = requestType;
  
  // Convert variants to the correct database type with proper casing
  if (requestType === 'kits' || requestType === 'kit' || requestType === 'kitbag') {
    dbType = 'kitBag';  // Ensure correct casing
    console.log(`[updateResourceSettings] Normalized request type '${requestType}' to db type 'kitBag'`);
  } else if (requestType === 'certificates' || requestType === 'certificate') {
    dbType = 'certificate';
    console.log(`[updateResourceSettings] Normalized request type '${requestType}' to db type 'certificate'`);
  } else if (requestType === 'certificateprinting') {
    dbType = 'certificatePrinting';  // Ensure correct casing
    console.log(`[updateResourceSettings] Normalized request type '${requestType}' to db type 'certificatePrinting'`);
  }

  // Check for valid type using case-insensitive comparison
  const validTypes = ['food', 'kitbag', 'certificate', 'certificateprinting'].map(t => t.toLowerCase());
  if (!validTypes.includes(dbType.toLowerCase())) {
    return res.status(400).json({
      success: false,
      message: `Invalid resource type: ${type}. Must be one of the supported resource types.`
    });
  }

  try {
    // Find settings using the DB type
    let resourceSettings = await ResourceSetting.findOne({
      event: eventId,
      type: dbType // Use normalized DB type
    });

    // If settings don't exist, create new settings using DB type
    if (!resourceSettings) {
      resourceSettings = new ResourceSetting({
        event: eventId,
        type: dbType, // Use normalized DB type
        settings: settings || {},
        isEnabled: isEnabled !== undefined ? isEnabled : true, // Default to true when creating
        createdBy: req.user._id,
        updatedBy: req.user._id
      });
      console.log(`[updateResourceSettings] Creating new ResourceSetting for type: ${dbType}`);
    } else {
      // Update existing settings
      console.log(`[updateResourceSettings] Updating existing ResourceSetting for type: ${dbType}`);
      if (settings !== undefined) {
        resourceSettings.settings = settings;
      }
      if (isEnabled !== undefined) {
        resourceSettings.isEnabled = isEnabled;
      }
      resourceSettings.updatedBy = req.user._id;
    }

    // Save the settings
    await resourceSettings.save();

    // Return the updated settings
    return res.status(200).json({
      success: true,
      message: `${type} settings updated successfully`, // Use original request type in message
      data: resourceSettings // Return the whole doc as before
    });
  } catch (error) {
    console.error(`Error in updateResourceSettings for type ${dbType}: ${error.message}`);
    console.error(`Request data: eventId=${eventId}, type=${type}, normalized type=${dbType}`);
    return res.status(500).json({
      success: false,
      message: `Error updating ${type} settings: ${error.message}`,
      error: error.message
    });
  }
});

/**
 * @desc    Get resources (usage logs)
 * @route   GET /api/resources              (Requires eventId query param)
 * @route   GET /api/events/:id/resources   (Uses eventId from route param)
 * @access  Private
 */
exports.getResources = asyncHandler(async (req, res, next) => {
  const { type, page = 1, limit = 10 } = req.query;
  // Get eventId from route params first, fallback to query param
  const eventId = req.params.id || req.query.eventId; 

  // --- Require eventId --- 
  if (!eventId) {
    // If not admin, require eventId
    if (req.user.role !== 'admin') { 
        console.warn(`[getResources] Non-admin user ${req.user.id} attempted access without eventId.`);
        return next(createApiError(400, 'Event ID is required to view resources.'));
    }
    // Allow admin access without eventId (fetches all resources), but log it.
    console.warn(`[getResources] Admin ${req.user.id} accessing resources without eventId filter.`);
  }

  // Validate eventId if provided
  if (eventId && !mongoose.Types.ObjectId.isValid(eventId)) {
      return next(createApiError(400, 'Invalid Event ID format.'));
  }
  // --- End Require eventId ---

  const query = {};

  // Apply event filter if eventId is present
  if (eventId) {
    query.event = eventId;
    console.log(`[getResources] Filtering resources by event: ${eventId}`);
  }

  if (type) {
    query.type = type;
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  try {
      const resources = await Resource.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('registration', 'registrationId personalInfo') // Updated fields
        .populate('event', 'name') // Populate event name for context
        .populate('issuedBy', 'name email')
        .populate('voidedBy', 'name email');
    
      const total = await Resource.countDocuments(query);
      
      console.log(`[getResources] Found ${resources.length} resources, total matching query: ${total}`);
      
      // Use sendPaginated helper
      return sendPaginated(res, {
          message: 'Resources retrieved successfully',
          data: resources,
          page: parseInt(page),
          limit: parseInt(limit),
          total: total
      });
      
  } catch (error) {
      console.error(`[getResources] Error fetching resources: ${error.message}`);
      next(error); // Pass error to central handler
  }
});

/**
 * @desc    Create resource
 * @route   POST /api/resources
 * @access  Private
 */
exports.createResource = asyncHandler(async (req, res, next) => {
  // Determine eventId (from route param or body)
  const eventId = req.params.id || req.body.eventId;
  // Get registrationId (should be in body for both route types)
  const { registrationId, type, details } = req.body;

  // --- Validation --- 
  if (!eventId || !mongoose.Types.ObjectId.isValid(eventId)) {
      return next(createApiError(400, 'Valid Event ID is required (from route or body).'));
  }
  if (!registrationId || !mongoose.Types.ObjectId.isValid(registrationId)) {
      return next(createApiError(400, 'Valid Registration ID is required in the request body.'));
  }
  if (!type) {
      return next(createApiError(400, 'Resource type is required.'));
  }
  // --- End Validation ---

  // --- Authorization & Consistency Check ---
  // 1. Verify the registration exists and belongs to the correct event
  const registration = await Registration.findById(registrationId);
  if (!registration) {
      return next(createApiError(404, `Registration not found with ID: ${registrationId}`));
  }
  if (registration.event.toString() !== eventId) {
      console.warn(`[createResource AUTH] Attempt to log resource for registration ${registrationId} (event ${registration.event}) under event ${eventId}.`);
      return next(createApiError(400, 'Registration does not belong to the specified event.'));
  }
  // Optional: Add check if event exists if needed (findByIdAndUpdate below implies it)
  // const event = await Event.findById(eventId);
  // if (!event) { ... }
  // --- End Check --- 

  // Add user and event to the data to be created
  const resourceData = {
    ...req.body, // Include type, details, etc. from body
    event: eventId, // Set the event ID
    registration: registrationId, // Ensure registration ID is set
    issuedBy: req.user.id, // Set the user issuing the resource
    actionDate: new Date(), // Set the action time
    isVoided: false, // Default value
    createdBy: req.user._id, // Set the createdBy field
    updatedBy: req.user._id // Set the updatedBy field
  };
  
  // Remove eventId and registrationId from the base object if they existed in req.body 
  // to avoid passing them twice to Resource.create
  delete resourceData.eventId; 

  try {
      const resource = await Resource.create(resourceData);
      logger.info(`Resource ${type} logged for registration ${registrationId} in event ${eventId} by ${req.user.email}`);
      return sendSuccess(res, 201, 'Resource usage logged successfully', resource);
  } catch (error) {
      logger.error(`Error creating resource log: ${error.message}`, { error, data: resourceData });
      next(error); // Pass to central error handler
  }
});

/**
 * @desc    Get resource by ID
 * @route   GET /api/resources/:id
 * @access  Private
 */
exports.getResourceById = asyncHandler(async (req, res, next) => {
  const resource = await Resource.findById(req.params.id)
    .populate('registration', 'registrationId firstName lastName email')
    .populate('issuedBy', 'name email')
    .populate('voidedBy', 'name email');

  if (!resource) {
    return next(createApiError(404, `Resource not found with id of ${req.params.id}`));
  }

  res.status(200).json({
    success: true,
    data: resource
  });
});

/**
 * @desc    Update resource
 * @route   PUT /api/resources/:id
 * @access  Private
 */
exports.updateResource = asyncHandler(async (req, res, next) => {
  let resource = await Resource.findById(req.params.id);

  if (!resource) {
    return next(createApiError(404, `Resource not found with id of ${req.params.id}`));
  }

  resource = await Resource.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: resource
  });
});

/**
 * @desc    Delete resource
 * @route   DELETE /api/resources/:id
 * @access  Private
 */
exports.deleteResource = asyncHandler(async (req, res, next) => {
  const resource = await Resource.findById(req.params.id);

  if (!resource) {
    return next(createApiError(404, `Resource not found with id of ${req.params.id}`));
  }

  await resource.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});

/**
 * @desc    Void resource
 * @route   PATCH /api/resources/:id/void
 * @access  Private
 */
exports.voidResource = asyncHandler(async (req, res, next) => {
  const { reason } = req.body;
  const resource = await Resource.findById(req.params.id).populate('registration');

  if (!resource) {
    return next(createApiError(404, `Resource not found with id of ${req.params.id}`));
  }

  if (resource.isVoided) {
    return next(createApiError(400, `Resource already voided`));
  }

  // Mark resource as voided
  resource.isVoided = true;
  resource.voidedBy = req.user.id;
  resource.voidedAt = Date.now();
  
  if (reason) {
    resource.voidReason = reason;
  }

  await resource.save();

  // Also update the registration's resource usage summary
  if (resource.registration) {
    try {
      const registration = await Registration.findById(resource.registration._id);
      
      if (registration) {
        // Determine which array to update based on resource type
        let resourceArray;
        if (resource.type === 'food') {
          resourceArray = 'resourceUsage.meals';
        } else if (resource.type === 'kits') {
          resourceArray = 'resourceUsage.kitItems'; 
        } else if (resource.type === 'certificates') {
          resourceArray = 'resourceUsage.certificates';
        }
        
        if (resourceArray) {
          // Use MongoDB's $pull operator to remove the entry with matching resourceId
          const updateQuery = {};
          updateQuery[`$pull`] = {};
          updateQuery[`$pull`][resourceArray] = { resourceId: resource._id };
          
          await Registration.findByIdAndUpdate(
            registration._id,
            updateQuery
          );
          
          // Add activity log entry about voiding
          registration.activities = registration.activities || [];
          registration.activities.push({
            action: `${resource.type.charAt(0).toUpperCase() + resource.type.slice(1)} Voided`,
            description: `${resource.type.charAt(0).toUpperCase() + resource.type.slice(1)} "${resource.details?.option}" was voided. Reason: ${reason || 'Not specified'}`,
            user: req.user.name,
            timestamp: new Date()
          });
          
          await registration.save();
        }
      }
    } catch (error) {
      console.error(`Error updating registration after resource void: ${error.message}`);
      // Continue regardless of error updating registration
    }
  }

  res.status(200).json({
    success: true,
    data: resource
  });
});

/**
 * @desc    Get resource statistics for a specific type for an event
 * @route   GET /api/resources/statistics/:eventId/:resourceType
 * @access  Private
 */
exports.getResourceTypeStatistics = asyncHandler(async (req, res, next) => {
  const { eventId, resourceType: requestType } = req.params; // Use requestType locally to avoid confusion

  console.log(`[getResourceTypeStatistics] Received request for event: ${eventId}, type: ${requestType}`);

  if (!eventId || !mongoose.Types.ObjectId.isValid(eventId)) {
    console.log(`[getResourceTypeStatistics] Invalid or missing eventId: ${eventId}`);
    return next(createApiError(400, 'Valid Event ID is required'));
  }

  if (!requestType) {
    console.log(`[getResourceTypeStatistics] Missing resourceType`);
    return next(createApiError(400, 'Resource type is required'));
  }

  // --- Normalize Resource Type ---
  let dbType = requestType.toLowerCase();
  
  // Convert variants to the correct database type
  if (dbType === 'kits' || dbType === 'kit') {
    dbType = 'kitBag';
    console.log(`[getResourceTypeStatistics] Normalized request type '${requestType}' to db type 'kitBag'`);
  } else if (dbType === 'certificates') {
    dbType = 'certificate';
    console.log(`[getResourceTypeStatistics] Normalized request type '${requestType}' to db type 'certificate'`);
  } else if (dbType === 'certificateprinting') {
    dbType = 'certificatePrinting';
    console.log(`[getResourceTypeStatistics] Normalized request type '${requestType}' to db type 'certificatePrinting'`);
  }
  
  // Check using case-insensitive comparison with standard DB types
  const validDbTypes = ['food', 'kitbag', 'certificate', 'certificateprinting'].map(t => t.toLowerCase());
  
  if (!validDbTypes.includes(dbType.toLowerCase())) {
    console.log(`[getResourceTypeStatistics] Invalid resource type after normalization: ${dbType}`);
    return next(createApiError(400, `Invalid resource type: ${requestType}. Must be one of: food, kit/kits, certificate/certificates, or certificatePrinting`));
  }
  console.log(`[getResourceTypeStatistics] Using DB type: ${dbType}`);


  try {
    // --- 1. Get Total Configured Items from ResourceSetting ---
    console.log(`[getResourceTypeStatistics] Fetching ResourceSetting for event ${eventId}, type ${dbType}`);
    const resourceSetting = await ResourceSetting.findOne({ event: eventId, type: dbType }).lean(); // Use lean for performance
    
    let totalConfigured = 0;
    if (resourceSetting && resourceSetting.settings) {
      switch (dbType) {
        case 'food':
          totalConfigured = resourceSetting.settings.meals?.length || 0;
          break;
        case 'kitBag':
          totalConfigured = resourceSetting.settings.items?.length || 0;
          break;
        case 'certificate':
          totalConfigured = resourceSetting.settings.types?.length || 0;
          break;
        case 'certificatePrinting':
           // Assuming 'templates' is the key, adjust if needed
          totalConfigured = resourceSetting.settings.templates?.length || 0; 
          break;
      }
       console.log(`[getResourceTypeStatistics] Found ${totalConfigured} configured ${dbType} items.`);
    } else {
       console.log(`[getResourceTypeStatistics] No ResourceSetting found or settings empty for ${dbType}. totalConfigured set to 0.`);
    }

    // --- 2. Aggregate Resource Usage Data (Non-Voided) ---
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const aggregationPipeline = [
      {
        $match: {
          event: new mongoose.Types.ObjectId(eventId),
          type: dbType,
          $or: [ { isVoided: false }, { isVoided: { $exists: false } } ] // Explicitly check for false or non-existent
        }
      },
      {
        $group: {
          _id: null,
          totalIssued: { $sum: 1 },
          issuedToday: {
            $sum: {
              $cond: [
                { $and: [ { $gte: ['$actionDate', todayStart] }, { $lte: ['$actionDate', todayEnd] } ] },
                1, 0
              ]
            }
          },
          uniqueAttendeesSet: { $addToSet: '$registration' }
        }
      },
      {
        $project: {
          _id: 0,
          totalIssued: 1,
          issuedToday: 1,
          uniqueAttendees: { $size: '$uniqueAttendeesSet' }
        }
      }
    ];

    console.log(`[getResourceTypeStatistics] Running aggregation for non-voided ${dbType}`);
    const usageResults = await Resource.aggregate(aggregationPipeline);
    
    let usageStats = {
      totalIssued: 0,
      issuedToday: 0,
      uniqueAttendees: 0
    };

    if (usageResults.length > 0) {
      usageStats = usageResults[0];
       console.log(`[getResourceTypeStatistics] Aggregation results (non-voided):`, usageStats);
    } else {
      console.log(`[getResourceTypeStatistics] No non-voided ${dbType} resources found.`);
    }

    // --- 3. Count Total Registrations ---
    console.log(`[getResourceTypeStatistics] Counting total registrations for event ${eventId}`);
    const totalRegistrations = await Registration.countDocuments({ event: eventId });
    console.log(`[getResourceTypeStatistics] Total registrations: ${totalRegistrations}`);

    // --- 4. Count Voided Resources of this Type ---
    console.log(`[getResourceTypeStatistics] Counting voided ${dbType} resources for event ${eventId}`);
    const totalVoided = await Resource.countDocuments({ 
      event: eventId, 
      type: dbType, 
      isVoided: true 
    });
    console.log(`[getResourceTypeStatistics] Total voided ${dbType}: ${totalVoided}`);
    
    // --- 5. Combine and Respond ---
    const finalStats = {
      totalConfigured: totalConfigured,
      totalIssued: usageStats.totalIssued,
      issuedToday: usageStats.issuedToday,
      uniqueAttendees: usageStats.uniqueAttendees,
      totalRegistrations: totalRegistrations, // Overall event registrations
      totalVoided: totalVoided         // Voided specific to this resource type
    };

    console.log(`[getResourceTypeStatistics] Sending final stats for ${requestType}:`, finalStats);
    res.status(200).json({
      success: true,
      message: `Statistics for ${requestType} retrieved successfully`,
      data: finalStats
    });

  } catch (error) {
    console.error(`[getResourceTypeStatistics] Error fetching statistics for event ${eventId}, type ${requestType}: ${error.message}`);
    console.error(error.stack); // Log stack trace
    // Send a generic error but maybe with some default data structure?
     res.status(500).json({
      success: false,
      message: `Server error fetching statistics for ${requestType}`,
      error: error.message, // Include error message for debugging on client if needed
      data: { // Send default structure on error
         totalConfigured: 0,
         totalIssued: 0,
         issuedToday: 0,
         uniqueAttendees: 0,
         totalRegistrations: 0,
         totalVoided: 0
       }
    });
  }
});

/**
 * @desc    Validate a resource scan
 * @route   POST /api/events/:eventId/resources/validate
 * @access  Private
 */
exports.validateResourceScan = asyncHandler(async (req, res, next) => {
  // Get eventId from the request BODY, not params, for this global route
  const { eventId, qrCode, resourceType, resourceOptionId } = req.body; 

  // Validate inputs
  if (!eventId || !mongoose.Types.ObjectId.isValid(eventId)) {
    return next(createApiError(400, 'Valid Event ID is required in the request body.'));
  }
  if (!qrCode) {
    return next(createApiError(400, 'QR code is required'));
  }

  if (!resourceType) {
    return next(createApiError(400, 'Resource type is required'));
  }

  if (!resourceOptionId) {
    return next(createApiError(400, 'Resource option ID is required'));
  }

  // Find the event
  const event = await Event.findById(eventId);
  if (!event) {
    return next(createApiError(404, 'Event not found'));
  }

  // Find the registration by QR code or registration ID
  const registration = await Registration.findOne({
    $or: [
      { qrCode },
      { registrationId: qrCode }
    ],
    event: eventId
  }).populate('category');

  if (!registration) {
    return next(createApiError(404, 'Registration not found'));
  }

  // Check if registration is active
  if (registration.status !== 'active') {
    return next(createApiError(400, `Registration is ${registration.status}`));
  }

  // Check category permissions for this resource type
  const categoryId = registration.category?._id;
  const category = await Category.findById(categoryId);

  if (!category) {
    return next(createApiError(404, 'Category not found'));
  }

  // Check if category has permission for this resource type
  let hasPermission = false;
  
  if (resourceType === 'food') {
    hasPermission = category.permissions.meals;
  } else if (resourceType === 'kits' || resourceType === 'kitBag') {
    hasPermission = category.permissions.kitItems;
  } else if (resourceType === 'certificates' || resourceType === 'certificate') {
    hasPermission = category.permissions.certificates;
  } else if (resourceType === 'certificatePrinting') {
    hasPermission = category.permissions.certificates; // Use the same permission as regular certificates
  }

  if (!hasPermission) {
    return next(createApiError(400, `This category does not have permission for ${resourceType}`));
  }

  // Check if this resource has already been used
  const existingResource = await Resource.findOne({
    event: eventId,
    registration: registration._id,
    type: resourceType,
    'details.option': resourceOptionId,
    status: 'used'
  });

  if (existingResource) {
    return next(createApiError(400, `This ${resourceType} has already been used by this registration`));
  }

  res.status(200).json({
    success: true,
    message: 'Scan validated successfully',
    data: {
      registration: {
        _id: registration._id,
        registrationId: registration.registrationId,
        firstName: registration.personalInfo?.firstName || '',
        lastName: registration.personalInfo?.lastName || '',
        categoryName: category.name
      }
    }
  });
});

/**
 * @desc    Record resource usage
 * @route   POST /api/events/:eventId/resources/usage
 * @access  Private
 */
exports.recordResourceUsage = asyncHandler(async (req, res, next) => {
  // Get eventId from the BODY for this global route
  const { eventId, registrationId, resourceType, resourceOptionId } = req.body; 

  // Validate inputs
  if (!eventId || !mongoose.Types.ObjectId.isValid(eventId)) {
    return next(createApiError(400, 'Valid Event ID is required in the request body.'));
  }
  if (!registrationId) {
    return next(createApiError(400, 'Registration ID is required'));
  }
  if (!resourceType) {
    return next(createApiError(400, 'Resource type is required'));
  }
  if (!resourceOptionId) {
    return next(createApiError(400, 'Resource option ID is required'));
  }

  // Find the event
  const event = await Event.findById(eventId);
  if (!event) {
    return next(createApiError(404, 'Event not found'));
  }

  // Find the registration
  const registration = await Registration.findOne({
    $or: [
      { qrCode: registrationId },
      { registrationId }
    ],
    event: eventId
  });

  if (!registration) {
    return next(createApiError(404, 'Registration not found'));
  }

  // Map UI resource types to database resource types if needed
  // The database schema expects: 'food', 'kitBag', 'certificate'
  let dbResourceType = resourceType;
  
  // Remove the incorrect mapping that causes validation errors
  // DO NOT map 'kitBag' to 'kits' - 'kitBag' is the correct value for the database

  // Clean up resourceOptionId by removing any "0_" prefix
  let cleanedOptionId = resourceOptionId;
  if (resourceOptionId && resourceOptionId.startsWith('0_')) {
    cleanedOptionId = resourceOptionId.substring(2);
    console.log(`[recordResourceUsage] Cleaned resourceOptionId: ${resourceOptionId} -> ${cleanedOptionId}`); // Log cleaning
  } else {
    console.log(`[recordResourceUsage] Using resourceOptionId as is (no prefix): ${resourceOptionId}`);
  }

  // --- Check if this specific meal has already been used TODAY --- 
  let mealAlreadyUsedToday = false;
  if (dbResourceType === 'food') {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    console.log(`[recordResourceUsage] Checking for existing FOOD record: event=${eventId}, reg=${registration._id}, option=${cleanedOptionId}, date=${todayStart.toISOString()} to ${todayEnd.toISOString()}`); // Log check params

    const existingFoodResourceToday = await Resource.findOne({
      event: eventId,
      registration: registration._id,
      type: 'food',
      'details.option': cleanedOptionId, // *** USE CLEANED ID ***
      status: 'used',
      actionDate: {
        $gte: todayStart,
        $lte: todayEnd
      }
    });

    if (existingFoodResourceToday) {
        console.log(`[recordResourceUsage] Found existing FOOD record for today: ${existingFoodResourceToday._id}`); // Log found record
        mealAlreadyUsedToday = true;
    } else {
        console.log(`[recordResourceUsage] No existing FOOD record found for today.`);
    }
  }
  // --- End Check ---

  // Check if this resource has already been used (Original Check - Now uses cleaned ID)
  console.log(`[recordResourceUsage] Checking for existing ANY record: event=${eventId}, reg=${registration._id}, type=${dbResourceType}, option=${cleanedOptionId}`); // Log check params
  const existingResource = await Resource.findOne({
    event: eventId,
    registration: registration._id,
    type: dbResourceType,
    'details.option': cleanedOptionId, // *** USE CLEANED ID ***
    status: 'used'
  });

  if (existingResource) {
    console.log(`[recordResourceUsage] Found existing ANY record: ${existingResource._id}`); // Log found record
  }

  // --- Combine checks --- 
  if (mealAlreadyUsedToday) { // Prioritize the date-specific check for food
    console.log(`[recordResourceUsage] Blocking duplicate FOOD scan for today.`); // Log block reason
    return next(createApiError(400, `This meal has already been scanned for this registration today.`));
  } else if (dbResourceType !== 'food' && existingResource) { // Use original check for non-food items
    console.log(`[recordResourceUsage] Blocking duplicate NON-FOOD scan.`); // Log block reason
    return next(createApiError(400, `This ${resourceType} has already been used by this registration.`));
  }
  // --- End Combined Checks ---

  console.log(`[recordResourceUsage] Proceeding to create new resource record.`); // Log proceed

  // Create a new resource record
  const resource = new Resource({
    event: eventId,
    registration: registration._id,
    type: dbResourceType,
    status: 'used',
    details: {
      option: cleanedOptionId // Use cleaned version for new records
    },
    actionDate: new Date(),
    actionBy: req.user._id,
    createdBy: req.user._id
  });

  await resource.save();

  // Add to registration activity log
  const resourceTypeDisplay = resourceType.charAt(0).toUpperCase() + resourceType.slice(1);
  
  // Get resource option name
  let optionName = cleanedOptionId;
  if (resourceType === 'food') {
    const meal = event.meals.find(m => m._id.toString() === cleanedOptionId);
    if (meal) optionName = meal.name;
  } else if (resourceType === 'kitBag' || resourceType === 'kits') {
    const kit = event.kitItems.find(k => k._id.toString() === cleanedOptionId);
    if (kit) optionName = kit.name;
  } else if (resourceType === 'certificate' || resourceType === 'certificates') {
    const cert = event.certificateTypes.find(c => c._id.toString() === cleanedOptionId);
    if (cert) optionName = cert.name;
  }

  // Add to registration activities
  const activities = registration.activities || [];
  activities.push({
    action: `${resourceTypeDisplay} Used`,
    description: `${resourceTypeDisplay} "${optionName}" was used`,
    user: req.user.name,
    timestamp: new Date()
  });
  
  registration.activities = activities;
  
  // Add to resource usage summary in registration
  // Determine the right array to update based on resource type
  let resourceField;
  if (dbResourceType === 'food') {
    resourceField = 'resourceUsage.meals';
  } else if (dbResourceType === 'kitBag') {
    resourceField = 'resourceUsage.kitItems';
  } else if (dbResourceType === 'certificate' || dbResourceType === 'certificatePrinting') {
    resourceField = 'resourceUsage.certificates';
  }
  
  // Update the appropriate array in resourceUsage
  if (resourceField) {
    const resourceSummary = {
      resourceId: resource._id,
      option: cleanedOptionId,
      optionName: optionName,
      date: new Date()
    };
    
    // Use MongoDB's $push operator to add to the array
    registration.resourceUsage = registration.resourceUsage || {};
    registration.resourceUsage.meals = registration.resourceUsage.meals || [];
    registration.resourceUsage.kitItems = registration.resourceUsage.kitItems || [];
    registration.resourceUsage.certificates = registration.resourceUsage.certificates || [];
    
    if (dbResourceType === 'food') {
      registration.resourceUsage.meals.push(resourceSummary);
    } else if (dbResourceType === 'kitBag') {
      registration.resourceUsage.kitItems.push(resourceSummary);
    } else if (dbResourceType === 'certificate' || dbResourceType === 'certificatePrinting') {
      registration.resourceUsage.certificates.push(resourceSummary);
    }
  }
  
  await registration.save();

  res.status(201).json({
    success: true,
    message: `${resourceTypeDisplay} usage recorded successfully`,
    data: resource
  });
});

/**
 * @desc    Get recent resource scans
 * @route   GET /api/events/:eventId/resources/scans
 * @access  Private
 */
exports.getRecentScans = asyncHandler(async (req, res, next) => {
  // Get eventId from either params or query
  let eventId = req.params.eventId || req.query.eventId;
  const { type, limit = 10 } = req.query;

  // Validate inputs
  if (!eventId) {
    return next(createApiError(400, 'Event ID is required'));
  }

  // Fetch resource settings for the event once, if needed for formatting
  let foodSettings = null;
  if (!type || type === 'food' || type === 'all') { // Only fetch if requesting food or all
    try {
      const settingDoc = await ResourceSetting.findOne({ event: eventId, type: 'food' }).lean();
      if (settingDoc && settingDoc.settings) {
        foodSettings = settingDoc.settings;
        console.log('[getRecentScans] Fetched food settings for formatting meal names.');
      }
    } catch (settingsError) {
      console.error('[getRecentScans] Error fetching food settings for formatting:', settingsError);
      // Continue without formatting if settings fail
    }
  }

  // Function to format meal name using fetched settings
  const formatMealName = (optionId) => {
    if (!foodSettings || !optionId || typeof optionId !== 'string') return optionId || 'Unknown';
    const parts = optionId.split('_');
    if (parts.length < 2) return optionId; // Invalid format
    const dayIndex = parseInt(parts[0], 10);
    const mealName = parts.slice(1).join('_'); // Handle meal names with underscores

    const day = foodSettings.days?.[dayIndex];
    if (!day) return mealName; // Day not found

    const meal = day.meals?.find(m => m.name === mealName);
    if (!meal) return mealName; // Meal not found

    const dayDate = new Date(day.date);
    const formattedDate = dayDate.toLocaleDateString();
    return `${meal.name} (${formattedDate})`;
  };

  console.log(`Finding recent resource scans for event ${eventId}, type: ${type || 'all'}`);
  
  // Build query
  const query = {
    event: eventId,
    status: 'used'
  };

  if (type) {
    // Use the exact type as provided - mapping happens on the client
    query.type = type;
  }

  console.log('Resource scan query:', JSON.stringify(query));

  // Find recent resources with detailed population
  const resources = await Resource.find(query)
    .sort({ actionDate: -1, createdAt: -1 }) // Sort by action date, then creation date as fallback
    .limit(parseInt(limit))
    .populate({
      path: 'registration',
      select: 'registrationId personalInfo category',
      populate: {
        path: 'category',
        select: 'name color'
      }
    })
    .populate('actionBy', 'name')
    .populate('createdBy', 'name');

  console.log(`Found ${resources.length} recent scans`);
  
  if (resources.length > 0) {
    console.log('Sample scan resource:', JSON.stringify(resources[0]));
  }

  // Format the response for consistent client-side handling
  const formattedResources = resources.map(resource => {
    // Get registration info safely
    const registration = resource.registration || {};
    const personalInfo = registration.personalInfo || {};
    const category = registration.category || {};
    
    // Get user info safely
    const actionBy = resource.actionBy?.name || 'System';
    
    // Determine the correct resource option name
    let resourceOptionName = resource.details?.option || 'Unknown';
    if (resource.type === 'food') {
      resourceOptionName = formatMealName(resource.details?.option);
    } // Add similar logic for other types if needed

    return {
      _id: resource._id,
      timestamp: resource.actionDate || resource.createdAt,
      resourceType: resource.type,
      details: resource.details || {},
      status: resource.status,
      resourceOption: {
        _id: resource.details?.option,
        name: resourceOptionName // Use the formatted name
      },
      registration: {
        _id: registration._id,
        registrationId: registration.registrationId || 'Unknown',
        firstName: personalInfo.firstName || '',
        lastName: personalInfo.lastName || '',
        category: {
          _id: category._id,
          name: category.name || 'Unknown',
          color: category.color
        }
      },
      actionBy,
      createdAt: resource.createdAt
    };
  });

  res.status(200).json({
    success: true,
    count: formattedResources.length,
    data: formattedResources
  });
});

/**
 * @desc    Get all resources used by a registration
 * @route   GET /api/events/:eventId/registrations/:registrationId/resources
 * @access  Private
 */
const getResourceUsage = asyncHandler(async (req, res) => {
  // ... existing getResourceUsage code ...
});

/**
 * @desc    Void a specific resource usage record
 * @route   PUT /api/events/:eventId/registrations/:registrationId/resources/:resourceUsageId/void
 * @access  Private (Staff/Admin)
 */
const voidResourceUsage = asyncHandler(async (req, res, next) => {
  const { eventId, registrationId, resourceUsageId } = req.params;

  // Validate IDs
  if (!mongoose.Types.ObjectId.isValid(eventId) || 
      !mongoose.Types.ObjectId.isValid(registrationId) || 
      !mongoose.Types.ObjectId.isValid(resourceUsageId)) {
    return next(createApiError(400, 'Invalid ID format'));
  }

  // Find the specific resource usage record
  const resourceUsage = await Resource.findById(resourceUsageId);

  if (!resourceUsage) {
    return next(createApiError(404, 'Resource usage record not found'));
  }

  // Check if it belongs to the correct registration and event (optional but good practice)
  if (resourceUsage.event.toString() !== eventId || resourceUsage.registration.toString() !== registrationId) {
      return next(createApiError(400, 'Resource usage record does not match event/registration'));
  }

  // Check if already voided
  if (resourceUsage.isVoided) {
    return sendSuccess(res, 200, 'Resource usage already voided', resourceUsage); // Or 400 if preferred
  }

  // Mark as voided
  resourceUsage.isVoided = true;
  resourceUsage.voidedAt = new Date();
  resourceUsage.voidedBy = req.user._id; // Assuming user is available from auth middleware
  resourceUsage.updatedAt = new Date(); // Update timestamp

  await resourceUsage.save();

  // Log the action
  logger.info(`Resource usage ${resourceUsageId} voided by user ${req.user.id}`);

  // Return the updated record
  sendSuccess(res, 200, 'Resource usage voided successfully', resourceUsage);
});

/**
 * Helper function to generate default settings for different resource types
 */
const defaultResourceSettings = (type) => {
  // First convert type to lowercase for case-insensitive comparison
  const normalizedType = type ? type.toLowerCase() : '';
  
  // Check against lowercase versions of DB types
  switch (normalizedType) { 
    case 'food':
      return { enabled: true, meals: [], days: [] }; 
    case 'kitbag': // Lowercase version of kitBag
    case 'kit':    // Also handle 'kit'
    case 'kits':   // Also handle 'kits'
      return { enabled: true, items: [] };
    case 'certificate': // Lowercase version of original
    case 'certificates': // Also handle 'certificates'
      return { enabled: true, types: [] };
    case 'certificateprinting':
      return { enabled: true, templates: [] };
    default:
      console.log(`[defaultResourceSettings] Unknown resource type: ${type}, using default enabled:false`);
      return { enabled: false }; 
  }
};

/**
 * @desc    Get statistics for a specific resource type/option
 * @route   GET /api/events/:id/resources/stats
 * @access  Private
 */
exports.getResourceStats = asyncHandler(async (req, res, next) => {
  const { id: eventId } = req.params; // Get eventId from route parameter
  const { type, optionId } = req.query; // Get type and optionId from query parameters

  // Validate required parameters
  if (!eventId || !type || !optionId) {
    return next(createApiError(400, 'Event ID, resource type, and resource option ID are required in query parameters.'));
  }

  if (!mongoose.Types.ObjectId.isValid(eventId)) {
    return next(createApiError(400, 'Invalid Event ID format.'));
  }

  // Normalize type for database query
  let dbType = type.toLowerCase();
  if (dbType === 'kits' || dbType === 'kit') dbType = 'kitBag';
  if (dbType === 'certificates') dbType = 'certificate';
  if (dbType === 'certificateprinting') dbType = 'certificatePrinting';

  // Convert validation array to lowercase for case-insensitive comparison
  const validTypes = ['food', 'kitbag', 'certificate', 'certificateprinting'].map(t => t.toLowerCase());
  if (!validTypes.includes(dbType.toLowerCase())) {
    return next(createApiError(400, `Invalid resource type: ${type}. Must be one of: food, kit, certificate, or certificatePrinting`));
  }

  try {
    const baseQuery = {
      event: eventId,
      type: dbType,
      'details.option': optionId, // Corrected field name
      isVoid: { $ne: true } // Exclude voided resources
    };

    // Calculate total count
    const totalCount = await Resource.countDocuments(baseQuery);

    // Calculate count for today
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1); // Start of tomorrow

    const todayQuery = {
      ...baseQuery,
      timestamp: {
        $gte: today,
        $lt: tomorrow
      }
    };
    const todayCount = await Resource.countDocuments(todayQuery);

    // Calculate unique attendees
    // We need to group by registration ID and count the distinct groups
    const uniqueAttendeesResult = await Resource.aggregate([
      { $match: baseQuery },
      { $group: { _id: '$registration' } }, // Group by registration reference
      { $count: 'uniqueCount' }          // Count the number of groups
    ]);
    
    const uniqueAttendeesCount = uniqueAttendeesResult.length > 0 ? uniqueAttendeesResult[0].uniqueCount : 0;

    const statsData = {
      count: totalCount,
      today: todayCount,
      uniqueAttendees: uniqueAttendeesCount
    };

    sendSuccess(res, 200, statsData, 'Resource statistics retrieved successfully');

  } catch (error) {
    logger.error(`Error getting resource stats for event ${eventId}, type ${type}, option ${optionId}: ${error.message}`);
    next(createApiError(500, 'Error retrieving resource statistics', error.message));
  }
});

/**
 * @desc    Get a single resource (usage log)
 * @route   GET /api/resources/:id
 * @access  Private
 */
exports.getResourceById = asyncHandler(async (req, res, next) => {
  const resource = await Resource.findById(req.params.id)
    .populate('registration', 'registrationId firstName lastName email')
    .populate('issuedBy', 'name email')
    .populate('voidedBy', 'name email');

  if (!resource) {
    return next(createApiError(404, `Resource not found with id of ${req.params.id}`));
  }

  res.status(200).json({
    success: true,
    data: resource
  });
});

/**
 * @desc    Get aggregated resource usage statistics for a specific event
 * @route   GET /api/events/:id/resources/statistics
 * @access  Private
 */
const getEventResourceStatistics = asyncHandler(async (req, res, next) => {
  // The event ID should be available from the route parameter :id
  // due to how this route is defined in events.routes.js
  const eventId = req.params.id; 

  if (!eventId || !mongoose.Types.ObjectId.isValid(eventId)) {
    return next(createApiError(400, 'Invalid or missing Event ID in route parameters.'));
  }

  try {
    // Aggregation pipeline for resource statistics
    const statsPipeline = [
      {
        $match: {
          event: new mongoose.Types.ObjectId(eventId),
          isVoided: { $ne: true } // Exclude voided transactions
        }
      },
      {
        $facet: {
          "totalUsage": [
            { $count: "count" }
          ],
          "byType": [
            { $group: { _id: "$type", count: { $sum: 1 } } },
            { $project: { _id: 0, type: "$_id", count: "$count" } }
          ],
          "byDetailFood": [
            { $match: { type: 'food' } },
            { $group: { _id: "$details.meal", count: { $sum: 1 } } }, // Group by meal name
            { $project: { _id: 0, meal: "$_id", count: "$count" } }
          ],
          "byDetailKit": [
            { $match: { type: 'kitBag' } },
            { $group: { _id: "$details.item", count: { $sum: 1 } } }, // Group by kit item name
            { $project: { _id: 0, item: "$_id", count: "$count" } }
          ],
          "byDetailCertificate": [
            { $match: { type: 'certificate' } },
            { $group: { _id: "$details.certificateType", count: { $sum: 1 } } }, // Group by certificate type
            { $project: { _id: 0, certificateType: "$_id", count: "$count" } }
          ],
           "byDay": [
             { $group: { 
                 _id: { $dateToString: { format: "%Y-%m-%d", date: "$actionDate" } }, 
                 count: { $sum: 1 } 
             } },
             { $sort: { _id: 1 } }, // Sort by date
             { $project: { _id: 0, date: "$_id", count: "$count" } }
          ]
        }
      }
    ];

    const results = await Resource.aggregate(statsPipeline);

    // Process the results from the $facet stage
    const statistics = {
      totalUsage: results[0]?.totalUsage[0]?.count || 0,
      byType: results[0]?.byType || [],
      byDetail: {
        food: results[0]?.byDetailFood || [],
        kitBag: results[0]?.byDetailKit || [],
        certificate: results[0]?.byDetailCertificate || []
      },
      byDay: results[0]?.byDay || []
    };

    // Convert arrays of {type: count} to objects {type1: count1, type2: count2}
    statistics.byType = statistics.byType.reduce((acc, item) => {
      acc[item.type] = item.count;
      return acc;
    }, {});
    statistics.byDetail.food = statistics.byDetail.food.reduce((acc, item) => {
        acc[item.meal || 'Unknown'] = item.count;
        return acc;
    }, {});
     statistics.byDetail.kitBag = statistics.byDetail.kitBag.reduce((acc, item) => {
        acc[item.item || 'Unknown'] = item.count;
        return acc;
    }, {});
     statistics.byDetail.certificate = statistics.byDetail.certificate.reduce((acc, item) => {
        acc[item.certificateType || 'Unknown'] = item.count;
        return acc;
    }, {});

    sendSuccess(res, 200, 'Resource usage statistics retrieved successfully', statistics);

  } catch (error) {
    console.error(`Error fetching resource statistics for event ${eventId}:`, error);
    next(createApiError(500, 'Server error fetching resource statistics', error.message));
  }
});

/**
 * @desc    Export resource usage logs for an event
 * @route   GET /api/events/:id/resources/export
 * @access  Private
 */
const exportResourceUsage = asyncHandler(async (req, res, next) => {
  const { id: eventId } = req.params; // Get eventId from route parameter
  const { type, format = 'excel' } = req.query; // Get type and format from query

  // Validate inputs
  if (!eventId || !mongoose.Types.ObjectId.isValid(eventId)) {
    return next(createApiError(400, 'Invalid or missing Event ID.'));
  }
  if (!type) {
    return next(createApiError(400, 'Resource type query parameter is required (e.g., type=food).'));
  }

  // Normalize type if needed (though frontend should send correct DB type)
  let dbType = type.toLowerCase();
  if (dbType === 'kits') dbType = 'kitBag';
  if (dbType === 'certificates') dbType = 'certificate';

  const validDbTypes = ['food', 'kitbag', 'certificate', 'certificateprinting'];
  if (!validDbTypes.includes(dbType)) {
    return next(createApiError(400, `Invalid resource type: ${type}`));
  }

  try {
    // Fetch all non-voided resources of the specified type for the event
    const resources = await Resource.find({ 
      event: eventId, 
      type: dbType, 
      isVoided: { $ne: true }
    })
    .populate('registration', 'registrationId personalInfo') // Populate attendee info
    .populate('actionBy', 'name email') // Populate who performed the action
    .sort({ actionDate: -1 }) // Sort by most recent first
    .lean(); // Use lean for performance

    if (resources.length === 0) {
        // Use sendSuccess for consistency, indicating no data found
        return sendSuccess(res, 404, `No ${type} usage logs found for this event to export.`); 
    }

    // --- Generate File based on format --- 
    if (format.toLowerCase() === 'excel') {
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'OnSite Atlas';
        workbook.created = new Date();
        const worksheet = workbook.addWorksheet(`${type}_Usage_Log`);

        // Define Columns dynamically based on type?
        worksheet.columns = [
            { header: 'Timestamp', key: 'timestamp', width: 25 },
            { header: 'Attendee Reg ID', key: 'attendeeRegId', width: 20 },
            { header: 'Attendee Name', key: 'attendeeName', width: 30 },
            { header: 'Resource Detail', key: 'detail', width: 30 }, // Meal, Kit Item, Cert Type
            { header: 'Issued By Name', key: 'issuedByName', width: 30 },
            { header: 'Issued By Email', key: 'issuedByEmail', width: 30 },
        ];
        
        // Style Header
        worksheet.getRow(1).font = { bold: true };
        
        // Add Data Rows
        resources.forEach(log => {
            const attendeeName = log.registration?.personalInfo 
                ? `${log.registration.personalInfo.firstName || ''} ${log.registration.personalInfo.lastName || ''}`.trim()
                : 'N/A';
            
            let detailValue = 'N/A';
            if (log.details) {
                 detailValue = log.details.meal || log.details.item || log.details.certificateType || log.details.option || JSON.stringify(log.details);
            }

            worksheet.addRow({
                timestamp: log.actionDate ? new Date(log.actionDate).toLocaleString() : 'N/A',
                attendeeRegId: log.registration?.registrationId || 'N/A',
                attendeeName: attendeeName,
                detail: detailValue,
                issuedByName: log.actionBy?.name || 'N/A',
                issuedByEmail: log.actionBy?.email || 'N/A',
            });
        });

        // Set Response Headers for Excel
        const filename = `${type}_usage_${eventId}_${new Date().toISOString().split('T')[0]}.xlsx`;
        res.setHeader(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="${filename}"`
        );

        // Write workbook to response
        await workbook.xlsx.write(res);
        res.end();

    } else if (format.toLowerCase() === 'csv') {
        // Implement CSV generation if needed
        // Example: Use a library or manually construct CSV string
        let csvData = "Timestamp,Attendee Reg ID,Attendee Name,Resource Detail,Issued By Name,Issued By Email\n"; // Header
        resources.forEach(log => {
            const attendeeName = log.registration?.personalInfo ? `\"${log.registration.personalInfo.firstName || ''} ${log.registration.personalInfo.lastName || ''}\"` : 'N/A';
            let detailValue = 'N/A';
            if (log.details) {
                 detailValue = log.details.meal || log.details.item || log.details.certificateType || log.details.option || JSON.stringify(log.details);
            }
            // Escape commas in detailValue if necessary
            detailValue = `\"${String(detailValue).replace(/"/g, '""' )}\"`; 

            csvData += `${log.actionDate ? new Date(log.actionDate).toISOString() : 'N/A'},`;
            csvData += `${log.registration?.registrationId || 'N/A'},`;
            csvData += `${attendeeName},`;
            csvData += `${detailValue},`;
            csvData += `${log.actionBy?.name || 'N/A'},`;
            csvData += `${log.actionBy?.email || 'N/A'}\n`;
        });
        
        const filename = `${type}_usage_${eventId}_${new Date().toISOString().split('T')[0]}.csv`;
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.status(200).send(csvData);

    } else {
      // Unsupported format
      return next(createApiError(400, `Unsupported export format: ${format}. Use 'excel' or 'csv'.`));
    }

  } catch (error) {
    logger.error(`Error exporting ${type} usage for event ${eventId}: ${error.message}`);
    next(createApiError(500, `Failed to export ${type} usage log.`, error.message));
  }
});

module.exports = {
  getResourceSettings,
  getResources: exports.getResources,
  createResource: exports.createResource,
  updateResourceSettings: exports.updateResourceSettings,
  validateResourceScan: exports.validateResourceScan,
  recordResourceUsage: exports.recordResourceUsage,
  getRecentScans: exports.getRecentScans,
  getResourceTypeStatistics: exports.getResourceTypeStatistics,
  getResourceUsage,
  voidResourceUsage,
  getResourceStats: exports.getResourceStats,
  getEventResourceStatistics,
  getResourceById: exports.getResourceById,
  updateResource: exports.updateResource,
  deleteResource: exports.deleteResource,
  voidResource: exports.voidResource,
  exportResourceUsage
}; 