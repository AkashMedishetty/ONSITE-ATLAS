const { 
  AnalyticsDataCache, 
  Event, 
  Registration, 
  Payment, 
  Workshop, 
  Abstract 
} = require('../models');
const { ApiError } = require('../utils/ApiError');
const httpStatus = require('http-status');
const mongoose = require('mongoose');

/**
 * Cache analytics data for faster retrieval
 * @param {string} eventId - Event ID
 * @param {string} dataType - Data type
 * @param {Object} data - Data to cache
 * @returns {Promise<Object>} - Cached data
 */
const cacheAnalyticsData = async (eventId, dataType, data) => {
  try {
    // Find existing cache or create new one
    let cache = await AnalyticsDataCache.findOne({ 
      event: eventId, 
      dataType 
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
        dataType,
        data,
        lastUpdated: new Date()
      });
    }
    
    return cache;
  } catch (error) {
    console.error(`Error caching ${dataType} analytics:`, error);
    // If caching fails, just return the original data
    return data;
  }
};

/**
 * Get cached analytics data if available and fresh
 * @param {string} eventId - Event ID
 * @param {string} dataType - Data type
 * @param {number} maxAge - Maximum age in minutes
 * @returns {Promise<Object|null>} - Cached data or null
 */
const getCachedAnalyticsData = async (eventId, dataType, maxAge = 15) => {
  try {
    const cache = await AnalyticsDataCache.findOne({
      event: eventId,
      dataType
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
    console.error(`Error retrieving cached ${dataType} analytics:`, error);
    return null;
  }
};

/**
 * Get registration analytics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getRegistrationAnalytics = async (req, res) => {
  const { eventId } = req.params;
  const { range = 'month', startDate, endDate, category, refresh = 'false' } = req.query;
  
  // Check if event exists
  const event = await Event.findById(eventId);
  if (!event) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Event not found');
  }
  
  // Check cache first if not forcing refresh
  if (refresh !== 'true') {
    const cacheKey = `registration-${range}-${startDate || 'none'}-${endDate || 'none'}-${category || 'all'}`;
    const cachedData = await getCachedAnalyticsData(eventId, cacheKey);
    
    if (cachedData) {
      return res.status(httpStatus.OK).json({
        ...cachedData,
        cached: true
      });
    }
  }
  
  // Generate date filter
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
  
  // Base filter
  const filter = {
    event: eventId,
    ...dateFilter
  };
  
  // Add category filter if provided
  if (category) {
    filter.category = mongoose.Types.ObjectId(category);
  }
  
  // Calculate statistics
  const totalRegistrations = await Registration.countDocuments(filter);
  const checkedIn = await Registration.countDocuments({ ...filter, isCheckedIn: true });
  const statusCounts = await Registration.aggregate([
    { $match: filter },
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);
  
  // Convert status counts to object
  const statusCountsObj = statusCounts.reduce((acc, curr) => {
    acc[curr._id] = curr.count;
    return acc;
  }, {});
  
  // Prepare response data
  const data = {
    summary: {
      totalRegistrations,
      checkedIn,
      statuses: statusCountsObj
    },
    filters: {
      dateRange: dateFilter.createdAt || 'all',
      category: category || 'all'
    }
  };
  
  // Cache the data
  const cacheKey = `registration-${range}-${startDate || 'none'}-${endDate || 'none'}-${category || 'all'}`;
  await cacheAnalyticsData(eventId, cacheKey, data);
  
  res.status(httpStatus.OK).json(data);
};

/**
 * Get financial analytics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getFinancialAnalytics = async (req, res) => {
  const { eventId } = req.params;
  const { range = 'month', startDate, endDate, currency, refresh = 'false' } = req.query;
  
  // Check if event exists
  const event = await Event.findById(eventId);
  if (!event) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Event not found');
  }
  
  // Only allow financial data to be accessed by admin or manager
  if (req.user.role !== 'admin' && req.user.role !== 'manager') {
    throw new ApiError(httpStatus.FORBIDDEN, 'You do not have permission to access financial data');
  }
  
  // Check cache first if not forcing refresh
  if (refresh !== 'true') {
    const cacheKey = `financial-${range}-${startDate || 'none'}-${endDate || 'none'}-${currency || 'all'}`;
    const cachedData = await getCachedAnalyticsData(eventId, cacheKey, 5); // 5-minute cache for financial data
    
    if (cachedData) {
      return res.status(httpStatus.OK).json({
        ...cachedData,
        cached: true
      });
    }
  }
  
  // Generate date filter
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
  
  // Base filter
  const filter = {
    event: eventId,
    ...dateFilter
  };
  
  // Add currency filter if provided
  if (currency) {
    filter.currency = currency;
  }
  
  // Calculate statistics
  const payments = await Payment.find(filter).lean();
  
  const totalAmount = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
  const completedAmount = payments
    .filter(p => p.status === 'completed')
    .reduce((sum, payment) => sum + (payment.amount || 0), 0);
  const pendingAmount = payments
    .filter(p => p.status === 'pending')
    .reduce((sum, payment) => sum + (payment.amount || 0), 0);
  
  // Prepare response data
  const data = {
    summary: {
      totalAmount,
      completedAmount,
      pendingAmount,
      currency: currency || (payments.length > 0 ? payments[0].currency : 'USD')
    },
    filters: {
      dateRange: dateFilter.createdAt || 'all',
      currency: currency || 'all'
    }
  };
  
  // Cache the data
  const cacheKey = `financial-${range}-${startDate || 'none'}-${endDate || 'none'}-${currency || 'all'}`;
  await cacheAnalyticsData(eventId, cacheKey, data);
  
  res.status(httpStatus.OK).json(data);
};

/**
 * Get workshop analytics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getWorkshopAnalytics = async (req, res) => {
  const { eventId } = req.params;
  const { refresh = 'false' } = req.query;
  
  // Check if event exists
  const event = await Event.findById(eventId);
  if (!event) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Event not found');
  }
  
  // Check cache first if not forcing refresh
  if (refresh !== 'true') {
    const cachedData = await getCachedAnalyticsData(eventId, 'workshop', 10); // 10-minute cache for workshop data
    
    if (cachedData) {
      return res.status(httpStatus.OK).json({
        ...cachedData,
        cached: true
      });
    }
  }
  
  // Simplified workshop analytics
  const workshops = await Workshop.find({ event: eventId }).lean();
  
  const workshopStats = workshops.map(workshop => ({
    id: workshop._id,
    title: workshop.title,
    capacity: workshop.capacity,
    registered: (workshop.registrations || []).length,
    availableSeats: workshop.capacity - (workshop.registrations || []).length,
    startDateTime: workshop.startDateTime
  }));
  
  const data = {
    summary: {
      totalWorkshops: workshops.length,
      totalCapacity: workshops.reduce((sum, w) => sum + (w.capacity || 0), 0),
      totalRegistered: workshops.reduce((sum, w) => sum + ((w.registrations || []).length), 0)
    },
    workshops: workshopStats
  };
  
  // Cache the data
  await cacheAnalyticsData(eventId, 'workshop', data);
  
  res.status(httpStatus.OK).json(data);
};

/**
 * Get abstract analytics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAbstractAnalytics = async (req, res) => {
  const { eventId } = req.params;
  const { refresh = 'false' } = req.query;
  
  // Check if event exists
  const event = await Event.findById(eventId);
  if (!event) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Event not found');
  }
  
  // Check cache first if not forcing refresh
  if (refresh !== 'true') {
    const cachedData = await getCachedAnalyticsData(eventId, 'abstract', 15); // 15-minute cache for abstract data
    
    if (cachedData) {
      return res.status(httpStatus.OK).json({
        ...cachedData,
        cached: true
      });
    }
  }
  
  // Simplified abstract analytics
  const abstracts = await Abstract.find({ event: eventId }).lean();
  
  // Count abstracts by status
  const statusCounts = abstracts.reduce((acc, abstract) => {
    const status = abstract.reviewDetails?.finalDecision || 'pending';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});
  
  const data = {
    summary: {
      totalAbstracts: abstracts.length,
      byStatus: statusCounts
    }
  };
  
  // Cache the data
  await cacheAnalyticsData(eventId, 'abstract', data);
  
  res.status(httpStatus.OK).json(data);
};

/**
 * Get sponsor analytics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getSponsorAnalytics = async (req, res) => {
  // Placeholder for sponsor analytics
  res.status(httpStatus.OK).json({
    message: 'Sponsor analytics will be implemented in the next phase'
  });
};

/**
 * Export analytics data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const exportAnalyticsData = async (req, res) => {
  // Placeholder for export functionality
  res.status(httpStatus.OK).json({
    message: 'Export analytics data will be implemented in the next phase'
  });
};

module.exports = {
  getRegistrationAnalytics,
  getFinancialAnalytics,
  getWorkshopAnalytics,
  getAbstractAnalytics,
  getSponsorAnalytics,
  exportAnalyticsData
}; 