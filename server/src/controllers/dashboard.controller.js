const { Dashboard, Event, AnalyticsDataCache } = require('../models');
const { createApiError } = require('../middleware/error');
const httpStatus = require('http-status');
const mongoose = require('mongoose');
const { Registration, Resource, Category } = require('../models');
const { sendSuccess } = require('../utils/responseFormatter');
const asyncHandler = require('express-async-handler');

/**
 * Get the available dashboard widgets
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getDashboardWidgets = async (req, res, next) => {
  try {
    const { eventId } = req.params;
  
    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return next(createApiError(404, 'Event not found'));
    }
  
    // Define available widgets
    const widgets = [
      {
        id: 'registration-summary',
        name: 'Registration Summary',
        description: 'Shows summary statistics for registrations',
        icon: 'users',
        category: 'registration',
        defaultSize: { w: 4, h: 2 }
      },
      {
        id: 'registration-trend',
        name: 'Registration Trend',
        description: 'Shows registration trend over time',
        icon: 'trending-up',
        category: 'registration',
        defaultSize: { w: 8, h: 4 }
      },
      {
        id: 'category-distribution',
        name: 'Category Distribution',
        description: 'Shows distribution of registrations by category',
        icon: 'pie-chart',
        category: 'registration',
        defaultSize: { w: 4, h: 4 }
      },
      {
        id: 'revenue-summary',
        name: 'Revenue Summary',
        description: 'Shows summary of revenue and payments',
        icon: 'dollar-sign',
        category: 'financial',
        defaultSize: { w: 4, h: 2 }
      },
      {
        id: 'revenue-trend',
        name: 'Revenue Trend',
        description: 'Shows revenue trend over time',
        icon: 'bar-chart-2',
        category: 'financial',
        defaultSize: { w: 8, h: 4 }
      },
      {
        id: 'workshops-summary',
        name: 'Workshops Summary',
        description: 'Shows summary of workshop registrations',
        icon: 'calendar',
        category: 'workshop',
        defaultSize: { w: 4, h: 3 }
      },
      {
        id: 'workshop-capacity',
        name: 'Workshop Capacity',
        description: 'Shows workshop registration capacity',
        icon: 'activity',
        category: 'workshop',
        defaultSize: { w: 4, h: 4 }
      },
      {
        id: 'abstracts-summary',
        name: 'Abstracts Summary',
        description: 'Shows summary of abstract submissions',
        icon: 'file-text',
        category: 'abstract',
        defaultSize: { w: 4, h: 2 }
      },
      {
        id: 'abstracts-by-status',
        name: 'Abstracts by Status',
        description: 'Shows distribution of abstracts by review status',
        icon: 'pie-chart',
        category: 'abstract',
        defaultSize: { w: 4, h: 4 }
      },
      {
        id: 'review-progress',
        name: 'Review Progress',
        description: 'Shows progress of abstract reviews',
        icon: 'check-circle',
        category: 'abstract',
        defaultSize: { w: 4, h: 3 }
      },
      {
        id: 'kit-distribution',
        name: 'Kit Distribution',
        description: 'Shows progress of kit bag distribution',
        icon: 'package',
        category: 'resource',
        defaultSize: { w: 4, h: 3 }
      },
      {
        id: 'meal-tracking',
        name: 'Meal Tracking',
        description: 'Shows meal distribution statistics',
        icon: 'coffee',
        category: 'resource',
        defaultSize: { w: 4, h: 3 }
      },
      {
        id: 'recent-activity',
        name: 'Recent Activity',
        description: 'Shows recent activities in the event',
        icon: 'activity',
        category: 'general',
        defaultSize: { w: 4, h: 3 }
      }
    ];
  
    return res.status(200).json({
      success: true,
      message: 'Dashboard widgets retrieved successfully',
      data: widgets
    });
  } catch (error) {
    console.error(`Error in getDashboardWidgets: ${error.message}`);
    return next(createApiError(500, 'Error retrieving dashboard widgets'));
  }
};

/**
 * Get the dashboard layout for a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getDashboard = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const userId = req.user._id;
  
    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return next(createApiError(404, 'Event not found'));
    }
  
    // Find existing dashboard or create a default one
    let dashboard = await Dashboard.findOne({ event: eventId, user: userId });
  
    if (!dashboard) {
      // Create default dashboard layout
      const defaultLayout = [
        { widgetId: 'registration-summary', x: 0, y: 0, w: 4, h: 2, config: {} },
        { widgetId: 'registration-trend', x: 4, y: 0, w: 8, h: 4, config: {} },
        { widgetId: 'category-distribution', x: 0, y: 2, w: 4, h: 4, config: {} },
        { widgetId: 'revenue-summary', x: 0, y: 6, w: 4, h: 2, config: {} },
        { widgetId: 'abstracts-summary', x: 4, y: 6, w: 4, h: 2, config: {} },
        { widgetId: 'workshops-summary', x: 8, y: 6, w: 4, h: 2, config: {} }
      ];
    
      dashboard = await Dashboard.create({
        event: eventId,
        user: userId,
        layout: defaultLayout
      });
    }
  
    return res.status(200).json({
      success: true,
      message: 'Dashboard retrieved successfully',
      data: dashboard
    });
  } catch (error) {
    console.error(`Error in getDashboard: ${error.message}`);
    return next(createApiError(500, 'Error retrieving dashboard'));
  }
};

/**
 * Update the dashboard layout
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateDashboardLayout = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { layout } = req.body;
    const userId = req.user._id;
  
    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return next(createApiError(404, 'Event not found'));
    }
  
    // Find or create dashboard
    let dashboard = await Dashboard.findOne({ event: eventId, user: userId });
  
    if (!dashboard) {
      dashboard = await Dashboard.create({
        event: eventId,
        user: userId,
        layout
      });
    } else {
      // Update existing dashboard
      dashboard.layout = layout;
      dashboard.updatedAt = new Date();
      await dashboard.save();
    }
  
    return res.status(200).json({
      success: true,
      message: 'Dashboard layout updated successfully',
      data: dashboard
    });
  } catch (error) {
    console.error(`Error in updateDashboardLayout: ${error.message}`);
    return next(createApiError(500, 'Error updating dashboard layout'));
  }
};

/**
 * Get cached widget data if available and fresh
 * @param {string} eventId - Event ID
 * @param {string} widgetId - Widget ID
 * @param {Object} params - Additional parameters
 * @param {number} maxAge - Maximum age in minutes
 * @returns {Promise<Object|null>} - Cached data or null
 */
const getCachedWidgetData = async (eventId, widgetId, params = {}, maxAge = 5) => {
  try {
    // Create a cache key that includes the parameters
    const paramString = Object.entries(params)
      .map(([key, value]) => `${key}:${value || 'none'}`)
      .join('-');
    
    const cacheKey = `widget-${widgetId}-${paramString}`;
    
    const cache = await AnalyticsDataCache.findOne({
      event: eventId,
      dataType: cacheKey
    });
    
    if (!cache) return null;
    
    // Check if cache is fresh
    const now = new Date();
    const cacheAge = (now - cache.lastUpdated) / (1000 * 60); // age in minutes
    
    if (cacheAge > maxAge) {
      return null; // Cache is stale
    }
    
    return cache.data;
  } catch (error) {
    console.error(`Error retrieving cached widget data for ${widgetId}:`, error);
    return null;
  }
};

/**
 * Cache widget data for faster retrieval
 * @param {string} eventId - Event ID
 * @param {string} widgetId - Widget ID
 * @param {Object} params - Additional parameters
 * @param {Object} data - Data to cache
 * @returns {Promise<Object>} - Cached data
 */
const cacheWidgetData = async (eventId, widgetId, params = {}, data) => {
  try {
    // Create a cache key that includes the parameters
    const paramString = Object.entries(params)
      .map(([key, value]) => `${key}:${value || 'none'}`)
      .join('-');
    
    const cacheKey = `widget-${widgetId}-${paramString}`;
    
    // Find existing cache or create new one
    let cache = await AnalyticsDataCache.findOne({ 
      event: eventId, 
      dataType: cacheKey
    });
    
    if (cache) {
      // Update existing cache
      cache.data = data;
      cache.lastUpdated = new Date();
      await cache.save();
    } else {
      // Create new cache
      cache = await AnalyticsDataCache.create({
        event: eventId,
        dataType: cacheKey,
        data,
        lastUpdated: new Date()
      });
    }
    
    return cache;
  } catch (error) {
    console.error(`Error caching widget data for ${widgetId}:`, error);
    // If caching fails, just return the original data
    return data;
  }
};

/**
 * Get data for a specific widget
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getWidgetData = async (req, res, next) => {
  try {
    const { eventId, widgetId } = req.params;
    const { range = 'month', startDate, endDate, category, includeSubcategories = false, refresh = 'false' } = req.query;
    
    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return next(createApiError(404, 'Event not found'));
    }
    
    // Check cache first if not forcing refresh
    if (refresh !== 'true') {
      const params = { range, startDate, endDate, category, includeSubcategories };
      const cachedData = await getCachedWidgetData(eventId, widgetId, params);
      
      if (cachedData) {
        return res.status(200).json({
          success: true,
          message: 'Widget data retrieved from cache',
          data: {
            widgetId,
            data: cachedData,
            cached: true,
            filters: {
              range,
              startDate: startDate || null,
              endDate: endDate || null,
              category: category || null,
              includeSubcategories
            }
          }
        });
      }
    }
    
    // Calculate date range if needed
    let dateFilter = {};
    
    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    } else {
      const now = new Date();
      let rangeStart = new Date();
      
      switch (range) {
        case 'day':
          rangeStart.setDate(now.getDate() - 1);
          break;
        case 'week':
          rangeStart.setDate(now.getDate() - 7);
          break;
        case 'month':
          rangeStart.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          rangeStart.setFullYear(now.getFullYear() - 1);
          break;
        case 'all':
          // No date filter for all-time
          break;
        default:
          rangeStart.setMonth(now.getMonth() - 1); // Default to month
      }
      
      if (range !== 'all') {
        dateFilter = {
          createdAt: {
            $gte: rangeStart,
            $lte: now
          }
        };
      }
    }
    
    // Additional filters
    let additionalFilter = {};
    
    if (category) {
      if (includeSubcategories) {
        // Logic for handling subcategories would go here
        // This would require a more complex query depending on your data model
      } else {
        additionalFilter.category = mongoose.Types.ObjectId(category);
      }
    }
    
    // Switch based on widget type
    let data;
    switch (widgetId) {
      case 'registration-summary':
        // Implement registration summary data retrieval
        // This is a simplified example - real implementation would be more complex
        data = {
          totalRegistrations: await mongoose.model('Registration').countDocuments({ 
            event: eventId,
            ...dateFilter,
            ...additionalFilter
          }),
          checkedIn: await mongoose.model('Registration').countDocuments({ 
            event: eventId,
            isCheckedIn: true,
            ...dateFilter,
            ...additionalFilter
          }),
          pending: await mongoose.model('Registration').countDocuments({ 
            event: eventId,
            status: 'pending',
            ...dateFilter,
            ...additionalFilter
          }),
          confirmed: await mongoose.model('Registration').countDocuments({ 
            event: eventId,
            status: 'confirmed',
            ...dateFilter,
            ...additionalFilter
          }),
          cancelled: await mongoose.model('Registration').countDocuments({ 
            event: eventId,
            status: 'cancelled',
            ...dateFilter,
            ...additionalFilter
          })
        };
        break;
        
      // Additional widget cases would be implemented here
      // This is a simplified example
        
      default:
        return next(createApiError(400, `Widget ${widgetId} not found or not supported`));
    }
    
    // Cache the widget data
    const params = { range, startDate, endDate, category, includeSubcategories };
    await cacheWidgetData(eventId, widgetId, params, data);
    
    return res.status(200).json({
      success: true,
      message: 'Widget data retrieved successfully',
      data: {
        widgetId,
        data,
        filters: {
          range,
          startDate: startDate || null,
          endDate: endDate || null,
          category: category || null,
          includeSubcategories
        }
      }
    });
  } catch (error) {
    console.error(`Error in getWidgetData: ${error.message}`);
    return next(createApiError(500, `Error retrieving widget data: ${error.message}`));
  }
};

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

module.exports = {
  getDashboardWidgets,
  getDashboard,
  updateDashboardLayout,
  getWidgetData,
  getEventDashboard
}; 