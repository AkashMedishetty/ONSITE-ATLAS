const { Event, Category, Registration, Resource } = require('../models');
const { createApiError } = require('../middleware/error');
const logger = require('../utils/logger');
const { sendSuccess, sendPaginated } = require('../utils/responseFormatter');
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const User = require('../models/User'); // Import User model

/**
 * Get all events with pagination
 * @route GET /api/events
 * @access Private
 */
const getEvents = asyncHandler(async (req, res) => {
  // Extract query parameters
  const { page = 1, limit = 10, status } = req.query;
  
  // Build filter object
  const filter = {};
  
  if (status) filter.status = status;
  
  // Calculate pagination
  const skip = (page - 1) * limit;
  
  // Execute query with pagination
  const events = await Event.find(filter)
    .skip(skip)
    .limit(parseInt(limit))
    .sort({ createdAt: -1 });
  
  // Get total count for pagination
  const total = await Event.countDocuments(filter);
  
  // Use sendPaginated utility for consistent response format
  return sendPaginated(
    res, 
    200, 
    'Events retrieved successfully',
    events,
    parseInt(page),
    parseInt(limit),
    total
  );
});

/**
 * Get event by ID
 * @route GET /api/events/:id
 * @access Private
 */
const getEventById = asyncHandler(async (req, res) => {
  try {
    const eventId = req.params.id;
    
    // Log the request for debugging
    console.log(`Fetching event with ID: ${eventId}`);
    
    // Validate MongoDB ObjectID format
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return sendSuccess(res, 400, 'Invalid event ID format');
    }
    
    const event = await Event.findById(eventId);
    
    if (!event) {
      return sendSuccess(res, 404, 'Event not found');
    }
    
    return sendSuccess(res, 200, 'Event retrieved successfully', event);
  } catch (error) {
    console.error(`Error in getEventById: ${error.message}`);
    return sendSuccess(res, 500, 'Server error while fetching event', null, { error: error.message });
  }
});

/**
 * Create new event
 * @route POST /api/events
 * @access Private
 */
const createEvent = asyncHandler(async (req, res) => {
  // Log the request body for debugging
  console.log('Creating new event with data:', req.body);
  logger.info(`Creating new event: ${JSON.stringify(req.body)}`);

  try {
    // Ensure venue data is properly structured
    const venueData = req.body.venue || {};
    const venue = {
      name: venueData.name || '',
      address: venueData.address || '',
      city: venueData.city || '',
      state: venueData.state || '',
      country: venueData.country || '',
      zipCode: venueData.zipCode || ''
    };

    // Prepare the event data
    const eventData = {
      ...req.body,
      venue,
      createdBy: req.user._id,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Create the event
    const event = await Event.create(eventData);

    return sendSuccess(res, 201, 'Event created successfully', event);
  } catch (error) {
    console.error(`Error in createEvent: ${error.message}`);
    return sendSuccess(res, 500, 'Failed to create event', null, { error: error.message });
  }
});

/**
 * Update event
 * @route PUT /api/events/:id
 * @access Private
 */
const updateEvent = asyncHandler(async (req, res) => {
  const eventId = req.params.id;
  console.log(`Updating event ${eventId} with data:`, req.body);

  try {
    // Validate MongoDB ObjectID format
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return sendSuccess(res, 400, 'Invalid event ID format');
    }

    // Ensure venue data is properly structured if provided
    let updateData = { ...req.body };
    if (req.body.venue) {
      const venueData = req.body.venue;
      updateData.venue = {
        name: venueData.name || '',
        address: venueData.address || '',
        city: venueData.city || '',
        state: venueData.state || '',
        country: venueData.country || '',
        zipCode: venueData.zipCode || ''
      };
    }

    // Add updated timestamp
    updateData.updatedAt = new Date();

    // Find and update the event
    const event = await Event.findByIdAndUpdate(
      eventId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!event) {
      return sendSuccess(res, 404, 'Event not found');
    }

    return sendSuccess(res, 200, 'Event updated successfully', event);
  } catch (error) {
    console.error(`Error in updateEvent: ${error.message}`);
    return sendSuccess(res, 500, 'Failed to update event', null, { error: error.message });
  }
});

/**
 * Delete event
 * @route DELETE /api/events/:id
 * @access Private
 */
const deleteEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  
  if (!event) {
    return sendSuccess(res, 404, 'Event not found');
  }
  
  // Soft delete by changing status
  event.status = 'archived';
  event.updatedAt = new Date();
  await event.save();
  
  return sendSuccess(res, 200, 'Event deleted successfully');
});

/**
 * Get event dashboard data
 * @route GET /api/events/:id/dashboard
 * @access Private
 */
const getEventDashboard = asyncHandler(async (req, res) => {
  try {
    const eventId = req.params.id;
    console.log(`Fetching dashboard for event ID: ${eventId}`);
    
    // Define default dashboard data
    const defaultDashboardData = {
      event: { 
        name: 'Unknown Event', 
        startDate: new Date(), 
        endDate: new Date() 
      },
      stats: {
        registrationsCount: 0,
        checkedInCount: 0,
        resourcesCount: 0,
        checkInRate: 0
      }
    };
    
    // Validate MongoDB ObjectID format
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      console.log('Invalid ObjectID format');
      return res.status(200).json({
        success: true,
        message: 'Dashboard data (invalid ID format)',
        data: defaultDashboardData
      });
    }
    
    // Get event safely
    let event = null;
    try {
      event = await Event.findById(eventId);
    } catch (findError) {
      console.error(`Error finding event: ${findError.message}`);
    }
    
    if (!event) {
      console.log(`Event not found: ${eventId}`);
      return res.status(200).json({
        success: true,
        message: 'Dashboard data (event not found)',
        data: defaultDashboardData
      });
    }
    
    // Get counts safely
    let stats = {
      registrationsCount: 0,
      checkedInCount: 0,
      resourcesCount: 0,
      checkInRate: 0
    };
    
    try {
      // Get registrations count
      stats.registrationsCount = await Registration.countDocuments({ event: eventId });
      
      // Get checked-in count
      stats.checkedInCount = await Registration.countDocuments({
        event: eventId,
        'checkIn.isCheckedIn': true
      });
      
      // Get resources count
      stats.resourcesCount = await Resource.countDocuments({ event: eventId });
      
      // Calculate check-in rate
      stats.checkInRate = stats.registrationsCount > 0
        ? Math.round((stats.checkedInCount / stats.registrationsCount) * 100)
        : 0;
    } catch (countError) {
      console.error(`Error getting counts: ${countError.message}`);
      // Stats will keep default values of 0
    }
    
    const dashboardData = {
      event,
      stats
    };
    
    return res.status(200).json({
      success: true,
      message: 'Dashboard data retrieved successfully',
      data: dashboardData
    });
  } catch (error) {
    console.error(`Error in getEventDashboard: ${error.message}`);
    console.error(error.stack);
    
    // Return default data on error
    return res.status(200).json({
      success: true,
      message: 'Error fetching dashboard, returning default data',
      data: {
        event: { name: 'Unknown Event', startDate: new Date(), endDate: new Date() },
        stats: {
          registrationsCount: 0,
          checkedInCount: 0,
          resourcesCount: 0,
          checkInRate: 0
        }
      }
    });
  }
});

/**
 * Get event statistics using Aggregation Pipelines
 * @route GET /api/events/:id/statistics
 * @access Private
 */
const getEventStatistics = asyncHandler(async (req, res) => {
  try {
    const eventId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      // Return consistent default structure on bad ID
      return sendSuccess(res, 400, 'Invalid Event ID format', {
        registrations: { total: 0, checkedIn: 0, byDay: [], byCategory: {} },
        resources: { food: { total: 0 }, kitBags: { total: 0 }, certificates: { total: 0 } }
      });
    }
    const eventObjectId = new mongoose.Types.ObjectId(eventId);

    // Optional: Check if event exists first to potentially return faster
    const eventExists = await Event.findById(eventObjectId).select('_id').lean();
    if (!eventExists) {
      return sendSuccess(res, 200, 'Event statistics (event not found)', {
         registrations: { total: 0, checkedIn: 0, byDay: [], byCategory: {} },
         resources: { food: { total: 0 }, kitBags: { total: 0 }, certificates: { total: 0 } }
      });
    }

    // --- Registration Aggregation ---
    const registrationStatsPipeline = [
      { $match: { event: eventObjectId } },
      {
        $group: {
          _id: '$category', // Group by category ID first
          totalInCategory: { $sum: 1 },
          checkedInInCategory: {
            $sum: { $cond: ['$checkIn.isCheckedIn', 1, 0] }
          },
          // Collect check-in dates within each category group
          checkInDates: {
             $push: {
               $cond: [
                 { $and: ['$checkIn.isCheckedIn', '$checkIn.checkedInAt'] },
                 { $dateToString: { format: '%Y-%m-%d', date: '$checkIn.checkedInAt' } },
                 '$$REMOVE'
               ]
             }
          }
        }
      },
      // Lookup Category Details
      {
        $lookup: {
          from: 'categories',
          localField: '_id', // Category ID from grouping
          foreignField: '_id',
          as: 'categoryDetails'
        }
      },
      {
        $unwind: { path: '$categoryDetails', preserveNullAndEmptyArrays: true } // Keep results even if category doc is missing
      },
      // Group again to consolidate overall totals and daily check-ins across categories
      {
         $group: {
             _id: null, // Group all documents together
             totalRegistrations: { $sum: '$totalInCategory' },
             totalCheckedIn: { $sum: '$checkedInInCategory' },
             // Collect stats per category
             categoriesData: {
                 $push: {
                     name: { $ifNull: ['$categoryDetails.name', 'Uncategorized'] },
                     count: '$totalInCategory'
                 }
             },
             // Flatten all check-in dates into a single array
             allCheckInDates: { $push: '$checkInDates' }
         }
      },
      // Further processing needed in JS for daily counts
      {
        $project: {
          _id: 0, // Exclude the default _id
          totalRegistrations: 1,
          totalCheckedIn: 1,
          categoriesData: 1,
          // Flatten the array of arrays of dates
          allCheckInDates: {
             $reduce: {
                input: "$allCheckInDates",
                initialValue: [],
                in: { $concatArrays: ["$$value", "$$this"] }
             }
          }
        }
      }
    ];

    const registrationAggResult = await Registration.aggregate(registrationStatsPipeline);
    const regStats = registrationAggResult[0] || { totalRegistrations: 0, totalCheckedIn: 0, categoriesData: [], allCheckInDates: [] }; // Default if no registrations

    // --- Process Aggregated Registration Stats ---
    const categoryCounts = {};
    regStats.categoriesData.forEach(cat => {
      categoryCounts[cat.name] = cat.count;
    });

    const combinedCheckInsByDay = {};
    regStats.allCheckInDates.forEach(day => {
      if (day) { // Ensure day is not null/undefined
        combinedCheckInsByDay[day] = (combinedCheckInsByDay[day] || 0) + 1;
      }
    });

    // --- Resource Aggregation ---
    const resourceStatsPipeline = [
       // Ensure we only match documents with a non-null and valid resourceType
       { 
         $match: { 
           event: eventObjectId, 
           void: { $ne: true },
           resourceType: { $ne: null, $in: ['food', 'kitBag', 'certificate'] } // Add check for non-null and known types
         } 
       },
       {
          $group: {
             _id: '$resourceType', // Group by food, kitBag, certificate
             count: { $sum: 1 }
          }
       },
       { // Reshape the output
          $group: {
             _id: null,
             stats: { $push: { k: '$_id', v: '$count' } }
          }
       },
       {
          $replaceRoot: { newRoot: { $arrayToObject: '$stats' } }
       }
    ];

    const resourceAggResult = await Resource.aggregate(resourceStatsPipeline);
    const resourceCounts = resourceAggResult[0] || {}; // Result is { food: X, kitBag: Y, certificate: Z }

    // --- Assemble Final Response ---
    const responseData = {
      registrations: {
        total: regStats.totalRegistrations,
        checkedIn: regStats.totalCheckedIn,
        byDay: Object.entries(combinedCheckInsByDay).map(([date, count]) => ({ date, count })).sort((a, b) => a.date.localeCompare(b.date)), // Sort by date
        byCategory: categoryCounts
      },
      resources: { // Structure matches frontend expectation? Check EventPortal.jsx if needed
        food: { total: resourceCounts.food || 0 },
        kitBags: { total: resourceCounts.kitBag || 0 }, // Ensure key matches frontend if different
        certificates: { total: resourceCounts.certificate || 0 }
      }
    };
    
    return sendSuccess(res, 200, 'Event statistics retrieved successfully', responseData);

  } catch (error) {
    console.error(`Error in getEventStatistics: ${error.message}`);
    console.error(error.stack); // Log stack for detailed debugging
    // Return consistent default structure on error
    return sendSuccess(res, 500, 'Failed to fetch event statistics', {
        registrations: { total: 0, checkedIn: 0, byDay: [], byCategory: {} },
        resources: { food: { total: 0 }, kitBags: { total: 0 }, certificates: { total: 0 } }
    }, { error: error.message });
  }
});

/**
 * @desc    Get registration counts by category for an event
 * @route   GET /api/events/:eventId/registrations/counts-by-category
 * @access  Private
 */
// Define as const first
const getRegistrationCountsByCategory = asyncHandler(async (req, res, next) => {
  const { eventId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(eventId)) {
    return next(createApiError(400, 'Invalid Event ID format'));
  }

  try {
    const counts = await Registration.aggregate([
      {
        $match: { event: new mongoose.Types.ObjectId(eventId) }
      },
      {
        $group: {
          _id: '$category', // Group by category ID
          count: { $sum: 1 } // Count registrations in each group
        }
      },
      {
        $lookup: {
          from: 'categories', // Join with the categories collection
          localField: '_id',
          foreignField: '_id',
          as: 'categoryDetails'
        }
      },
      {
        $unwind: {
          path: '$categoryDetails',
          preserveNullAndEmptyArrays: true // Keep groups even if category is deleted/not found
        }
      },
      {
        $project: {
          _id: 0,
          categoryId: '$_id',
          categoryName: { $ifNull: ['$categoryDetails.name', 'Uncategorized'] }, // Use name or 'Uncategorized'
          count: 1
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: counts
    });

  } catch (error) {
    console.error(`Error getting registration counts by category for event ${eventId}:`, error);
    next(createApiError(500, 'Server error while fetching registration counts'));
  }
});

/**
 * @desc    Get badge settings for an event
 * @route   GET /api/events/:id/badge-settings
 * @access  Private
 */
const getBadgeSettings = asyncHandler(async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    
    const badgeSettings = event.badgeSettings || {
      orientation: 'portrait',
      fields: [] 
    };

    return res.status(200).json({ 
      success: true, 
      data: badgeSettings 
    });
  } catch (error) {
    console.error('Error fetching badge settings:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch badge settings' });
  }
});

const updateBadgeSettings = asyncHandler(async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { badgeSettings: req.body },
      { new: true, runValidators: true }
    );
    
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    
    return res.status(200).json({ 
      success: true, 
      message: 'Badge settings updated', 
      data: event.badgeSettings 
    });
  } catch (error) {
    console.error('Error updating badge settings:', error);
    return res.status(500).json({ success: false, message: 'Failed to update badge settings' });
  }
});

/**
 * @desc    Get configured resource names for an event
 * @route   GET /api/events/:id/resource-config
 * @access  Private
 */
const getResourceConfig = asyncHandler(async (req, res) => {
  const eventId = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(eventId)) {
    return sendSuccess(res, 400, 'Invalid event ID format');
  }

  // Fetch event, selecting only resourceSettings
  const event = await Event.findById(eventId).select('resourceSettings').lean();

  if (!event || !event.resourceSettings) {
    // Return empty config if event or settings not found
    return sendSuccess(res, 200, 'Resource configuration not found or empty', { 
      meals: [], 
      kitItems: [], 
      certificates: [] 
    });
  }

  // Extract and format the configuration
  const config = {
    meals: event.resourceSettings.food?.items?.map(item => ({ id: item._id.toString(), name: item.name })) || [],
    kitItems: event.resourceSettings.kits?.items?.map(item => ({ id: item._id.toString(), name: item.name })) || [],
    certificates: event.resourceSettings.certificates?.types?.map(item => ({ id: item._id.toString(), name: item.name })) || [],
  };

  return sendSuccess(res, 200, 'Resource configuration retrieved successfully', config);
});

/**
 * Get event resource configurations
 * @route GET /api/events/:id/resource-config
 * @access Private
 */
const getEventResourceConfig = asyncHandler(async (req, res, next) => {
  const eventId = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(eventId)) {
    return sendSuccess(res, 400, 'Invalid Event ID format');
  }

  const event = await Event.findById(eventId)
    .select('name foodSettings kitSettings certificateSettings');

  if (!event) {
    return sendSuccess(res, 404, 'Event not found');
  }

  const resourceConfig = {
    eventName: event.name,
    foodSettings: event.foodSettings || { enabled: false, meals: [], days: [] },
    kitSettings: event.kitSettings || { enabled: false, items: [] },
    certificateSettings: event.certificateSettings || { enabled: false, types: [] },
  };

  return sendSuccess(res, 200, 'Resource configuration retrieved successfully', resourceConfig);
});

// Abstract Settings
const getAbstractSettings = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`Getting abstract settings for event ${id}`);
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Event ID is required'
      });
    }
    
    // Find the event
    const event = await Event.findById(id);
    
    if (!event) {
      console.log(`Event not found with ID: ${id}`);
      return res.status(404).json({
        success: false,
        message: `Event not found with ID: ${id}`
      });
    }
    
    console.log('Retrieved abstract settings:', JSON.stringify(event.abstractSettings || {}));
    
    return res.status(200).json({
      success: true,
      message: 'Abstract settings retrieved successfully',
      data: event.abstractSettings || {}
    });
  } catch (error) {
    console.error(`Error retrieving abstract settings: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving abstract settings',
      error: error.message
    });
  }
});

const updateAbstractSettings = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { settings } = req.body;
    
    console.log(`Updating abstract settings for event ${id}`);
    console.log('New settings:', JSON.stringify(settings));
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Event ID is required'
      });
    }
    
    if (!settings) {
      return res.status(400).json({
        success: false, 
        message: 'Abstract settings are required'
      });
    }
    
    // Find the event first to check if it exists
    const existingEvent = await Event.findById(id);
    
    if (!existingEvent) {
      console.log(`Event not found with ID: ${id}`);
      return res.status(404).json({
        success: false,
        message: `Event not found with ID: ${id}`
      });
    }
    
    console.log('Current abstract settings before update:', JSON.stringify(existingEvent.abstractSettings || {}));
    
    // Update the event with the new abstract settings
    const event = await Event.findByIdAndUpdate(
      id,
      { $set: { abstractSettings: settings } },
      { new: true, runValidators: true }
    );
    
    if (!event) {
      console.log(`Failed to update event with ID: ${id}`);
      return res.status(500).json({
        success: false,
        message: `Failed to update event with ID: ${id}`
      });
    }
    
    console.log('Updated abstract settings:', JSON.stringify(event.abstractSettings));
    
    // Save the event to ensure the changes are persisted
    await event.save();
    
    console.log('Event saved successfully with updated abstract settings');
    
    return res.status(200).json({
      success: true,
      message: 'Abstract settings updated successfully',
      data: event.abstractSettings
    });
  } catch (error) {
    console.error(`Error updating abstract settings: ${error.message}`);
    console.error(error.stack);
    return res.status(500).json({
      success: false,
      message: 'Error updating abstract settings',
      error: error.message
    });
  }
});

// Email Settings
const getEmailSettings = asyncHandler(async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).select('emailSettings');
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    return res.status(200).json({ 
      success: true, 
      data: event.emailSettings || {} 
    });
  } catch (error) {
    console.error('Error fetching email settings:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch email settings' });
  }
});

const updateEmailSettings = asyncHandler(async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { emailSettings: req.body },
      { new: true, runValidators: true }
    ).select('emailSettings');
    
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    return res.status(200).json({ 
      success: true, 
      message: 'Email settings updated', 
      data: event.emailSettings 
    });
  } catch (error) {
    console.error('Error updating email settings:', error);
    return res.status(500).json({ success: false, message: 'Failed to update email settings' });
  }
});

// Portal Settings
const getPortalSettings = asyncHandler(async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).select('portalSettings');
    if (!event) {
      return sendSuccess(res, 404, 'Event not found'); // Using sendSuccess for consistency
    }
    const settings = event.portalSettings || {}; 
    return sendSuccess(res, 200, 'Portal settings retrieved', settings);
  } catch (error) {
    console.error(`Error fetching portal settings for event ${req.params.id}:`, error);
    return createApiError(500, 'Failed to retrieve portal settings'); // Using createApiError for consistency
  }
});

const updatePortalSettings = asyncHandler(async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { $set: { portalSettings: req.body } },
      { new: true, runValidators: true }
    ).select('portalSettings');

    if (!event) {
      return sendSuccess(res, 404, 'Event not found');
    }
    return sendSuccess(res, 200, 'Portal settings updated', event.portalSettings);
  } catch (error) {
    console.error(`Error updating portal settings: ${error.message}`);
    return createApiError(500, 'Failed to update portal settings');
  }
});

/**
 * @desc    Get list of potential reviewers (users with role 'reviewer')
 * @route   GET /api/events/:eventId/abstract-workflow/reviewers
 * @access  Protected (Admin/Staff)
 */
const getEventReviewers = asyncHandler(async (req, res, next) => {
  // const { eventId } = req.params; // EventId might be used later for event-specific reviewers

  // For now, fetch all users with the 'reviewer' role
  // Add .select('name email _id') if you only need these fields
  const reviewers = await User.find({ role: 'reviewer' }).select('name email');

  if (!reviewers) {
    // This case is unlikely if User.find just returns an empty array
    return next(createApiError('No reviewers found', 404));
  }

  sendSuccess(res, 200, 'Reviewers retrieved successfully', reviewers);
});

module.exports = {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  getEventDashboard,
  getEventStatistics,
  getRegistrationCountsByCategory,
  getBadgeSettings,
  getResourceConfig,
  getEventResourceConfig,
  getAbstractSettings,
  updateAbstractSettings,
  getBadgeSettings,
  updateBadgeSettings,
  getEmailSettings,
  updateEmailSettings,
  getPortalSettings,
  updatePortalSettings,
  getEventReviewers
}; 