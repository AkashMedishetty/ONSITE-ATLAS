import { baseURL, fetchWithAuth, handleApiResponse } from './apiService';
import axios from 'axios';

// Helper function to format event data consistently
const formatEventData = (event) => {
  if (!event) return null;
  
  // Ensure all required structures exist
  return {
    ...event,
    name: event.name || 'Unnamed Event',
    status: event.status || 'Draft',
    startDate: event.startDate || null,
    endDate: event.endDate || null,
    registrationSettings: event.registrationSettings || { 
      idPrefix: 'REG', 
      enabled: false,
      fields: []
    },
    abstractSettings: event.abstractSettings || {
      enabled: false,
      isOpen: false,
      deadline: null,
      maxLength: 500,
      allowEditing: false,
      guidelines: '',
      categories: [],
      notifyOnSubmission: false,
      allowFiles: false,
      maxFileSize: 5
    },
    resourceSettings: event.resourceSettings || {
      food: { enabled: false, items: [] },
      kits: { enabled: false, items: [] },
      certificates: { enabled: false, types: [] }
    },
    emailSettings: event.emailSettings || {
      enabled: false,
      templates: []
    },
    badgeSettings: event.badgeSettings || {
      orientation: 'portrait',
      size: { width: 3.5, height: 5 },
      unit: 'in',
      showLogo: true,
      logoPosition: 'top',
      showQR: true,
      qrPosition: 'bottom',
      fields: {
        name: true,
        organization: true,
        registrationId: true,
        category: true,
        country: true,
        qrCode: true
      },
      fieldConfig: {
        name: {
          fontSize: 18,
          fontWeight: 'bold',
          position: { top: 40, left: 50 }
        },
        organization: {
          fontSize: 14,
          fontWeight: 'normal',
          position: { top: 65, left: 50 }
        },
        registrationId: {
          fontSize: 12,
          fontWeight: 'normal',
          position: { top: 85, left: 50 }
        },
        category: {
          fontSize: 12,
          fontWeight: 'normal',
          position: { top: 105, left: 50 }
        },
        country: {
          fontSize: 12,
          fontWeight: 'normal',
          position: { top: 240, left: 50 }
        },
        qrCode: {
          size: 100,
          position: { top: 135, left: 100 }
        }
      },
      colors: {
        background: '#FFFFFF',
        text: '#000000',
        accent: '#3B82F6',
        borderColor: '#CCCCCC'
      }
    },
    portalUrls: event.portalUrls || {}
  };
};

// Create a new event
const createEvent = async (eventData) => {
  try {
    const response = await axios.post(`${baseURL}/events`, eventData, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await handleApiResponse(response);
    return formatEventData(data.event);
  } catch (error) {
    console.error('Error creating event:', error);
    return { 
      success: false, 
      message: error.response?.data?.message || 'Failed to create event'
    };
  }
};

// Fetch all events
const fetchEvents = async (params = {}) => {
  try {
    // Build query string from params
    const queryString = Object.keys(params)
      .filter(key => params[key] !== undefined && params[key] !== null)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
      .join('&');
    
    const url = queryString ? `${baseURL}/events?${queryString}` : `${baseURL}/events`;
    
    const response = await axios.get(url);
    const data = await handleApiResponse(response);
    
    // Handle different API response formats
    if (data && Array.isArray(data)) {
      return data;
    } else if (data && data.events && Array.isArray(data.events)) {
      return {
        success: true,
        data: data.events.map(formatEventData),
        total: data.total || data.events.length
      };
    } else if (data && Array.isArray(data.data)) {
      return {
        success: true,
        data: data.data.map(formatEventData),
        total: data.total || data.data.length
      };
    } else {
      // Return whatever we got as a successful response
      return {
        success: true,
        data: data || [],
        total: (data && data.total) || 0
      };
    }
  } catch (error) {
    console.error('Error fetching events:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to fetch events',
      data: [],
      total: 0
    };
  }
};

// Alias for backward compatibility
const getEvents = fetchEvents;

// Fetch a single event by ID
const getEventById = async (id) => {
  if (!id) {
    console.error('getEventById called without an ID');
    throw new Error('Event ID is required');
  }
  
  try {
    const response = await axios.get(`${baseURL}/events/${id}`);
    const result = await handleApiResponse(response);
    
    // Handle the standardized response format from sendSuccess utility
    let eventData;
    
    if (result && result.success === true && result.data) {
      // The data property contains the event object
      eventData = result.data;
    } else if (result && result.data) {
      // Legacy format, the event is directly in the data property
      eventData = result.data;
    } else if (result) {
      // The result itself is the event (old format)
      eventData = result;
    } else {
      // No data found
      return {
        success: false,
        message: 'No event data found'
      };
    }
    
    // Ensure abstractSettings are properly defined
    if (!eventData.abstractSettings) {
      eventData.abstractSettings = {
        enabled: false,
        isOpen: false,
        deadline: null,
        maxLength: 500,
        allowEditing: false,
        guidelines: '',
        categories: [],
        notifyOnSubmission: false,
        allowFiles: false,
        maxFileSize: 5
      };
    } else {
      console.log('Found abstractSettings in event data:', eventData.abstractSettings);
      
      // Fix inconsistency: normalize isEnabled to enabled if needed
      if (eventData.abstractSettings.isEnabled !== undefined && eventData.abstractSettings.enabled === undefined) {
        eventData.abstractSettings.enabled = eventData.abstractSettings.isEnabled;
        delete eventData.abstractSettings.isEnabled;
      }
    }
    
    const formattedData = formatEventData(eventData);
    console.log('Formatted event data with abstractSettings:', formattedData.abstractSettings);
    
    return {
      success: true,
      data: formattedData
    };
  } catch (error) {
    console.error(`Error fetching event by ID ${id}:`, error);
    return {
      success: false,
      message: error.response?.data?.message || `Failed to fetch event with ID ${id}`
    };
  }
};

// Update an existing event
const updateEvent = async (id, eventData) => {
  if (!id) {
    console.error('updateEvent called without an ID');
    throw new Error('Event ID is required');
  }
  
  try {
    // Extract resource settings if present to update them separately
    const resourceSettings = eventData.resourceSettings;
    let updatedEventData = { ...eventData };
    
    // Remove resource settings from the main event update to avoid duplication
    if (resourceSettings) {
      delete updatedEventData.resourceSettings;
    }
    
    const response = await axios.put(`${baseURL}/events/${id}`, updatedEventData, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await handleApiResponse(response);
    
    // If resource settings are provided, update them separately
    if (resourceSettings) {
      try {
        if (resourceSettings.food) {
          await axios.put(`${baseURL}/resources/settings`, 
            { 
              settings: resourceSettings.food,
              isEnabled: resourceSettings.food.enabled !== false
            }, 
            { 
              params: { eventId: id, type: 'food' } 
            }
          );
        }
        
        if (resourceSettings.kits) {
          await axios.put(`${baseURL}/resources/settings`, 
            { 
              settings: resourceSettings.kits,
              isEnabled: resourceSettings.kits.enabled !== false
            }, 
            { 
              params: { eventId: id, type: 'kit' } 
            }
          );
        }
        
        if (resourceSettings.certificates) {
          await axios.put(`${baseURL}/resources/settings`, 
            { 
              settings: resourceSettings.certificates,
              isEnabled: resourceSettings.certificates.enabled !== false
            }, 
            { 
              params: { eventId: id, type: 'certificate' } 
            }
          );
        }
      } catch (resourceError) {
        console.error('Error updating resource settings:', resourceError);
        // Continue with the event update even if resource settings update fails
      }
    }
    
    return formatEventData(data.event);
  } catch (error) {
    console.error(`Error updating event ${id}:`, error);
    return { 
      success: false, 
      message: error.response?.data?.message || 'Failed to update event'
    };
  }
};

// Delete an event
const deleteEvent = async (id) => {
  if (!id) {
    console.error('deleteEvent called without an ID');
    throw new Error('Event ID is required');
  }
  
  try {
    await axios.delete(`${baseURL}/events/${id}`);
    return { success: true };
  } catch (error) {
    console.error(`Error deleting event ${id}:`, error);
    return { 
      success: false, 
      message: error.response?.data?.message || 'Failed to delete event'
    };
  }
};

/**
 * Get event statistics
 * @param {string} id - Event ID
 * @returns {Promise} - API response with event statistics
 */
const getEventStatistics = async (id) => {
  if (!id) {
    console.error('getEventStatistics called without an ID');
    throw new Error('Event ID is required');
  }
  
  try {
    // Get auth token from localStorage
    const token = localStorage.getItem('token');
    
    // Set up request headers with authorization
    const config = {
      headers: {}
    };
    
    // Add authentication header if token exists
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await axios.get(`${baseURL}/events/${id}/statistics`, config);
    const result = await handleApiResponse(response);
    
    // Format the statistics data to ensure consistent structure
    let formattedData;
    
    if (result && result.success === true && result.data) {
      formattedData = normalizeStatisticsData(result.data);
      console.log('Normalized statistics data:', formattedData);
      
      return {
        success: true,
        data: formattedData
      };
    } else if (result && !result.success) {
      return result; // Return the error response
    } else {
      return {
        success: true,
        data: {
          totalRegistrations: { total: 0, checkedIn: 0 },
          registrationsToday: 0,
          checkedIn: 0,
          categories: [],
          resourcesDistributed: { food: 0, kits: 0, certificates: 0 },
          abstractsSubmitted: 0,
          abstractsApproved: 0
        }
      };
    }
  } catch (error) {
    console.error(`Error fetching event statistics for ID ${id}:`, error);
    return {
      success: false,
      message: error.response?.data?.message || `Failed to fetch statistics for event with ID ${id}`,
      data: {
        totalRegistrations: { total: 0, checkedIn: 0 },
        registrationsToday: 0,
        checkedIn: 0,
        categories: [],
        resourcesDistributed: { food: 0, kits: 0, certificates: 0 },
        abstractsSubmitted: 0,
        abstractsApproved: 0
      }
    };
  }
};

/**
 * Helper function to normalize statistics data from various formats
 */
const normalizeStatisticsData = (data) => {
  // Create a normalized format with default values
  const normalized = {
    totalRegistrations: { total: 0, checkedIn: 0 },
    registrationsToday: 0,
    checkedIn: 0,
    categories: [],
    resourcesDistributed: { food: 0, kits: 0, certificates: 0 },
    abstractsSubmitted: 0,
    abstractsApproved: 0
  };
  
  // Normalize registrations data
  if (data.registrations) {
    if (data.registrations.total !== undefined) {
      normalized.totalRegistrations.total = data.registrations.total;
    }
    if (data.registrations.checkedIn !== undefined) {
      normalized.totalRegistrations.checkedIn = data.registrations.checkedIn;
      normalized.checkedIn = data.registrations.checkedIn;
    }
    if (data.registrations.byCategory) {
      normalized.categories = Object.entries(data.registrations.byCategory)
        .map(([name, count]) => ({ name, count }));
    }
  }
  
  // Normalize resources data
  if (data.resources) {
    // Format for resources: { food: { total, byType }, kitBags: { total, byType }, certificates: { total, byType } }
    if (data.resources.food && data.resources.food.total !== undefined) {
      normalized.resourcesDistributed.food = data.resources.food.total;
    }
    if (data.resources.kitBags && data.resources.kitBags.total !== undefined) {
      normalized.resourcesDistributed.kits = data.resources.kitBags.total;
    }
    if (data.resources.certificates && data.resources.certificates.total !== undefined) {
      normalized.resourcesDistributed.certificates = data.resources.certificates.total;
    }
  }
  
  // Handle older API response formats
  if (data.registrationsCount !== undefined) {
    normalized.totalRegistrations.total = data.registrationsCount;
  }
  if (data.checkedInCount !== undefined) {
    normalized.totalRegistrations.checkedIn = data.checkedInCount;
    normalized.checkedIn = data.checkedInCount;
  }
  if (data.registrationsToday !== undefined) {
    normalized.registrationsToday = data.registrationsToday;
  }
  if (data.abstractsCount !== undefined) {
    normalized.abstractsSubmitted = data.abstractsCount;
  }
  if (data.abstractsApproved !== undefined) {
    normalized.abstractsApproved = data.abstractsApproved;
  }
  if (data.resourcesCount) {
    if (data.resourcesCount.food !== undefined) {
      normalized.resourcesDistributed.food = data.resourcesCount.food;
    }
    if (data.resourcesCount.kits !== undefined) {
      normalized.resourcesDistributed.kits = data.resourcesCount.kits;
    }
    if (data.resourcesCount.certificates !== undefined) {
      normalized.resourcesDistributed.certificates = data.resourcesCount.certificates;
    }
  }
  
  return normalized;
};

// Get event dashboard data
const getEventDashboard = async (id) => {
  if (!id) {
    console.error('getEventDashboard called without an ID');
    throw new Error('Event ID is required');
  }
  
  try {
    // Get auth token from localStorage
    const token = localStorage.getItem('token');
    
    // Set up request headers with authorization
    const config = {
      headers: {}
    };
    
    // Add authentication header if token exists
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await axios.get(`${baseURL}/events/${id}/dashboard`, config);
    const data = await handleApiResponse(response);
    
    return {
      success: true,
      data: {
        recentActivities: data.recentActivities || []
      }
    };
  } catch (error) {
    console.error(`Error fetching event dashboard for ${id}:`, error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to fetch event dashboard',
      data: {
        recentActivities: []
      }
    };
  }
};

// Get categories for a specific event
const getEventCategories = async (eventId) => {
  if (!eventId) {
    console.warn('getEventCategories called without eventId');
    return {
      success: false,
      message: 'Event ID is required',
      data: []
    };
  }
  
  try {
    console.log(`Fetching categories for event ID: ${eventId}`);
    const response = await axios.get(`${baseURL}/events/${eventId}/categories`);
    console.log('Categories response:', response.data);
    
    // Simply return the standardized response
    return response.data;
  } catch (error) {
    console.error(`Error fetching categories for event ${eventId}:`, error);
    return {
      success: false,
      message: error.response?.data?.message || `Failed to fetch categories for event ${eventId}`,
      data: []
    };
  }
};

// Get registration form configuration for an event
const getRegistrationFormConfig = async (id) => {
  if (!id) {
    console.error('getRegistrationFormConfig called without an ID');
    throw new Error('Event ID is required');
  }
  
  try {
    // Try to get the event first - the registration config is likely part of the event object
    try {
      const eventResponse = await axios.get(`${baseURL}/events/${id}`);
      const eventData = await handleApiResponse(eventResponse);
      
      // Extract registration settings from the event
      let event = null;
      if (eventData.event) {
        event = eventData.event;
      } else if (eventData.data && typeof eventData.data === 'object') {
        event = eventData.data;
      } else if (eventData._id) {
        event = eventData;
      }
      
      if (event && event.registrationSettings) {
        // Use the registration settings from the event
        return {
          success: true,
          data: {
            requiredFields: event.registrationSettings.requiredFields || ['firstName', 'lastName', 'email', 'categoryId'],
            visibleFields: event.registrationSettings.visibleFields || [
              'firstName', 'lastName', 'email', 'phone', 'organization', 'title', 
              'categoryId', 'address', 'city', 'state', 'country', 'postalCode',
              'dietaryRestrictions', 'emergencyContact', 'emergencyPhone', 'specialRequirements',
              'agreeToTerms'
            ],
            fieldOrder: event.registrationSettings.fieldOrder || []
          }
        };
      }
    } catch (eventError) {
      console.warn('Could not get registration config from event:', eventError);
      // Continue to try the dedicated endpoint
    }
    
    // If we couldn't get it from the event, try the dedicated endpoint
    try {
      const response = await axios.get(`${baseURL}/events/${id}/registration-config`);
      const data = await handleApiResponse(response);
      
      return {
        success: true,
        data: data.config || data
      };
    } catch (error) {
      console.warn('Could not get registration config from dedicated endpoint:', error);
      // Return default config if both methods fail
      return {
        success: true,
        data: {
          requiredFields: ['firstName', 'lastName', 'email', 'categoryId'],
          visibleFields: [
            'firstName', 'lastName', 'email', 'phone', 'organization', 'title', 
            'categoryId', 'address', 'city', 'state', 'country', 'postalCode',
            'dietaryRestrictions', 'emergencyContact', 'emergencyPhone', 'specialRequirements',
            'agreeToTerms'
          ],
          fieldOrder: []
        }
      };
    }
  } catch (error) {
    console.error(`Error fetching registration form config for ${id}:`, error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to fetch registration form config',
      data: null
    };
  }
};

// Create a category for an event
const createEventCategory = async (eventId, categoryData) => {
  if (!eventId) {
    console.error('createEventCategory called without an event ID');
    throw new Error('Event ID is required');
  }
  
  try {
    const response = await axios.post(`${baseURL}/events/${eventId}/categories`, categoryData, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await handleApiResponse(response);
    
    return {
      success: true,
      message: 'Category created successfully',
      data: data
    };
  } catch (error) {
    console.error(`Error creating category for event ${eventId}:`, error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to create category',
      data: null
    };
  }
};

// Abstract settings
const saveAbstractSettings = async (eventId, settings) => {
  try {
    console.log(`Saving abstract settings for event ${eventId}:`, settings);
    
    const response = await axios.put(`${baseURL}/events/${eventId}/abstract-settings`, {
      settings
    });
    
    return handleApiResponse(response);
  } catch (error) {
    console.error('Error saving abstract settings:', error);
    throw error;
  }
};

/**
 * Get badge settings for an event
 * @param {string} eventId - Event ID
 * @returns {Promise} - API response with badge settings
 */
const getBadgeSettings = async (eventId) => {
  try {
    const response = await axios.get(`${baseURL}/events/${eventId}/badge-settings`);
    return response;
  } catch (error) {
    console.error('Error fetching badge settings:', error);
    // Return default badge settings if API call fails
    return {
      success: true,
      data: {
        orientation: 'portrait',
        size: { width: 3.375, height: 5.375 },
        unit: 'in',
        background: '#FFFFFF',
        logo: null,
        fields: {
          name: { enabled: true, fontSize: 18, fontWeight: 'bold' },
          organization: { enabled: true, fontSize: 14, fontWeight: 'normal' },
          registrationId: { enabled: true, fontSize: 12, fontWeight: 'normal' },
          qrCode: { enabled: true, size: 100 }
        },
        colors: { background: '#FFFFFF', text: '#000000', accent: '#3B82F6' }
      }
    };
  }
};

/**
 * Get resource statistics for a specific resource type within an event.
 */
const getResourceTypeStatistics = async (eventId, resourceType) => {
  try {
    console.log(`[eventService] Fetching ${resourceType} stats for event ${eventId}`);
    // Corrected URL format:
    const response = await axios.get(`${baseURL}/resources/statistics/${eventId}/${resourceType}`);
    
    // The correct backend endpoint should directly return the data for the requested type.
    // No need for client-side filtering anymore.
    console.log(`[eventService] Response for ${resourceType} stats:`, response.data);
    
    // Check if the response was successful and data exists
    if (response.data && response.data.success && response.data.data) {
      return response.data.data; // Return the data object directly
    } else {
      // If the backend indicates success but no data, return default structure
      console.warn(`[eventService] No specific stats found for ${resourceType}, returning default.`);
      return { totalCount: 0, todayCount: 0, uniqueAttendees: 0 }; // Default structure
    }
  } catch (error) {
    console.error(`[eventService] Error fetching ${resourceType} statistics for event ${eventId}:`, error);
    // Return default structure on error to prevent crashes
    return { totalCount: 0, todayCount: 0, uniqueAttendees: 0 }; 
  }
};

// Fetch resource configuration for an event
const getResourceConfig = async (eventId) => {
  if (!eventId) {
    console.error('getResourceConfig called without eventId');
    return { success: false, message: 'Event ID is required', data: null };
  }
  try {
    const response = await axios.get(`${baseURL}/events/${eventId}/resource-config`);
    const result = await handleApiResponse(response); 
    
    if (result && result.success && result.data) {
      return result; // Return the {success, message, data} object
    } else {
      // Handle cases where handleApiResponse might return just data or an error structure
      console.warn('Unexpected response format from getResourceConfig API:', result);
      return { success: false, message: result?.message || 'Failed to parse resource config', data: null };
    }
  } catch (error) {
    console.error(`Error fetching resource config for event ${eventId}:`, error);
    return {
      success: false,
      message: error.response?.data?.message || `Failed to fetch resource config for event ${eventId}`,
      data: null
    };
  }
};

// Fetch users associated with a specific event
const getEventUsers = async (eventId) => {
  if (!eventId) {
    console.error('getEventUsers called without an event ID');
    return {
      success: false,
      message: 'Event ID is required to fetch users.',
      data: [],
      count: 0
    };
  }
  try {
    const response = await axios.get(`${baseURL}/events/${eventId}/users`);
    const result = await handleApiResponse(response);

    if (result && result.success) {
      return {
        success: true,
        data: result.data || [],
        count: result.count || (result.data ? result.data.length : 0)
      };
    }
    // If result.success is not explicitly true, treat as failure or unexpected format
    return {
      success: false,
      message: result?.message || 'Failed to fetch event users or unexpected response format',
      data: [],
      count: 0
    };
  } catch (error) {
    console.error(`Error fetching users for event ${eventId}:`, error);
    return {
      success: false,
      message: error.response?.data?.message || `Failed to fetch users for event ${eventId}`,
      data: [],
      count: 0
    };
  }
};

/**
 * Fetch users specifically designated as reviewers for an event's abstract workflow.
 * @param {string} eventId - The ID of the event.
 * @returns {Promise<object>} The API response with reviewer data.
 */
const getEventReviewers = async (eventId) => {
  if (!eventId) {
    console.error('getEventReviewers called without an eventId');
    return { success: false, message: 'Event ID is required', data: [] };
  }
  try {
    // Uses the main 'api' instance from apiService.js which should have auth interceptors
    const response = await axios.get(`${baseURL}/events/${eventId}/abstract-workflow/reviewers`);
    return await handleApiResponse(response); // Assumes handleApiResponse processes it correctly
  } catch (error) {
    console.error(`Error fetching reviewers for event ${eventId}:`, error);
    return {
      success: false,
      message: error.response?.data?.message || `Failed to fetch reviewers for event ${eventId}`,
      data: []
    };
  }
};

const eventService = {
  createEvent,
  fetchEvents,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  getEventStatistics,
  getEventDashboard,
  getEventCategories,
  getRegistrationFormConfig,
  createEventCategory,
  saveAbstractSettings,
  getBadgeSettings,
  getResourceTypeStatistics,
  getResourceConfig,
  getEventUsers,
  getEventReviewers
};

export default eventService; 