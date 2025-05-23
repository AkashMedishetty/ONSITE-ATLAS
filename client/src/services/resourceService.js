import axios from 'axios';
import api from './api';
import { handleError } from './utils';

/**
 * Service for managing resources (food, kit bags, certificates)
 */
const resourceService = {
  /**
   * Get all resources for an event
   * @param {string} eventId - Event ID
   * @param {string} type - Resource type (food, kit, certificate)
   * @returns {Promise} - API response with resources
   */
  getResources: async (eventId, type) => {
    try {
      // Return empty response if no eventId is provided
      if (!eventId) {
        console.warn('No eventId provided to getResources');
        return {
          success: true,
          message: 'No event ID provided',
          data: [],
          total: 0
        };
      }
      
      // Use the direct resources endpoint with eventId as a query parameter
      const response = await api.get('/resources', { 
        params: { eventId, type } 
      });
      return response.data;
    } catch (error) {
      handleError(error, 'Error fetching resources');
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch resources',
        data: [],
        total: 0
      };
    }
  },

  /**
   * Get a single resource by ID
   * @param {string} eventId - Event ID
   * @param {string} resourceId - Resource ID
   * @returns {Promise} - API response with resource
   */
  getResourceById: async (eventId, resourceId) => {
    try {
      // Use the direct resources endpoint
      const response = await api.get(`/resources/${resourceId}`, {
        params: { eventId }
      });
      return response.data;
    } catch (error) {
      handleError(error, 'Error fetching resource');
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch resource',
        data: null
      };
    }
  },

  /**
   * Create a new resource
   * @param {string} eventId - Event ID
   * @param {Object} resourceData - Resource data
   * @returns {Promise} - API response with created resource
   */
  createResource: async (eventId, resourceData) => {
    try {
      // Add eventId to the resource data
      const data = { ...resourceData, eventId };
      const response = await api.post('/resources', data);
      return response.data;
    } catch (error) {
      handleError(error, 'Error creating resource');
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to create resource',
        data: null
      };
    }
  },

  /**
   * Update a resource
   * @param {string} resourceId - Resource ID
   * @param {Object} resourceData - Updated resource data
   * @returns {Promise} - API response with updated resource
   */
  updateResource: async (resourceId, resourceData) => {
    try {
      const response = await api.put(`/resources/${resourceId}`, resourceData);
      return response.data;
    } catch (error) {
      handleError(error, 'Error updating resource');
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update resource',
        data: null
      };
    }
  },

  /**
   * Delete a resource
   * @param {string} resourceId - Resource ID
   * @returns {Promise} - API response
   */
  deleteResource: async (resourceId) => {
    try {
      const response = await api.delete(`/resources/${resourceId}`);
      return response.data;
    } catch (error) {
      handleError(error, 'Error deleting resource');
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to delete resource'
      };
    }
  },

  /**
   * Upload a certificate template file for an event.
   * @param {string} eventId - The ID of the event.
   * @param {File} file - The file to upload.
   * @returns {Promise<{success: boolean, message: string, data?: {templateUrl: string}}>} - API response with upload result.
   */
  uploadCertificateTemplateFile: async (eventId, file) => {
    try {
      if (!eventId || !file) {
        return { success: false, message: 'Event ID and file are required for upload.' };
      }

      const formData = new FormData();
      formData.append('eventId', eventId);
      formData.append('templateFile', file);

      // Note: The backend endpoint /resources/certificate-template/upload needs to be created
      // and configured to handle multipart/form-data and save the file.
      const response = await api.post('/resources/certificate-template/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data; // Expected: { success: true, data: { templateUrl: 'path/to/file.ext' } }
    } catch (error) {
      handleError(error, 'Error uploading certificate template file');
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to upload certificate template file',
      };
    }
  },

  /**
   * Get food settings for an event
   * @param {string} eventId - Event ID
   * @param {number} timestamp - Optional timestamp for cache busting
   * @returns {Promise} - API response with food settings
   */
  getFoodSettings: async (eventId, timestamp) => {
    try {
      if (!eventId) {
        console.error('Missing event ID for food settings');
        return {
          success: false,
          message: 'Event ID is required',
          data: null
        };
      }
      console.log('Making API call to get food settings for event:', eventId);
      const response = await api.get('/resources/settings', {
        params: { 
          eventId, 
          type: 'food',
          _t: timestamp || Date.now()
        }
      });
      console.log('Food settings loaded successfully');
      // Normalize enabled property
      let data = response.data?.data || {};
      let settings = data.settings || {};
      let enabled = typeof data.isEnabled !== 'undefined' ? data.isEnabled : (typeof settings.enabled !== 'undefined' ? settings.enabled : true);
      settings.enabled = enabled;
      return {
        success: true,
        message: response.data?.message || 'Food settings loaded successfully',
        data: { settings }
      };
    } catch (error) {
      console.error(`Error fetching food settings: ${error.message}`);
      // Try legacy endpoint as fallback
      try {
        console.log('Trying legacy endpoint as fallback');
        const legacyResponse = await api.get(`/resources/food/settings`, {
          params: { 
            eventId,
            _t: timestamp || Date.now()
          }
        });
        let data = legacyResponse.data?.data || {};
        let settings = data.settings || {};
        let enabled = typeof data.isEnabled !== 'undefined' ? data.isEnabled : (typeof settings.enabled !== 'undefined' ? settings.enabled : true);
        settings.enabled = enabled;
        return {
          success: true,
          message: legacyResponse.data?.message || 'Food settings loaded successfully',
          data: { settings }
        };
      } catch (legacyError) {
        console.error(`Legacy endpoint also failed: ${legacyError.message}`);
        handleError(error, 'Error fetching food settings');
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to fetch food settings',
          data: null
        };
      }
    }
  },

  /**
   * Get food settings for an event - alias for CategoriesTab
   * @param {string} eventId - Event ID
   * @returns {Promise} - API response with food settings
   */
  getEventFoodSettings: async (eventId) => {
    return resourceService.getFoodSettings(eventId);
  },

  /**
   * Update food settings for an event
   * @param {string} eventId - Event ID
   * @param {Object} settings - Settings data
   * @param {boolean} isEnabled - Whether food resources are enabled
   * @returns {Promise} - API response with updated settings
   */
  updateFoodSettings: async (eventId, settings, isEnabled) => {
    try {
      console.log(`Updating food settings for event ${eventId}`);
      
      if (!eventId) {
        console.error('Missing event ID for food settings update');
        return {
          success: false,
          message: 'Event ID is required',
          data: null
        };
      }
      
      const response = await api.put('/resources/settings', 
        { settings, isEnabled }, 
        { params: { eventId, type: 'food' }}
      );
      
      return {
        success: true,
        message: 'Food settings updated successfully',
        data: response.data.data
      };
    } catch (error) {
      handleError(error, 'Error updating food settings');
      return {
        success: false, 
        message: error.response?.data?.message || 'Failed to update food settings',
        error: error.message,
        data: null
      };
    }
  },

  /**
   * Get kit bag settings for an event
   * @param {string} eventId - Event ID
   * @param {number} timestamp - Optional timestamp for cache busting
   * @returns {Promise} - API response with kit bag settings
   */
  getKitSettings: async (eventId, timestamp) => {
    try {
      console.log(`[getKitSettings] Fetching settings for event ${eventId}`);
      if (!eventId) {
        console.error('[getKitSettings] Missing event ID');
        return {
          success: false,
          message: 'Event ID is required',
          data: { settings: { enabled: true, items: [] } }
        };
      }
      const response = await api.get('/resources/settings', {
        params: { 
          eventId, 
          type: 'kitBag',
          _t: timestamp || Date.now()
        }
      });
      console.log('[getKitSettings] Raw API response:', response.data);
      if (response.data && response.data.success) {
        const data = response.data.data || {};
        let settings = data.settings || {};
        let enabled = typeof data.isEnabled !== 'undefined' ? data.isEnabled : (typeof settings.enabled !== 'undefined' ? settings.enabled : true);
        settings.enabled = enabled;
        if (!settings.items) settings.items = [];
        return {
          success: true,
          message: 'Kit settings loaded successfully',
          data: { settings }
        };
        }
      // Return default data if response is not successful
      console.warn('[getKitSettings] Invalid response, using defaults');
      return { 
        success: true, 
        message: 'Using default kit settings',
        data: { settings: { enabled: true, items: [] } }
      };
    } catch (error) {
      console.error('[getKitSettings] Error:', error);
      if (error.response) {
        console.error('[getKitSettings] Error details:', error.response.data);
      }
      return { 
        success: false, 
        message: error.message || 'Failed to fetch kit settings',
        data: { settings: { enabled: true, items: [] } }
      };
    }
  },

  /**
   * Get kit settings for an event - alias for CategoriesTab
   * @param {string} eventId - Event ID
   * @returns {Promise} - API response with kit settings
   */
  getEventKitSettings: async (eventId) => {
    return resourceService.getKitSettings(eventId);
  },

  /**
   * Update kit bag settings for an event
   * @param {string} eventId - Event ID
   * @param {Object} settings - Settings data
   * @param {boolean} isEnabled - Whether kit resources are enabled
   * @returns {Promise} - API response with updated settings
   */
  updateKitSettings: async (eventId, settings, isEnabled) => {
    try {
      console.log(`[updateKitSettings] Updating settings for event ${eventId}:`, settings);
      
      if (!eventId) {
        console.error('[updateKitSettings] Missing event ID');
        return {
          success: false,
          message: 'Event ID is required',
          data: null
        };
      }
      
      // Ensure settings has the expected structure before sending
      const settingsToSave = settings || {};
      if (!Array.isArray(settingsToSave.items)) {
        console.log('[updateKitSettings] Ensuring items array exists');
        settingsToSave.items = settings.items || [];
      }
      
      const response = await api.put('/resources/settings', 
        { settings: settingsToSave, isEnabled }, 
        { params: { eventId, type: 'kits' }}
      );
      
      console.log('[updateKitSettings] API response:', response.data);
      
      // Handle successful response but normalize to expected structure
      if (response.data && response.data.success) {
        return {
          success: true,
          message: 'Kit settings updated successfully',
          data: response.data.data || { 
            settings: settingsToSave,
            isEnabled: isEnabled
          }
        };
      } else {
        throw new Error(response.data?.message || 'Server returned unsuccessful response');
      }
    } catch (error) {
      console.error('[updateKitSettings] Error:', error);
      if (error.response) {
        console.error('[updateKitSettings] Error response:', error.response.data);
      }
      return {
        success: false, 
        message: error.response?.data?.message || 'Failed to update kit settings',
        error: error.message,
        data: null
      };
    }
  },

  /**
   * Get certificate settings for an event
   * @param {string} eventId - Event ID
   * @param {number} timestamp - Optional timestamp for cache busting
   * @returns {Promise} - API response with certificate settings
   */
  getCertificateSettings: async (eventId, timestamp) => {
    try {
      console.log(`[getCertificateSettings] Fetching settings for event ${eventId}`);
      if (!eventId) {
        console.error('[getCertificateSettings] Missing event ID');
        return {
          success: false,
          message: 'Event ID is required',
          data: { settings: { enabled: true, types: [] } }
        };
      }
      const response = await api.get('/resources/settings', {
        params: { 
          eventId, 
          type: 'certificate',
          _t: timestamp || Date.now()
        }
      });
      console.log('[getCertificateSettings] Raw API response:', response.data);
      if (response.data && response.data.success) {
        const data = response.data.data || {};
        let settings = data.settings || {};
        let enabled = typeof data.isEnabled !== 'undefined' ? data.isEnabled : (typeof settings.enabled !== 'undefined' ? settings.enabled : true);
        settings.enabled = enabled;
        if (!settings.types) settings.types = [];
        return {
          success: true,
          message: 'Certificate settings loaded successfully',
          data: { settings }
        };
        }
      // Return default data if response is not successful
      console.warn('[getCertificateSettings] Invalid response, using defaults');
      return {
        success: true,
        message: 'Using default certificate settings',
        data: { settings: { enabled: true, types: [] } }
      };
    } catch (error) {
      console.error('[getCertificateSettings] Error:', error);
      if (error.response) {
        console.error('[getCertificateSettings] Error details:', error.response.data);
      }
      return {
        success: false,
        message: error.message || 'Failed to fetch certificate settings',
        data: { settings: { enabled: true, types: [] } }
      };
    }
  },

  /**
   * Get certificate settings for an event - alias for CategoriesTab
   * @param {string} eventId - Event ID
   * @returns {Promise} - API response with certificate settings
   */
  getEventCertificateSettings: async (eventId) => {
    return resourceService.getCertificateSettings(eventId);
  },

  /**
   * Update certificate settings for an event
   * @param {string} eventId - Event ID
   * @param {Object} settings - Settings data
   * @param {boolean} isEnabled - Whether certificate resources are enabled
   * @returns {Promise} - API response with updated settings
   */
  updateCertificateSettings: async (eventId, settings, isEnabled) => {
    try {
      console.log(`[updateCertificateSettings] Updating settings for event ${eventId}:`, settings);
      
      if (!eventId) {
        console.error('[updateCertificateSettings] Missing event ID');
        return {
          success: false,
          message: 'Event ID is required',
          data: null
        };
      }
      
      // Ensure settings has the expected structure before sending
      const settingsToSave = settings || {};
      if (!Array.isArray(settingsToSave.types)) {
        console.log('[updateCertificateSettings] Ensuring types array exists');
        settingsToSave.types = settings.types || [];
      }
      
      const response = await api.put('/resources/settings', 
        { settings: settingsToSave, isEnabled }, 
        { params: { eventId, type: 'certificate' }}
      );
      
      console.log('[updateCertificateSettings] API response:', response.data);
      
      // Handle successful response but normalize to expected structure
      if (response.data && response.data.success) {
        return {
          success: true,
          message: 'Certificate settings updated successfully',
          data: response.data.data || { 
            settings: settingsToSave,
            isEnabled: isEnabled
          }
        };
      } else {
        throw new Error(response.data?.message || 'Server returned unsuccessful response');
      }
    } catch (error) {
      console.error('[updateCertificateSettings] Error:', error);
      if (error.response) {
        console.error('[updateCertificateSettings] Error response:', error.response.data);
      }
      return {
        success: false, 
        message: error.response?.data?.message || 'Failed to update certificate settings',
        error: error.message,
        data: null
      };
    }
  },

  /**
   * Update certificate printing settings for an event
   * @param {string} eventId - Event ID
   * @param {Object} settings - Settings data
   * @param {boolean} isEnabled - Whether certificate printing is enabled
   * @returns {Promise} - API response with updated settings
   */
  updateCertificatePrintingSettings: async (eventId, settings, isEnabled) => {
    try {
      console.log(`[updateCertificatePrintingSettings] Updating settings for event ${eventId}:`, settings);
      
      if (!eventId) {
        console.error('[updateCertificatePrintingSettings] Missing event ID');
        return {
          success: false,
          message: 'Event ID is required',
          data: null
        };
      }
      
      // Ensure settings has the expected structure before sending
      const settingsToSave = settings || {};
      if (!Array.isArray(settingsToSave.templates)) {
        console.log('[updateCertificatePrintingSettings] Ensuring templates array exists');
        settingsToSave.templates = settings.templates || [];
      }
      
      const response = await api.put('/resources/settings', 
        { settings: settingsToSave, isEnabled }, 
        { params: { eventId, type: 'certificatePrinting' }}
      );
      
      console.log('[updateCertificatePrintingSettings] API response:', response.data);
      
      // Handle successful response but normalize to expected structure
      if (response.data && response.data.success) {
        return {
          success: true,
          message: 'Certificate printing settings updated successfully',
          data: response.data.data || { 
            settings: settingsToSave,
            isEnabled: isEnabled
          }
        };
      } else {
        throw new Error(response.data?.message || 'Server returned unsuccessful response');
      }
    } catch (error) {
      console.error('[updateCertificatePrintingSettings] Error:', error);
      if (error.response) {
        console.error('[updateCertificatePrintingSettings] Error response:', error.response.data);
      }
      return {
        success: false, 
        message: error.response?.data?.message || 'Failed to update certificate printing settings',
        error: error.message,
        data: null
      };
    }
  },

  /**
   * Validate a scanned QR code for a specific resource type
   * @param {string} eventId - Event ID
   * @param {string} resourceType - Resource type (food, kits, certificate)
   * @param {string} resourceOptionId - Resource option ID
   * @param {string} qrCode - The scanned QR code
   * @returns {Promise} - API response with validation result
   */
  validateScan: async (eventId, resourceType, resourceOptionId, qrCode) => {
    try {
      console.log('🔍 Validating scan:', { eventId, resourceType, resourceOptionId, qrCode });
      
      if (!eventId || !resourceType || !resourceOptionId || !qrCode) {
        console.error('❌ Missing parameters in validateScan');
        return {
          success: false,
          message: 'Event ID, resource type, option ID and QR code are required',
          data: null
        };
      }
      
      // Convert UI resource types to the exact MongoDB enum values
      let type = resourceType;
      
      // Map frontend types to exact MongoDB enum values
      if (type === 'kits') type = 'kitBag';  // Must match MongoDB schema enum
      if (type === 'certificates') type = 'certificate'; 
      if (type === 'food') type = 'food';
      
      console.log('🔄 Mapped resource type from UI:', resourceType, 'to DB:', type);
      
      // Use the correct endpoint directly
      const response = await api.post('/resources/validate-scan', {
        eventId,
        resourceType: type,
        resourceOptionId,
        qrCode
      });
      
      console.log('✅ Validation response:', response.data);
      return response.data;
    } catch (error) {
      console.error('⛔ Error validating QR code:', error);
      // Return error response
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to validate QR code',
        data: null
      };
    }
  },

  /**
   * Record a resource usage (food, kit, etc.)
   * @param {object} resourceInfo - Resource information object with type, option, etc.
   * @param {string} qrCode - The QR code or registration ID of the attendee
   * @returns {Promise} - API response with result
   */
  recordResourceUsage: async (resourceInfo, qrCode) => {
    try {
      console.log('📝 Recording resource usage:', { resourceInfo, qrCode });
      
      if (!resourceInfo || !qrCode) {
        console.error('❌ Missing resource info or QR code in recordResourceUsage');
        return {
          success: false,
          message: 'Resource information and QR code are required',
          data: null
        };
      }
      
      // Convert UI resource types to the exact MongoDB enum values
      let resourceType = resourceInfo.type;
      
      // Map frontend types to exact MongoDB enum values
      if (resourceType === 'kits') resourceType = 'kitBag';  // Must match MongoDB schema enum
      if (resourceType === 'certificates') resourceType = 'certificate';
      if (resourceType === 'food') resourceType = 'food';
      
      console.log('🔄 Converted resource type for MongoDB schema: UI type:', resourceInfo.type, '→ DB type:', resourceType);
      
      // Try to extract resourceOptionId from multiple possible locations
      let resourceOptionId = null;
      
      // First check for selectedOption object
      if (resourceInfo.selectedOption) {
        resourceOptionId = resourceInfo.selectedOption._id || resourceInfo.selectedOption.id;
      }
      
      // If not found, check if resourceOptionId is directly provided
      if (!resourceOptionId && resourceInfo.resourceOptionId) {
        resourceOptionId = resourceInfo.resourceOptionId;
      }
      
      // If still not found but we have a direct option ID in the resourceInfo
      if (!resourceOptionId && resourceInfo.optionId) {
        resourceOptionId = resourceInfo.optionId;
      }
      
      // If we have a directly provided selectedResource field
      if (!resourceOptionId && resourceInfo.selectedResource) {
        resourceOptionId = resourceInfo.selectedResource;
      }
      
      if (!resourceType) {
        console.error('❌ Missing resource type in recordResourceUsage');
        return {
          success: false,
          message: 'Resource type is required',
          data: null
        };
      }
      
      if (!resourceOptionId) {
        console.error('❌ Missing resource option ID in recordResourceUsage');
        return {
          success: false,
          message: 'Resource option ID is required',
          data: null
        };
      }
      
      // Create request payload with the exact values the UI is using
      const requestPayload = {
        registrationId: qrCode,
        qrCode: qrCode,
        resourceType: resourceType,
        resourceOptionId,
        eventId: resourceInfo.eventId
      };
      
      // If force is present in resourceInfo, include it at the top level
      if (resourceInfo.force === true) {
        requestPayload.force = true;
      }
      
      console.log('📤 Making resource usage API call with payload:', JSON.stringify(requestPayload));
      
      // Make the API request
      const response = await api.post('/resources/record-usage', requestPayload);
      console.log('📥 Resource usage API response:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('⛔ Error recording resource usage:', error);
      // Log more detailed information about the error
      if (error.response) {
        console.error('🔴 Error response status:', error.response.status);
        console.error('🔴 Error response data:', JSON.stringify(error.response.data));
        console.error('🔴 Request that caused error:', error.config.data);
      }
      
      // Return error response
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to record resource usage',
        data: null
      };
    }
  },

  /**
   * Get recent resource scans for an event, filtered by type.
   */
  getRecentScans: async (eventId, type, limit = 20) => {
    const params = new URLSearchParams({ eventId, limit });
    if (type && type !== 'all') {
      params.append('type', type);
    }
    // Use the corrected route '/recent-scans'
    const response = await api.get('/resources/recent-scans', {
      params
    });
    return response.data;
  },

  /**
   * Get statistics for a specific resource option within an event
   * @param {string} eventId - Event ID
   * @param {string} resourceType - Type of resource (e.g., 'food', 'kitBag')
   * @param {string} resourceOptionId - Specific ID of the resource option (e.g., meal ID, kit item ID)
   * @returns {Promise<object>} - API response with statistics
   */
  getResourceStatistics: async (eventId, resourceType, resourceOptionId) => {
    if (!eventId || !resourceType || !resourceOptionId) {
      console.error('Missing required parameters for getResourceStatistics', { eventId, resourceType, resourceOptionId });
      return { 
        success: false, 
        message: 'Event ID, resource type, and resource option ID are required.',
        data: { count: 0, today: 0, uniqueAttendees: 0 } // Return default structure on error
      };
    }
    
    console.log(`Fetching statistics for event: ${eventId}, type: ${resourceType}, option: ${resourceOptionId}`);
    
    try {
      // Target the event-specific statistics endpoint
      const response = await api.get(`/events/${eventId}/resources/stats`, {
        params: {
          type: resourceType,
          optionId: resourceOptionId
        }
      });
      
      console.log('Raw stats response:', response);
      
      // Check if the response structure is as expected
      if (response.data && response.data.success) {
        // Assuming the backend returns data directly within response.data.data
        const statsData = response.data.data || {};
        console.log('Processed stats data:', statsData);
        return {
          success: true,
          // Use the specific fields returned by the backend
          data: {
            count: statsData.count || 0,
            today: statsData.today || 0,
            uniqueAttendees: statsData.uniqueAttendees || 0
          }
        };
      } else {
         // Handle cases where response is successful but data format is unexpected or success=false
         console.warn('Statistics response not successful or data missing:', response.data);
         return { 
           success: false, 
           message: response.data?.message || 'Failed to fetch valid statistics data.',
           data: { count: 0, today: 0, uniqueAttendees: 0 } // Return default structure
         };
      }
    } catch (error) {
      console.error(`⛔ Error fetching resource statistics: ${error.message}`);
      // Log the detailed error response if available
      if (error.response) {
        console.error('API Error Response:', error.response.data);
      }
      handleError(error, 'Error fetching resource statistics');
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to fetch resource statistics',
        data: { count: 0, today: 0, uniqueAttendees: 0 } // Return default structure on error
      };
    }
  },

  /**
   * Export resource usage data
   * @param {string} eventId - Event ID
   * @param {string} resourceType - Resource type (food, kit, certificate)
   * @param {Object} params - Export parameters
   * @returns {Promise} - API response with download URL
   */
  exportResourceUsage: async (eventId, resourceType, params = {}) => {
    try {
      if (!eventId || !resourceType) {
        throw new Error('Event ID and Resource Type are required for export.');
      }
      
      // Add resourceType to the params object for the query string
      const queryParams = { ...params, type: resourceType };
      
      const url = `/events/${eventId}/resources/export`;
      console.log(`[exportResourceUsage] Calling API: GET ${url} with params:`, queryParams);
      
      const response = await api.get(url, { 
        params: queryParams,
        responseType: 'blob' // Expect a Blob response
      });
      
      return response.data; // Return the Blob
      
    } catch (error) {
      console.error(`Error exporting ${resourceType} usage:`, error);
      return { 
        success: false, 
        message: error.response?.data?.message || error.message || `Failed to export ${resourceType} usage` 
      };
    }
  },

  // Create a resource (like food, kit item, certificate)
  createResource: async (eventId, registrationId, resourceType, data = {}) => {
    try {
      const response = await api.post('/resources', {
        event: eventId,
        registration: registrationId,
        type: resourceType,
        ...data
      });

      return {
        success: true,
        data: response.data,
        message: `Resource created successfully`
      };
    } catch (error) {
      console.error('Error creating resource:', error);
      return {
        success: false,
        message: error.response?.data?.message || `Failed to create resource`,
        data: null
      };
    }
  },

  // Void a resource (e.g., mark a meal, kit, or certificate as voided)
  voidResource: async (resourceId, voidReason) => {
    try {
      const response = await api.patch(`/resources/${resourceId}/void`, {
        voidReason
      });

      return {
        success: true,
        data: response.data,
        message: 'Resource voided successfully'
      };
    } catch (error) {
      console.error('Error voiding resource:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to void resource',
        data: null
      };
    }
  },

  // Get all resources for an event
  getEventResources: async (eventId, type, page = 1, limit = 50) => {
    try {
      const response = await api.get(`/events/${eventId}/resources`, {
        params: { type, page, limit }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching event resources:', error);
      return { success: false, message: error.response?.data?.message || error.message };
    }
  },

  /**
   * Get resources for a specific registration
   * @param {string} eventId - Event ID
   * @param {string} registrationId - Registration ID
   * @param {string} type - Optional resource type filter
   * @returns {Promise} - API response with resources for the registration
   */
  getRegistrationResources: async (eventId, registrationId, type) => {
    try {
      if (!eventId || !registrationId) {
        throw new Error('Event ID and Registration ID are required');
      }
      
      const response = await api.get(`/api/events/${eventId}/registrations/${registrationId}/resources`, {
        params: { type }
      });
      
      return {
        success: true,
        message: 'Resources retrieved successfully',
        data: response.data?.data || []
      };
    } catch (error) {
      handleError(error, 'Error fetching registration resources');
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch resources',
        data: []
      };
    }
  },

  /**
   * Update resource usage status for a registration
   * @param {string} eventId - Event ID
   * @param {string} registrationId - Registration ID
   * @param {string} resourceId - Resource ID
   * @param {Object} data - Update data with isUsed flag
   * @returns {Promise} - API response with update result
   */
  updateResourceUsage: async (eventId, registrationId, resourceId, data) => {
    try {
      if (!eventId || !registrationId || !resourceId) {
        throw new Error('Event ID, Registration ID, and Resource ID are required');
      }
      
      const response = await api.patch(`/api/events/${eventId}/registrations/${registrationId}/resources/${resourceId}`, data);
      return response.data;
    } catch (error) {
      handleError(error, 'Error updating resource usage');
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update resource usage',
        data: null
      };
    }
  },

  /**
   * Get resource usage statistics for a registration
   * @param {string} eventId - Event ID
   * @param {string} registrationId - Registration ID
   * @returns {Promise} - API response with resource statistics
   */
  getResourceStats: async (eventId, registrationId) => {
    try {
      if (!eventId || !registrationId) {
        console.warn('Missing eventId or registrationId in getResourceStats');
        return {
          success: false,
          message: 'Event ID and Registration ID are required',
          data: null
        };
      }
      
      const response = await api.get(`/api/events/${eventId}/registrations/${registrationId}/resource-stats`);
      return response.data;
    } catch (error) {
      handleError(error, 'Error fetching resource statistics');
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch resource statistics',
        data: null
      };
    }
  },

  // Get resource settings
  getResourceSettings: async (eventId, type, timestamp) => {
    try {
      console.log(`[getResourceSettings] Fetching settings for event: ${eventId}, type: ${type}`);
      
      if (!eventId || !type) {
        console.error('[getResourceSettings] Missing eventId or type');
        return { 
          success: false, 
          message: 'Event ID and resource type are required',
          data: { settings: {} }
        };
      }
      
      // Normalize type consistently with server expectations
      let normalizedType = type;
      if (type === 'kits') normalizedType = 'kitBag';
      if (type === 'certificates') normalizedType = 'certificate';
      
      const response = await api.get('/resources/settings', {
        params: { 
          eventId, 
          type: normalizedType,
          _t: timestamp || Date.now() // Add timestamp parameter for cache busting
        }
      });
      
      console.log(`[getResourceSettings] Got response for ${type}:`, response.data);
      return response.data;
    } catch (error) {
      console.error(`[getResourceSettings] Error fetching ${type} settings:`, error);
      return { 
        success: false, 
        message: error.response?.data?.message || error.message,
        data: { settings: {} }
      };
    }
  },

  /**
   * Fetches resource statistics specifically for one resource type
   * @param {string} eventId - The event ID
   * @param {string} resourceType - The resource type (food, kits, certificates)
   * @returns {Promise} - API response with resource statistics for the specific type
   */
  getResourceTypeStatistics: async (eventId, resourceType) => {
    console.log(`Fetching statistics for ${resourceType} in event ${eventId}`);
    
    if (!eventId || !resourceType) {
      console.error("Missing eventId or resourceType in getResourceTypeStatistics");
      return { 
        success: true,
        data: {
          count: 0,
          today: 0,
          uniqueAttendees: 0
        }
      };
    }

    try {
      // Convert UI resource types to the exact MongoDB enum values
      let type = resourceType;
      
      // Map frontend types to exact MongoDB enum values 
      if (type === 'kits') type = 'kitBag';  // Must match MongoDB schema enum
      if (type === 'certificates') type = 'certificate';
      if (type === 'food') type = 'food';
      
      console.log(`Mapped resource type from ${resourceType} to ${type} for API call`);

      try {
        // First try the dedicated endpoint (if the server has been updated)
        const response = await api.get(`/resources/statistics/${eventId}/${type}`);
        
        // If successful, return the formatted data
        if (response.data && response.data.success) {
          const statsData = response.data.data || {};
          console.log(`${resourceType} statistics loaded from dedicated endpoint:`, statsData);
          
          return {
            success: true,
            data: {
              count: statsData.totalCount || 0,
              today: statsData.todayCount || 0,
              uniqueAttendees: statsData.uniqueAttendees || 0
            }
          };
        }
      } catch (dedicatedEndpointError) {
        console.log(`Dedicated endpoint not available for ${resourceType}: ${dedicatedEndpointError.message}. Falling back to alternative method.`);
        // Continue to the fallback method if the dedicated endpoint fails
      }
      
      // Fallback method: Get from the general statistics endpoint
      console.log(`Trying general statistics endpoint for ${resourceType}`);
      const response = await api.get(`/resources/statistics`, {
        params: { eventId }
      });
      
      console.log(`General statistics response:`, response.data);
      
      // Extract the resource type data from the general statistics
      const allStats = response.data.data || {};
      
      // Handle different types and map to the expected UI structure
      let typeData = null;
      if (resourceType === 'kits') {
        typeData = allStats.byType?.kits;
      } else if (resourceType === 'food') {
        typeData = allStats.byType?.food;
      } else if (resourceType === 'certificates') {
        typeData = allStats.byType?.certificates;
      }
      
      console.log(`Extracted ${resourceType} data from general statistics:`, typeData);
      
      // If we found data for this resource type, use it
      if (typeData) {
        return {
          success: true,
          data: {
            count: typeData.count || 0,
            today: typeData.today || 0,
            uniqueAttendees: typeData.uniqueAttendees || 0
          }
        };
      }
      
      // Default empty response if we couldn't find data
      return { 
        success: true,
        data: {
          count: 0,
          today: 0,
          uniqueAttendees: 0
        }
      };
    } catch (error) {
      console.error(`Error fetching ${resourceType} statistics: ${error.message}`);
      
      // Return default data to prevent UI crashes
      return { 
        success: true,
        data: {
          count: 0,
          today: 0,
          uniqueAttendees: 0
        }
      };
    }
  },

  /**
   * Get certificate printing settings for an event
   * @param {string} eventId - Event ID
   * @param {number} timestamp - Optional timestamp for cache busting
   * @returns {Promise} - API response with certificate printing settings
   */
  getCertificatePrintingSettings: async (eventId, timestamp) => {
    try {
      if (!eventId) {
        console.error('No event ID provided to getCertificatePrintingSettings');
        return {
          success: false,
          message: 'Event ID is required',
          data: { settings: {} }
        };
      }

      console.log(`[getCertificatePrintingSettings] Fetching settings for event: ${eventId}`);
      
      // Try to get settings from resources/settings endpoint first
      const response = await api.get('/resources/settings', {
        params: { 
          eventId: eventId, 
          type: 'certificatePrinting',
          _t: timestamp || Date.now() // Add timestamp parameter for cache busting
        }
      });

      console.log('[getCertificatePrintingSettings] Raw API response:', response.data);
      
      if (response.data && response.data.success) {
        const data = response.data.data || {};
        console.log('[getCertificatePrintingSettings] Settings data object:', data);
        // Format the response in a consistent structure
        const formattedResponse = {
          success: true,
          message: 'Certificate printing settings loaded successfully',
          data: {
            settings: data.settings || {},
            isEnabled: typeof data.isEnabled !== 'undefined' ? data.isEnabled : true
          }
        };
        // Ensure templates array exists
        if (!formattedResponse.data.settings.templates) {
          formattedResponse.data.settings.templates = [];
          console.log('[getCertificatePrintingSettings] Added empty templates array');
        }
        // Ensure enabled property is present in settings
        if (typeof formattedResponse.data.settings.enabled === 'undefined') {
          formattedResponse.data.settings.enabled = formattedResponse.data.isEnabled;
        }
        console.log('[getCertificatePrintingSettings] Formatted response:', formattedResponse);
        return formattedResponse;
      }

      // Fall back to default settings if none found
      console.warn('[getCertificatePrintingSettings] No settings found or invalid response, creating defaults');
      return {
        success: true,
        message: 'Using default certificate printing settings',
        data: {
          settings: {
            enabled: true,
            templates: [
              {
                _id: 'attendance',
                name: 'Attendance Certificate',
                type: 'attendance',
                fields: [{ name: 'name', displayName: 'Full Name', required: true }]
              },
              {
                _id: 'speaker',
                name: 'Speaker Certificate',
                type: 'speaker',
                fields: [
                  { name: 'name', displayName: 'Full Name', required: true },
                  { name: 'presentationTitle', displayName: 'Presentation Title', required: false }
                ]
              }
            ]
          }
        }
      };
    } catch (error) {
      console.error('[getCertificatePrintingSettings] Error:', error);
      if (error.response) {
        console.error('[getCertificatePrintingSettings] Error response:', error.response.data);
      }
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch certificate printing settings',
        data: { 
          settings: {
            enabled: true,
            templates: []
          } 
        }
      };
    }
  },

  /**
   * Process certificate printing
   * @param {string} eventId - Event ID
   * @param {string} resourceOptionId - Resource option ID (template ID)
   * @param {string} qrCode - QR code from the scan
   * @param {Object} certificateData - Additional data for the certificate (name, title, etc.)
   * @returns {Promise} - API response with processing result
   */
  processCertificatePrinting: async (eventId, templateId, registrationId, certificateData) => {
    try {
      if (!eventId || !templateId || !registrationId) {
        return {
          success: false,
          message: 'Missing required parameters',
          data: null
        };
      }

      // Record the certificate printing through the resource usage API
      const usageResponse = await resourceService.recordResourceUsage(
        {
          eventId,
          type: 'certificatePrinting',  // Must match exactly what's in the database
          resourceOptionId: templateId,
          details: {
            option: templateId,
            certificateData
          }
        },
        registrationId
      );

      return usageResponse;
    } catch (error) {
      console.error('Error processing certificate printing:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to process certificate printing',
        data: null
      };
    }
  },

  /**
   * Get resource statistics for an event
   * @param {string} eventId - Event ID
   * @returns {Promise} - API response with resource statistics
   */
  getResourceStatistics: async (eventId) => {
    if (!eventId) {
      console.error('getResourceStatistics called without eventId');
      return {
        success: false,
        message: 'Event ID is required for resource statistics',
        data: null
      };
    }
    try {
      // Assuming the endpoint is nested under events
      const url = `/events/${eventId}/resources/statistics`;
      console.log('Fetching resource statistics from:', url);
      const response = await api.get(url);

      // Check the structure returned by the backend
      if (response && response.data && response.data.success !== undefined) {
        // Assuming backend returns { success: boolean, data: object, message?: string }
        console.log('Received resource statistics:', response.data);
        return response.data;
      } else {
        // Handle unexpected structure or direct data return
        console.warn('Unexpected resource statistics response structure:', response);
        return {
          success: true, // Assume success if data exists
          data: response?.data || {}
        };
      }
    } catch (error) {
      console.error(`Error fetching resource statistics for event ${eventId}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get resource statistics',
        data: null
      };
    }
  },

  /**
   * Void a specific resource usage record
   * @param {string} eventId - Event ID
   * @param {string} registrationId - Registration ID
   * @param {string} resourceUsageId - ID of the resource usage record (Resource._id)
   * @returns {Promise} - API response
   */
  // ... (rest of the service object)

  getCertificatePdfBlob: async (eventId, templateId, registrationId, background = true, options = {}) => {
    if (!eventId || !templateId || !registrationId) {
      console.error('[getCertificatePdfBlob] Missing required IDs', { eventId, templateId, registrationId });
      return { success: false, message: 'Event ID, Template ID, and Registration ID are required.', blob: null, filename: 'error.pdf' };
    }
    let url = `/resources/events/${eventId}/certificate-templates/${templateId}/registrations/${registrationId}/generate-pdf?background=${background}`;
    if (options && options.abstractId) {
      url += `&abstractId=${options.abstractId}`;
    }
    try {
      console.log(`[getCertificatePdfBlob] Fetching PDF from: ${url}`);
      const response = await api.get(url, { 
        responseType: 'blob',
      });

      let filename = `certificate-${registrationId}-${templateId}.pdf`;
      const contentDisposition = response.headers['content-disposition'];
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/i);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }
      console.log(`[getCertificatePdfBlob] Successfully fetched blob. Filename: ${filename}`);
      return { success: true, blob: response.data, filename: filename };
    } catch (error) {
      console.error(`[getCertificatePdfBlob] Error fetching PDF for ${registrationId}:`, error);
      const errorData = error.response?.data;
      let errorMessage = 'Failed to generate or fetch certificate PDF.';
      // If the error response is a blob, it might be a JSON error from the server that needs to be parsed
      if (errorData instanceof Blob && errorData.type === 'application/json') {
        try {
          const errorJson = await errorData.text();
          const parsedError = JSON.parse(errorJson);
          errorMessage = parsedError.message || errorMessage;
        } catch (parseError) {
          console.error('[getCertificatePdfBlob] Error parsing error blob:', parseError);
        }
      } else if (typeof errorData?.message === 'string') {
        errorMessage = errorData.message;
      }
      return { success: false, message: errorMessage, blob: null, filename: 'error.pdf' };
    }
  },

  /**
   * Get abstracts for a registration in an event, with optional status filter
   * @param {string} eventId - Event ID
   * @param {string} registrationId - Registration ObjectId
   * @param {string} [status] - Optional status filter (e.g., 'approved')
   * @returns {Promise} - API response with abstracts
   */
  getAbstractsByRegistration: async (eventId, registrationId, status = 'approved') => {
    try {
      const response = await api.get(`/events/${eventId}/abstracts/by-registration/${registrationId}?status=${status}`);
      return response;
    } catch (error) {
      handleError(error, 'Error fetching abstracts by registration');
      return {
        data: { success: false, message: error.response?.data?.message || 'Failed to fetch abstracts', data: [] }
      };
    }
  },

  /**
   * Get enriched resource usage for a registration (for modal)
   * @param {string} eventId - Event ID
   * @param {string} registrationId - Registration ID
   * @returns {Promise} - API response with enriched resource usage
   */
  getRegistrationResourceUsageModal: async (eventId, registrationId) => {
    try {
      const response = await api.get(`/events/${eventId}/registrations/${registrationId}/resource-usage-modal`);
      return response.data;
    } catch (error) {
      handleError(error, 'Error fetching registration resource usage for modal');
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch registration resource usage',
        data: []
      };
    }
  }
};

// Helper function to get display name for resource type
const getResourceTypeDisplay = (type) => {
  if (!type) return "Resource";
  
  switch (type) {
    case "food":
      return "Food";
    case "kits":
      return "Kit Bag";
    case "certificates":
      return "Certificate";
    default:
      return type.charAt(0).toUpperCase() + type.slice(1);
  }
};

// Helper function to create default statistics data
const createDefaultStatistics = () => {
  return {
    byType: {
      food: { count: 0, today: 0, uniqueAttendees: 0 },
      kits: { count: 0, today: 0, uniqueAttendees: 0 },
      certificates: { count: 0, today: 0, uniqueAttendees: 0 }
    },
    total: 0
  };
};

// Transform counts data to statistics format
const transformCountsToStatistics = (countsData) => {
  const stats = createDefaultStatistics();
  
  // If we have valid counts data, use it
  if (countsData && typeof countsData === 'object') {
    if (countsData.food) {
      stats.byType.food.count = countsData.food.total || 0;
      stats.byType.food.today = countsData.food.today || 0;
      stats.byType.food.uniqueAttendees = countsData.food.unique || 0;
    }
    
    if (countsData.kits) {
      stats.byType.kits.count = countsData.kits.total || 0;
      stats.byType.kits.today = countsData.kits.today || 0;
      stats.byType.kits.uniqueAttendees = countsData.kits.unique || 0;
    }
    
    if (countsData.certificates) {
      stats.byType.certificates.count = countsData.certificates.total || 0;
      stats.byType.certificates.today = countsData.certificates.today || 0;
      stats.byType.certificates.uniqueAttendees = countsData.certificates.unique || 0;
    }
    
    // Calculate total
    stats.total = (stats.byType.food.count || 0) + 
                 (stats.byType.kits.count || 0) + 
                 (stats.byType.certificates.count || 0);
  }
  
  return stats;
};

// Transform database enum values back to UI values
const transformStatisticsForUI = (apiResponse) => {
  // If response is not valid, return as is
  if (!apiResponse || !apiResponse.data) {
    console.error('⚠️ Invalid statistics data format:', apiResponse);
    return apiResponse;
  }

  console.log('🧪 Starting statistics transformation, raw data:', apiResponse.data);
  
  const result = { ...apiResponse };
  const data = { ...result.data };
  
  // Handle case where byType is missing
  if (!data.byType) {
    console.log('⚠️ Missing byType in statistics, creating default structure');
    data.byType = {};
  }
  
  const byType = { ...data.byType };
  
  console.log('🔍 Current byType in API response:', byType);
  
  // Create the UI expected structure with the correct field names
  // The backend now returns the exact database type names (food, kitBag, certificate)
  // but our UI uses UI-friendly names (food, kits, certificates)
  const transformedByType = {
    food: byType.food || { count: 0, today: 0, uniqueAttendees: 0 },
    kits: byType.kitBag || { count: 0, today: 0, uniqueAttendees: 0 },
    certificates: byType.certificate || { count: 0, today: 0, uniqueAttendees: 0 }
  };
  
  console.log('✅ Transformed byType for UI:', transformedByType);
  
  // Update the data structure
  data.byType = transformedByType;
  result.data = data;
  
  return result;
};

/**
 * Normalize resource type for backend API
 */
export function normalizeResourceType(type) {
  switch (type) {
    case "kits": return "kitBag";
    case "kit": return "kitBag";
    case "kitbag": return "kitBag";
    case "certificates": return "certificate";
    case "certificate": return "certificate";
    case "certificateprinting": return "certificatePrinting";
    default: return type;
  }
}

export default resourceService; 