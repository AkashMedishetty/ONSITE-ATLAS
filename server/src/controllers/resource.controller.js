const mongoose = require('mongoose');
const Resource = require('../models/Resource');
const ResourceSetting = require('../models/ResourceSetting');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const Abstract = require('../models/Abstract');
const Workshop = require('../models/Workshop');
const { createApiError } = require('../middleware/error');
const asyncHandler = require('../middleware/async');
const Category = require('../models/Category');
const { sendSuccess, sendPaginated } = require('../utils/responseFormatter');
const logger = require('../utils/logger');
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');
const pdfkit = require('pdfkit');
const pdfToPng = require('pdf-to-png');
const { convertPdfToPng } = require('../utils/pdfToImage');
const sharp = require('sharp'); // Add at the top for image dimension validation

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
    let isEnabledFlag;

    if (resourceSettingDoc) {
      console.log(`[getResourceSettings] Found existing ResourceSetting document.`);
      isEnabledFlag = resourceSettingDoc.isEnabled;
      if (dbQueryType === 'certificatePrinting') {
        // For certificatePrinting, templates are stored directly on the document
        settingsData = { templates: resourceSettingDoc.certificatePrintingTemplates || [] }; 
        // Include other general settings if they exist under resourceSettingDoc.settings
        if (resourceSettingDoc.settings && Object.keys(resourceSettingDoc.settings).length > 0) {
          settingsData = { ...settingsData, ...resourceSettingDoc.settings };
        }
      } else {
        // For other types, settings are under the .settings property
        settingsData = resourceSettingDoc.settings || defaultResourceSettings(dbQueryType);
      }
      message = `${type} settings retrieved successfully`;
    } else {
      console.log(`[getResourceSettings] No ResourceSetting document found. Returning default.`);
      isEnabledFlag = true; // Default to true if no document exists
      if (dbQueryType === 'certificatePrinting') {
        settingsData = { templates: defaultResourceSettings(dbQueryType).templates || [] };
      } else {
        settingsData = defaultResourceSettings(dbQueryType);
      }
      message = `Default ${type} settings returned (no specific config found)`;
    }

    // 3. Return Response in Expected Format
    let responseDataPayload;
    if (dbQueryType === 'certificatePrinting') {
      responseDataPayload = {
        certificatePrintingTemplates: settingsData.templates,
        settings: settingsData, // Keep this for any other general settings under .settings
        isEnabled: isEnabledFlag
      };
    } else {
      responseDataPayload = {
        settings: settingsData,
        isEnabled: isEnabledFlag
      };
    }

    console.log(`[getResourceSettings] Responding with settings for ${type}:`, responseDataPayload);
    return res.status(200).json({
      success: true,
      message: message,
      data: responseDataPayload
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

  console.log(`[updateResourceSettings] Incoming req.body for type ${type}:`, JSON.stringify(req.body, null, 2));

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
    let resourceSettingsDoc = await ResourceSetting.findOne({
      event: eventId,
      type: dbType // Use normalized DB type
    });

    // If settings don't exist, create new settings using DB type
    if (!resourceSettingsDoc) {
      resourceSettingsDoc = new ResourceSetting({
        event: eventId,
        type: dbType, // Use normalized DB type
        isEnabled: isEnabled !== undefined ? isEnabled : true, // Default to true when creating
        createdBy: req.user._id,
        updatedBy: req.user._id
      });
      if (dbType === 'certificatePrinting') {
        resourceSettingsDoc.certificatePrintingTemplates = settings?.templates || [];
        // Store other potential general settings for certificatePrinting if any, excluding templates
        const generalSettings = { ...settings };
        delete generalSettings.templates;
        resourceSettingsDoc.settings = generalSettings; 
      } else {
        resourceSettingsDoc.settings = settings || {};
      }
      console.log(`[updateResourceSettings] Creating new ResourceSetting for type: ${dbType}`);
    } else {
      // Update existing settings
      console.log(`[updateResourceSettings] Updating existing ResourceSetting for type: ${dbType}`);
      if (dbType === 'certificatePrinting') {
        console.log('[updateResourceSettings] CERTPRINT_UPDATE: Current doc.certificatePrintingTemplates BEFORE change:', JSON.stringify(resourceSettingsDoc.certificatePrintingTemplates, null, 2));
        console.log('[updateResourceSettings] CERTPRINT_UPDATE: Incoming settings.templates FROM CLIENT:', JSON.stringify(settings.templates, null, 2));
        
        if (settings?.templates !== undefined) {
          resourceSettingsDoc.certificatePrintingTemplates = settings.templates;
          console.log('[updateResourceSettings] CERTPRINT_UPDATE: Current doc.certificatePrintingTemplates AFTER assignment:', JSON.stringify(resourceSettingsDoc.certificatePrintingTemplates, null, 2));
        }
        // For certificatePrinting, we explicitly manage certificatePrintingTemplates.
        // We should clear or carefully manage the generic 'settings' field to avoid conflicts.
        // If 'settings' on the client for certificatePrinting ONLY contains 'enabled' and 'templates',
        // we can just ignore it here for the 'settings' field on the DB document for this type.
        // Or, if there are other general settings unrelated to templates, they would be handled here.
        // For now, let's ensure settings.templates doesn't pollute resourceSettingsDoc.settings.templates
        resourceSettingsDoc.settings = { enabled: settings?.enabled }; // Only store enabled, or other general non-template settings

      } else {
        // Logic for other types (food, kitBag, certificate)
        if (settings !== undefined) {
          resourceSettingsDoc.settings = settings;
        }
      }
      // Update isEnabled at the top level of the document for all types
      if (isEnabled !== undefined) {
        resourceSettingsDoc.isEnabled = isEnabled;
      }
      resourceSettingsDoc.updatedBy = req.user._id;
    }

    console.log(`[updateResourceSettings] Document details BEFORE save for type ${dbType}:`, JSON.stringify(resourceSettingsDoc.toObject(), null, 2));
    // Save the settings
    await resourceSettingsDoc.save();
    console.log(`[updateResourceSettings] Document details AFTER save for type ${dbType} (refetched might be needed to confirm DB state, but this is post-save call).`);

    // MIRROR: Update event document to keep in sync
    await mirrorResourceSettingsToEvent(eventId, dbType, resourceSettingsDoc.settings, resourceSettingsDoc.isEnabled);

    // Return the updated settings
    return res.status(200).json({
      success: true,
      message: `${type} settings updated successfully`, // Use original request type in message
      data: resourceSettingsDoc // Return the whole doc as before
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
    status: 'used',
    isVoided: { $ne: true } // Exclude voided resources
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

  // Option 1: Allow forced reprints for certificatePrinting
  // If req.body.force is true and resourceType is 'certificatePrinting', skip duplicate check
  const isForceReprint = req.body.force === true && dbResourceType === 'certificatePrinting';

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
      },
      isVoided: { $ne: true } // Exclude voided resources
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
    status: 'used',
    isVoided: { $ne: true } // Exclude voided resources
  });

  if (existingResource) {
    console.log(`[recordResourceUsage] Found existing ANY record: ${existingResource._id}`); // Log found record
  }

  // --- Combine checks --- 
  if (mealAlreadyUsedToday) { // Prioritize the date-specific check for food
    console.log(`[recordResourceUsage] Blocking duplicate FOOD scan for today.`); // Log block reason
    return next(createApiError(400, `This meal has already been scanned for this registration today.`));
  } else if (!isForceReprint && dbResourceType !== 'food' && existingResource) { // Use original check for non-food items, unless force reprint
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

  // Log received IDs for debugging
  console.log('[voidResourceUsage] Received:', { eventId, registrationId, resourceUsageId });

  // Validate IDs
  if (!mongoose.Types.ObjectId.isValid(eventId) || 
      !mongoose.Types.ObjectId.isValid(registrationId) || 
      !mongoose.Types.ObjectId.isValid(resourceUsageId)) {
    console.error('[voidResourceUsage] Invalid ID format:', { eventId, registrationId, resourceUsageId });
    return next(createApiError(400, 'Invalid ID format'));
  }

  // Find the specific resource usage record
  const resourceUsage = await Resource.findById(resourceUsageId);

  if (!resourceUsage) {
    console.error('[voidResourceUsage] Resource usage record not found:', resourceUsageId);
    return next(createApiError(404, 'Resource usage record not found'));
  }

  // Void ALL matching resources for this registration/event/type/option
  await Resource.updateMany(
    {
      event: resourceUsage.event,
      registration: resourceUsage.registration,
      type: resourceUsage.type,
      "details.option": resourceUsage.details.option,
      status: "used",
      isVoided: { $ne: true }
    },
    {
      $set: {
        status: "voided",
        isVoided: true,
        voidedAt: new Date(),
        voidedBy: req.user._id,
        updatedAt: new Date()
      }
    }
  );

  // Re-fetch the voided resource for response
  const updatedResource = await Resource.findById(resourceUsageId);

  // Log the action
  logger.info(`All matching resource usages voided for registration ${resourceUsage.registration}, event ${resourceUsage.event}, type ${resourceUsage.type}, option ${resourceUsage.details.option} by user ${req.user.id}`);

  // Return the updated record
  sendSuccess(res, 200, 'All matching resource usages voided successfully', updatedResource);
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

/**
 * @desc    Upload a certificate template file for the resource settings.
 * @route   POST /api/resources/certificate-template/upload
 * @access  Private
 */
const uploadCertificateTemplateFile = asyncHandler(async (req, res, next) => {
  const eventIdFromBody = req.body.eventId; // Extracted from form fields

  if (!req.files || !req.files.templateFile) {
    logger.warn('[uploadCertificateTemplateFile] No file uploaded. req.files is: %o', req.files);
    return next(createApiError('No templateFile was uploaded in the form.', 400));
  }
  const templateFile = req.files.templateFile;

  if (!eventIdFromBody) {
    logger.warn('[uploadCertificateTemplateFile] Event ID is missing from the request body.');
    return next(createApiError('Event ID is required to upload a template.', 400));
  }
  
  if (!mongoose.Types.ObjectId.isValid(eventIdFromBody)) {
      logger.warn(`[uploadCertificateTemplateFile] Invalid Event ID format: ${eventIdFromBody}`);
      return next(createApiError('Invalid Event ID format.', 400));
  }

  // --- File Validation ---
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (templateFile.size > maxSize) {
    logger.warn(`[uploadCertificateTemplateFile] File size (${templateFile.size}) exceeds max size (${maxSize})`);
    return next(createApiError(`File size exceeds the ${maxSize / (1024 * 1024)}MB limit.`, 400));
  }

  const allowedMimeTypes = ['image/jpeg', 'image/png', 'application/pdf'];
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.pdf'];
  const fileExt = path.extname(templateFile.name).toLowerCase();

  if (!allowedMimeTypes.includes(templateFile.mimetype) || !allowedExtensions.includes(fileExt)) {
    logger.warn(`[uploadCertificateTemplateFile] Invalid file type: ${templateFile.mimetype} or extension: ${fileExt}`);
    return next(createApiError('Invalid file type. Only JPG, PNG, PDF are allowed.', 400));
  }
  // --- End File Validation ---

  // --- File Saving Logic ---
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  const newFileName = `template-${uniqueSuffix}${fileExt}`;
  
  // Corrected: Point to the /server/public/uploads/certificate_templates directory
  const basePublicDir = path.join(__dirname, '..', '..', 'public');
  const relativeUploadPath = path.join('uploads', 'certificate_templates'); // Relative path from public dir
  const uploadDir = path.join(basePublicDir, relativeUploadPath); // Absolute path for fs operations
  
  const newFilePath = path.join(uploadDir, newFileName);

  let templatePdfUrl = null;
  let templateImageUrl = null;
  let templateUrl = null;

  try {
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
      logger.info(`[uploadCertificateTemplateFile] Created directory: ${uploadDir}`);
    }

    await templateFile.mv(newFilePath);
    logger.info(`[uploadCertificateTemplateFile] File moved successfully to: ${newFilePath}`);

    templateUrl = `/${relativeUploadPath}/${newFileName}`.replace(/\\/g, '/');

    // If PDF, convert to PNG for preview/background
    if (fileExt === '.pdf') {
      try {
        const pngPath = await convertPdfToPng(newFilePath, uploadDir, `template-${uniqueSuffix}`);
        templatePdfUrl = templateUrl;
        templateImageUrl = `/${relativeUploadPath}/${path.basename(pngPath)}`.replace(/\\/g, '/');
        // Get PNG dimensions
        const image = sharp(pngPath);
        const metadata = await image.metadata();
        var imageWidth = metadata.width;
        var imageHeight = metadata.height;
        var imageAspect = imageWidth / imageHeight;
      } catch (convErr) {
        logger.error(`[uploadCertificateTemplateFile] PDF-to-PNG conversion failed: ${convErr.message}`);
        return next(createApiError('PDF uploaded, but failed to generate preview image. Please check the PDF format or contact support.', 500));
      }
    } else if (fileExt === '.png' || fileExt === '.jpg' || fileExt === '.jpeg') {
      // For images, use as both templateImageUrl and templateUrl
      templateImageUrl = templateUrl;
      templatePdfUrl = null;
      // Get image dimensions
      try {
        const image = sharp(newFilePath);
        const metadata = await image.metadata();
        var imageWidth = metadata.width;
        var imageHeight = metadata.height;
        var imageAspect = imageWidth / imageHeight;
      } catch (imgErr) {
        fs.unlinkSync(newFilePath);
        logger.error(`[uploadCertificateTemplateFile] Image dimension read failed: ${imgErr.message}`);
        return next(createApiError('Failed to read image dimensions for validation. Please upload a valid PNG/JPG.', 400));
      }
    }

    // Calculate warning for non-A4 landscape aspect ratio
    let aspectWarning = null;
    const expectedAspect = 297 / 210; // A4 landscape
    if (typeof imageAspect !== 'undefined' && Math.abs(imageAspect - expectedAspect) > 0.05) {
      aspectWarning = 'Warning: Uploaded template is not A4 landscape (297x210mm, aspect ratio ≈ 1.414). Field alignment and printing may be unreliable.';
    }

    res.status(200).json({
      success: true,
      message: 'Certificate template uploaded successfully.',
      data: {
        templateUrl: templateUrl, // legacy, for compatibility
        templatePdfUrl: templatePdfUrl,
        templateImageUrl: templateImageUrl,
        fileName: templateFile.name, 
        fileSize: templateFile.size,
        fileType: templateFile.mimetype,
        imageWidth: imageWidth,
        imageHeight: imageHeight,
        imageAspect: imageAspect,
        aspectWarning: aspectWarning
      }
    });

  } catch (error) {
    logger.error(`[uploadCertificateTemplateFile] Error during file saving process: ${error.message}`, error);
    if (fs.existsSync(newFilePath)) {
        fs.unlink(newFilePath, (unlinkErr) => {
            if (unlinkErr) logger.error(`[uploadCertificateTemplateFile] Failed to delete partially uploaded file on error: ${newFilePath}`, unlinkErr);
        });
    }
    return next(createApiError('File upload failed during server processing.', 500));
  }
  // --- End File Saving Logic ---
});

/**
 * @desc    Generate Certificate PDF
 * @note    Abstract fields in templates (e.g., Abstract.title) are now supported by always fetching the Abstract for the registration (if it exists), even if no abstractId is provided. This allows certificate templates to use Abstract fields for any registration that has an associated abstract.
 * @route   GET /api/resources/events/:eventId/certificate-templates/:templateId/registrations/:registrationId/generate-pdf?background=true|false
 * @access  Private
 * @param   background (optional, default true): if false, only text fields are rendered (for pre-printed certificates)
 */
exports.generateCertificatePdf = asyncHandler(async (req, res, next) => {
    const { eventId, templateId, registrationId } = req.params;
    const { workshopId, abstractId, background = 'true' } = req.query;
    const drawBackground = background !== 'false'; // default true

    if (!mongoose.Types.ObjectId.isValid(eventId) ||
        !mongoose.Types.ObjectId.isValid(templateId) || // templateId is the _id of the template object
        !mongoose.Types.ObjectId.isValid(registrationId)) {
        return next(createApiError(400, 'Invalid Event, Template, or Registration ID'));
    }

    // 1. Fetch ResourceSetting for certificatePrinting
    const resourceSetting = await ResourceSetting.findOne({
        event: eventId,
        type: 'certificatePrinting',
        isEnabled: true
    });

    if (!resourceSetting || !resourceSetting.certificatePrintingTemplates || resourceSetting.certificatePrintingTemplates.length === 0) {
        return next(createApiError(404, 'Certificate printing settings not found or no templates configured for this event.'));
    }

    // 2. Find the specific template
    // Mongoose subdocuments in an array have an _id field by default.
    const template = resourceSetting.certificatePrintingTemplates.id(templateId);

    if (!template) {
        return next(createApiError(404, `Certificate template with ID ${templateId} not found in this event's settings.`));
    }

    // 3. Fetch Registration data
    const registration = await Registration.findById(registrationId)
        .populate('category', 'name') // Populate category name
        .populate('event', 'name startDate endDate venue'); // Populate event details (though eventId is already available)

    if (!registration) {
        return next(createApiError(404, 'Registration not found.'));
    }
    if (registration.event._id.toString() !== eventId) {
        return next(createApiError(400, 'Registration does not belong to the specified event.'));
    }
    
    const event = registration.event; // Already populated

    // 4. Fetch contextual data (Abstract, Workshop) if IDs are provided
    let abstractData = null;
    if (abstractId && mongoose.Types.ObjectId.isValid(abstractId)) {
        abstractData = await Abstract.findById(abstractId).populate('registration');
        if (abstractData && abstractData.registration._id.toString() !== registrationId) {
             return next(createApiError(400, 'Abstract does not belong to the specified registration.'));
        }
    } else {
        // --- ADDED: Always fetch the first Abstract for this registration if it exists ---
        abstractData = await Abstract.findOne({ registration: registrationId, event: eventId });
        // No need to check registration match, as it's by query
    }

    let workshopData = null;
    if (workshopId && mongoose.Types.ObjectId.isValid(workshopId)) {
        workshopData = await Workshop.findById(workshopId);
        // Further validation: check if registration is part of this workshop's attendees/registrations
        const isRegisteredForWorkshop = workshopData && 
            (workshopData.registrations.some(rId => rId.toString() === registrationId) || 
             workshopData.attendees.some(att => att.registration.toString() === registrationId));
        if (!isRegisteredForWorkshop) {
            return next(createApiError(400, 'Registration is not associated with the specified workshop.'));
        }
    }

    try {
        // --- PDFKit: Always use A4 landscape (force with array, no layout flag) ---
        const PAGE_WIDTH = 841.89; // A4 landscape width in points
        const PAGE_HEIGHT = 595.28; // A4 landscape height in points
        const doc = new pdfkit({
            size: [PAGE_WIDTH, PAGE_HEIGHT]
            // layout: 'landscape' // REMOVE this line!
        });

        // Pipe the PDF to the response
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="certificate-${registrationId}-${templateId}.pdf"`);
        doc.pipe(res);

        // Add background image, scaled to fit full page, only if requested
        let absoluteBackgroundPath;
        if (drawBackground && template.templateUrl) {
            logger.info(`[generateCertificatePdf] Template URL found: ${template.templateUrl}`);
            logger.info(`[generateCertificatePdf] Current __dirname: ${__dirname}`);
            const serverBasePath = path.join(__dirname, '..', '..');
            logger.info(`[generateCertificatePdf] Calculated server base path: ${serverBasePath}`);

            if (template.templateUrl.startsWith('/')) {
                const relativePathFromPublic = template.templateUrl.substring(1);
                absoluteBackgroundPath = path.join(serverBasePath, 'public', relativePathFromPublic);
                logger.info(`[generateCertificatePdf] Constructed absoluteBackgroundPath (from relative): ${absoluteBackgroundPath}`);
            } else {
                if (!template.templateUrl.startsWith('http')) {
                    absoluteBackgroundPath = path.join(serverBasePath, 'public', template.templateUrl);
                    logger.info(`[generateCertificatePdf] Constructed absoluteBackgroundPath (assumed relative, missing leading '/'): ${absoluteBackgroundPath}`);
                } else {
                    logger.warn(`[generateCertificatePdf] Template URL is an absolute URL: ${template.templateUrl}. Direct file system access not implemented for remote URLs.`);
                    // Handle http/https URLs if necessary (e.g. download to temp file)
                    // For now, this will lead to an error below if not handled.
                }
            }
        }
        const fileExists = drawBackground && absoluteBackgroundPath ? fs.existsSync(absoluteBackgroundPath) : false;
        if (drawBackground) {
        if (!absoluteBackgroundPath || !fileExists) {
            doc.fontSize(12).text(`Error: Certificate template background image not found. Path: ${absoluteBackgroundPath || 'not specified'}. Please contact support.`, 50, 50);
            doc.end();
                return;
        }
        try {
                // Always scale background to full A4 landscape
                doc.image(absoluteBackgroundPath, 0, 0, { width: PAGE_WIDTH, height: PAGE_HEIGHT });
        } catch (bgImgError) {
            logger.error(`[generateCertificatePdf] Error processing background image at ${absoluteBackgroundPath}: ${bgImgError.message}`, { stack: bgImgError.stack });
            doc.fontSize(12).text(`Error: Could not process certificate background image. Path: ${absoluteBackgroundPath}. Details: ${bgImgError.message}. Please contact support.`, 50, 50);
            doc.end();
                return;
            }
        }

        // --- Draw Fields ---
        for (const field of template.fields) {
            if (field.type !== 'text') continue; // Only handle text for now
            doc.save();
            const xPos = convertToPoints(field.position.x, template.templateUnit);
            const yPos = convertToPoints(field.position.y, template.templateUnit);
            const rotation = field.style?.rotation || 0;
            let textContent = field.staticText || '';
            if (field.dataSource && !field.dataSource.toLowerCase().startsWith('static.')) {
                 textContent = await getDataSourceValue(field.dataSource, registration, event, abstractData, workshopData);
            } else if (field.dataSource && field.dataSource.toLowerCase().startsWith('static.')) {
                textContent = field.dataSource.substring('static.'.length);
            }
            // Debug log for each field
            logger.info(`[generateCertificatePdf] Field: ${field.label}, DataSource: ${field.dataSource}, Value: ${textContent}`);
            let fontName = field.style.font || 'Helvetica';
            if (field.style.fontWeight === 'bold' && !fontName.toLowerCase().includes('bold')) {
                if (fontName === 'Helvetica') fontName = 'Helvetica-Bold';
                else if (fontName === 'Times-Roman') fontName = 'Times-Bold';
            }
            try {
                 doc.font(fontName);
            } catch (e) {
                logger.warn(`Failed to set font: ${fontName} for field ${field.label}. Defaulting to Helvetica.`);
                doc.font('Helvetica');
            }
            doc.fontSize(field.style.fontSize || 12);
            doc.fillColor(field.style.color || '#000000');
            const textOptions = {
                align: field.style.align || 'left',
            };
            if (field.style.maxWidth) {
                textOptions.width = convertToPoints(field.style.maxWidth, template.templateUnit);
            }
            if (rotation !== 0) {
                doc.translate(xPos, yPos);
                doc.rotate(rotation);
                doc.text(textContent || '', 0, 0, textOptions);
            } else {
                doc.text(textContent || '', xPos, yPos, textOptions);
            }
            doc.restore();
        }
        // Remove debug info line for production
        // doc.fontSize(8).fillColor('#888888').text(`DEBUG: Page size: ${PAGE_WIDTH}x${PAGE_HEIGHT}pt, forced landscape`, 10, PAGE_HEIGHT - 20);
        doc.end();

    } catch (error) {
        logger.error('Error generating certificate PDF:', error);
        return next(createApiError(500, 'Failed to generate certificate PDF.'));
    }
});

// Utility to convert units to PDF points
function convertToPoints(value, unit = 'pt') {
  if (!value) return 0;
  if (unit === 'pt') return value;
  if (unit === 'mm') return value * 2.83465;
  if (unit === 'cm') return value * 28.3465;
  if (unit === 'in') return value * 72;
  if (unit === 'px') return value * 0.75; // assuming 96dpi
  return value;
}

/**
 * Utility to resolve a data source string (dot notation) from registration, event, abstract, or workshop.
 * Supports composite fields like 'Registration.personalInfo.fullName'.
 * @param {string} dataSource - e.g., 'Registration.personalInfo.firstName', 'Event.name', etc.
 * @param {object} registration - Registration document (populated)
 * @param {object} event - Event document (populated)
 * @param {object|null} abstractData - Abstract document (optional)
 * @param {object|null} workshopData - Workshop document (optional)
 * @returns {Promise<string>} - The resolved value as a string (empty if not found)
 */
async function getDataSourceValue(dataSource, registration, event, abstractData, workshopData) {
  if (!dataSource || typeof dataSource !== 'string') return '';
  try {
    // Support composite fields (e.g., fullName)
    if (dataSource === 'Registration.personalInfo.fullName') {
      const first = registration?.personalInfo?.firstName || '';
      const last = registration?.personalInfo?.lastName || '';
      return `${first} ${last}`.trim();
    }
    if (dataSource === 'Registration.category.name') {
      return registration?.category?.name || '';
    }
    if (dataSource === 'Event.name') {
      return event?.name || '';
    }
    if (dataSource === 'Event.venue.name') {
      return event?.venue?.name || '';
    }
    if (dataSource === 'Event.venue.city') {
      return event?.venue?.city || '';
    }
    if (dataSource === 'Event.startDate') {
      return event?.startDate ? new Date(event.startDate).toLocaleDateString() : '';
    }
    if (dataSource === 'Event.endDate') {
      return event?.endDate ? new Date(event.endDate).toLocaleDateString() : '';
    }
    if (dataSource === 'Abstract.title') {
      return abstractData?.title || '';
    }
    if (dataSource === 'Abstract.authors') {
      return abstractData?.authors || '';
    }
    if (dataSource === 'Abstract.presentingAuthor') {
      return abstractData?.presentingAuthor || '';
    }
    if (dataSource === 'Workshop.name') {
      return workshopData?.name || '';
    }
    // Generic dot notation (e.g., Registration.personalInfo.email)
    let root = null;
    if (dataSource.startsWith('Registration.')) root = registration;
    else if (dataSource.startsWith('Event.')) root = event;
    else if (dataSource.startsWith('Abstract.')) root = abstractData;
    else if (dataSource.startsWith('Workshop.')) root = workshopData;
    if (root) {
      const path = dataSource.split('.').slice(1); // Remove root
      let value = root;
      for (const key of path) {
        if (value && typeof value === 'object' && key in value) value = value[key];
        else return '';
      }
      if (typeof value === 'string' || typeof value === 'number') return String(value);
      if (value instanceof Date) return value.toLocaleDateString();
      return '';
    }
    // Fallback: return empty string
    return '';
  } catch (err) {
    logger.warn(`[getDataSourceValue] Failed to resolve dataSource '${dataSource}': ${err.message}`);
    return '';
  }
}

// Utility: Mirror ResourceSettings to Event document
async function mirrorResourceSettingsToEvent(eventId, type, settings, isEnabled) {
  // Map dbType to event doc field
  let update = {};
  if (type === 'food') {
    update['foodSettings'] = { ...settings, enabled: isEnabled };
  } else if (type === 'kitBag') {
    update['kitSettings'] = { ...settings, enabled: isEnabled };
  } else if (type === 'certificate') {
    update['certificateSettings'] = { ...settings, enabled: isEnabled };
  }
  if (Object.keys(update).length > 0) {
    await Event.findByIdAndUpdate(eventId, { $set: update });
  }
}

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
  exportResourceUsage,
  uploadCertificateTemplateFile,
  generateCertificatePdf: exports.generateCertificatePdf
}; 