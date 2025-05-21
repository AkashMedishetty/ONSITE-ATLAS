import axios from 'axios';
import api from './api';
import authService from './authService';

// API base URL from environment variable or default
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Helper function to get the auth token
const getAuthToken = () => {
  // If authService has a getToken method, use it
  if (authService && typeof authService.getToken === 'function') {
    return authService.getToken();
  }
  // Otherwise check if we can get it from localStorage
  return localStorage.getItem('token') || '';
};

/**
 * Service for registration-related API calls
 */
const registrationService = {
  /**
   * Get all registrations with optional filtering
   * @param {Object} params - Query parameters (page, limit, status, event, etc.)
   * @returns {Promise} - API response
   */
  getRegistrations: async (eventId, filters = {}) => {
    try {
      console.log('Calling getRegistrations for event:', eventId, 'with filters:', filters);
      
      // Check for valid event ID
      if (!eventId) {
        console.error('getRegistrations called without eventId');
        return {
          success: false,
          message: 'Event ID is required',
          data: [],
          meta: { pagination: { total: 0 } }
        };
      }
      
      const queryParams = new URLSearchParams();
      
      // Add filters to query params
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.category) queryParams.append('category', filters.category);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.page) queryParams.append('page', filters.page);
      if (filters.limit) queryParams.append('limit', filters.limit);
      if (filters.sort) queryParams.append('sort', filters.sort);
      
      const queryString = queryParams.toString();
      const url = `/events/${eventId}/registrations${queryString ? `?${queryString}` : ''}`;
      
      console.log('API request URL:', url);
      const response = await api.get(url);
      
      // Return the *entire* Axios response object
      if (response) {
        console.log("Registrations service received raw Axios response:", response);
        // The component expects the data nested under response.data, 
        // but also needs response.meta. Let's return the whole object.
        // The component will access response.data.data and response.data.meta.
        return response; 
      } else {
        // Handle unexpected case where Axios returns nothing
        console.error('Invalid Axios response structure (response undefined)');
        return {
          // Mock a structure similar to what the component expects on failure
          // Note: The backend structure is { success, message, data, meta }, 
          // so the component accesses response.data.success etc.
          data: {
            success: false,
            message: 'Invalid response structure from API call',
            data: [],
            meta: { pagination: { total: 0, totalPages: 1, page: 1, limit: filters.limit || 10 } }
          }
        };
      }
    } catch (error) {
      console.error('Error in getRegistrations:', error);
      // Try to return the error response if available, 
      // otherwise return a default structure mimicking a failed backend response
      return error.response || {
          data: {
            success: false,
            message: error.message || 'Failed to get registrations',
            data: [],
            meta: { pagination: { total: 0, totalPages: 1, page: 1, limit: filters.limit || 10 } }
          }
      };
    }
  },

  /**
   * Get registration by ID
   * @param {string} id - Registration ID
   * @returns {Promise} - API response
   */
  getRegistration: async (eventId, registrationId) => {
    try {
      const response = await api.get(`/events/${eventId}/registrations/${registrationId}`);
      
      // Extract the data from the response
      if (response && response.data) {
        return response.data;
      }
      
      return response;
    } catch (error) {
      console.error('Error getting registration details:', error);
      return {
        success: false,
        message: error.message || 'Failed to get registration details'
      };
    }
  },

  /**
   * Get a single registration by the user-facing Registration ID string (e.g., "MED25-001")
   * @param {string} eventId - Event ID
   * @param {string} regIdString - The user-facing registration ID string
   * @returns {Promise<object>} - API response { success: boolean, data?: object, token?: string, message?: string }
   */
  getRegistrationByRegIdString: async (eventId, regIdString) => {
    console.log(`Attempting to find registration by string ID: ${regIdString} for event: ${eventId}`);
    if (!eventId || !regIdString) {
      return {
        success: false,
        message: 'Event ID and Registration ID string are required'
      };
    }

    try {
      const filters = { 
          search: regIdString, 
          limit: 1 
      };
      // Use a fresh Axios instance with NO interceptors or Authorization header
      const axiosNoAuth = axios.create();
      const queryParams = new URLSearchParams(filters).toString();
      const url = `${API_URL}/events/${eventId}/registrations?${queryParams}`;
      console.log('[getRegistrationByRegIdString] Making direct public API call to:', url);
      const axiosResponse = await axiosNoAuth.get(url); // No token sent

      if (axiosResponse?.data?.success && axiosResponse.data.token && axiosResponse.data.data) {
        console.log('Registrant login successful, token received:', axiosResponse.data.token);
        return { 
            success: true, 
            data: axiosResponse.data.data, // This is the single registrant object
            token: axiosResponse.data.token // This is the JWT
        }; 
      } else if (axiosResponse?.data?.success && Array.isArray(axiosResponse.data.data)) {
        if (axiosResponse.data.data.length === 1) {
          const foundReg = axiosResponse.data.data[0];
          console.log(`Found registration (no token path):`, foundReg);
          return { success: true, data: foundReg }; 
        } else if (axiosResponse.data.data.length === 0) {
          console.log(`No registration found with ID string: ${regIdString}`);
          return { success: false, message: 'Registration ID not found for this event.'}; 
        } else {
          console.warn(`Multiple registrations found for ID string: ${regIdString}`, axiosResponse.data.data);
          return { success: false, message: 'Multiple registrations found, please contact support.' }; 
        }
      } else {
        console.error('Failed to get registration by ID string, unexpected response format from getRegistrations:', axiosResponse?.data);
        return {
          success: false,
          message: axiosResponse?.data?.message || 'Failed to find registration by ID string due to unexpected format.'
        };
      }
    } catch (error) {
      console.error('Error in getRegistrationByRegIdString:', error);
      return {
        success: false,
        message: error.message || 'An unexpected error occurred while finding the registration.'
      };
    }
  },

  /**
   * Create registration
   * @param {Object} registrationData - Registration data containing eventId and other fields
   * @returns {Promise} - API response
   */
  createRegistration: async (registrationData) => {
    console.log(`Creating registration for event ID: ${registrationData.eventId}`);
    console.log('Registration data:', registrationData);
    
    try {
      if (!registrationData || !registrationData.eventId) {
        console.error('Error: No event ID provided in registration data');
        return {
          success: false,
          message: 'Event ID is required'
        };
      }
      
      // Ensure eventId is a string
      const eventIdStr = String(registrationData.eventId);
      
      // Use the standard API route for events/:eventId/registrations
      const url = `${API_URL}/events/${eventIdStr}/registrations`;
      
      console.log('Sending request to:', url);
      
      // Don't remove eventId from the data - the API might be expecting it in both places
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify(registrationData)
      });
      
      // Check if we can parse the response as JSON
      let data;
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          data = await response.json();
        } else {
          const text = await response.text();
          console.log('Non-JSON response:', text);
          data = { message: text || 'Unknown error' };
        }
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
        data = { message: 'Failed to parse server response' };
      }
      
      if (!response.ok) {
        console.error('API Error:', data);
        return {
          success: false,
          message: data.message || `Failed to create registration. Server returned ${response.status}`,
          status: response.status
        };
      }
      
      // Log the response data for debugging
      console.log('Registration success response:', data);
      
      // Log specific fields to help troubleshoot ID issues
      if (data) {
        console.log('Registration ID field present?', data.registrationId ? 'Yes' : 'No');
        console.log('_id field present?', data._id ? 'Yes' : 'No');
        if (typeof data === 'object') {
          console.log('Available fields in response data:', Object.keys(data));
          // Check if the data might be nested
          Object.keys(data).forEach(key => {
            if (typeof data[key] === 'object' && data[key] !== null) {
              console.log(`Nested fields in ${key}:`, Object.keys(data[key]));
            }
          });
        }
      }
      
      return {
        success: true,
        data,
        message: 'Registration created successfully'
      };
    } catch (error) {
      console.error('Registration service error:', error);
      return {
        success: false,
        message: error.message || 'An unexpected error occurred during registration',
        error
      };
    }
  },

  /**
   * Update registration
   * @param {string} eventId - Event ID
   * @param {string} registrationId - Registration ID
   * @param {Object} registrationData - Updated registration data
   * @returns {Promise} - API response
   */
  updateRegistration: async (eventId, registrationId, registrationData) => {
    try {
      console.log(`Updating registration: ${registrationId} for event: ${eventId}`, registrationData);
      
      // Validate required parameters
      if (!eventId) {
        return {
          success: false,
          message: 'Event ID is required',
        };
      }
      
      if (!registrationId) {
        return {
          success: false,
          message: 'Registration ID is required',
        };
      }
      
      // Make sure eventId is a string, not an object
      const eventIdString = typeof eventId === 'object' && eventId.id ? eventId.id : String(eventId);
      
      // Call the API
      const response = await api.put(`/events/${eventIdString}/registrations/${registrationId}`, registrationData);
      return response; // Return the whole Axios response object as components might expect response.data.data etc.
    } catch (error) {
      console.error('Error updating registration:', error);
      return error.response || { // Return error.response or a compatible structure
        data: {
          success: false,
          message: error.message || 'Failed to update registration',
        }
      };
    }
  },

  /**
   * Delete registration
   * @param {string} eventId - Event ID
   * @param {string} registrationId - Registration ID
   * @returns {Promise} - API response
   */
  deleteRegistration: async (eventId, registrationId) => {
    try {
      console.log('Deleting registration ID:', registrationId, 'for event ID:', eventId);
      const response = await api.delete(`/events/${eventId}/registrations/${registrationId}`);
      return response.data; // Typically, a delete might return a success message or the deleted object ID
    } catch (error) {
      console.error('Error deleting registration:', error);
      // Return a structured error compatible with how other errors are handled
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to delete registration',
        error: error.response?.data || error
      };
    }
  },

  /**
   * Check in a registration
   * @param {string} eventId - Event ID
   * @param {string} registrationId - Registration ID
   * @returns {Promise} - API response
   */
  checkIn: async (eventId, registrationId) => {
    try {
      console.log(`Checking in registration: ${registrationId} for event: ${eventId}`);
      
      if (!eventId || !registrationId) {
        return {
          success: false,
          message: 'Event ID and Registration ID are required for check-in',
        };
      }
      
      // Call the specific check-in endpoint
      const response = await api.patch(`/events/${eventId}/registrations/${registrationId}/check-in`);
      // Assuming the backend endpoint returns the updated registration or success message in response.data
      return response; 
    } catch (error) {
      console.error('Error checking in registration:', error);
      return {
        // Return the error response structure if available
        ...(error.response || {}),
        // Ensure a standard failure structure otherwise
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to check in registration',
      };
    }
  },

  /**
   * Scan a registration (by QR code or ID)
   * @param {string} eventId - Event ID
   * @param {Object} scanData - Scan data
   * @returns {Promise} - API response
   */
  scanRegistration: async (eventId, scanData) => {
    return api.post(`/events/${eventId}/registrations/scan`, scanData);
  },

  /**
   * Bulk import registrations from processed data - MODIFIED FOR ASYNC PROCESSING
   * @param {string} eventId - The ID of the event to import into
   * @param {Array<Object>} registrations - Array of registration objects to import
   * @param {string} [originalFileName] - Optional original file name for tracking
   * @returns {Promise<Object>} - The API response, expected to contain { jobId: 'some_id' } on success.
   */
  bulkImport: async (eventId, registrations, originalFileName) => {
    try {
      console.log(`[bulkImport] Initiating import for event: ${eventId}. Records: ${registrations.length}`);
      
      if (!eventId) {
        console.error("[bulkImport] Event ID is required.");
        return {
          // Mimic Axios response structure on client-side validation failure
          data: {
            success: false, 
            message: "Event ID is required.",
          }
        };
      }
      
      if (!registrations || registrations.length === 0) {
        console.warn("[bulkImport] No registration data provided.");
        return {
          data: {
            success: false, 
            message: "No registration data to import.",
          }
        };
      }

      // The backend now expects registrations and optionally originalFileName
      const payload = { registrations, originalFileName };
      const response = await api.post(`/events/${eventId}/registrations/import`, payload);
      
      // The immediate response should be a 202 with a jobId
      console.log("[bulkImport] API Response (job initiated):", response);
      
      // Return the whole Axios response object. The component will look for response.data.jobId
      // and also handle potential errors if the job initiation failed.
      return response; 

    } catch (error) {
      console.error('[bulkImport] Error initiating import job:', error);
      if (error.response && error.response.data) {
        console.error("Backend error details on job initiation:", error.response.data);
        return error.response; // Return the full error response
      }
      return {
        data: { 
          success: false,
          message: error.message || 'An unknown error occurred while initiating bulk import.',
        }
      };
    }
  },

  /**
   * Get the status of a bulk import job.
   * @param {string} jobId - The ID of the import job.
   * @returns {Promise<Object>} - The API response containing the job details.
   */
  getImportJobStatus: async (jobId) => {
    try {
      const response = await api.get(`/import-jobs/${jobId}/status`);
      console.log(`[getImportJobStatus] API Response for job ${jobId}:`, response);
      // The backend sends { success: true, message: '...', data: jobObject }
      // The component (BulkImportWizard) using this will expect jobStatusResponse.data to be the jobObject.
      return response.data; 
    } catch (error) {
      console.error(`[getImportJobStatus] Error fetching status for job ${jobId}:`, error.response || error);
      // Rethrow the error so the calling component can inspect error.response.status etc.
      throw error; 
    }
  },

  /**
   * Export registrations to Excel
   * @param {string} eventId - Event ID
   * @param {Object} params - Export parameters (format, filters, etc.)
   * @returns {Promise<Blob|Object>} - A Blob containing the file or an error object
   */
  exportRegistrations: async (eventId, params = {}) => {
    try {
      const url = `/events/${eventId}/registrations/export`;
      
      // --- Tell Axios to expect a Blob --- 
      const response = await api.get(url, { 
        params: params, // Pass any filter/format params here
        responseType: 'blob' // <--- Important: Expect a Blob response
      });
      
      // On success, Axios puts the blob directly in the `data` property
      return response.data; 
      
    } catch (error) {
      console.error('Error exporting registrations:', error);
      // Return a standard error object structure for consistency
      return { 
        success: false, 
        message: error.response?.data?.message || error.message || 'Failed to export registrations' 
      };
    }
  },

  /**
   * Get registration statistics for an event
   * @param {string} eventId - The ID of the event
   * @returns {Promise<object>} - API response with statistics
   */
  getRegistrationStatistics: async (eventId) => {
    if (!eventId) {
      console.error('getRegistrationStatistics called without eventId');
      return {
        success: false,
        message: 'Event ID is required for statistics',
        data: null
      };
    }
    try {
      // Assuming the endpoint is nested under events
      const url = `/events/${eventId}/registrations/statistics`;
      console.log('Fetching registration statistics from:', url);
      const response = await api.get(url);
      
      // Check the structure returned by the backend
      if (response && response.data && response.data.success !== undefined) {
        // Assuming backend returns { success: boolean, data: object, message?: string }
        console.log('Received registration statistics:', response.data);
        return response.data; 
      } else {
        // Handle unexpected structure or direct data return
        console.warn('Unexpected registration statistics response structure:', response);
        return {
          success: true, // Assume success if data exists but structure is odd
          data: response?.data || {}
        };
      }
    } catch (error) {
      console.error(`Error fetching registration statistics for event ${eventId}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get registration statistics',
        data: null
      };
    }
  },

  // Get registrations by category
  getRegistrationsByCategory: async (eventId, categoryId, params = {}) => {
    try {
      if (!eventId || !categoryId) {
        return {
          success: false,
          message: 'Event ID and Category ID are required',
          data: []
        };
      }

      const response = await api.get(`/events/${eventId}/categories/${categoryId}/registrations`, { params });
      return response.data;
    } catch (error) {
      console.error(`Error fetching registrations for category ${categoryId}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch registrations for this category',
        data: []
      };
    }
  },

  /**
   * Get registrations for a specific category within an event
   * @param {string} eventId - Event ID
   * @param {string} categoryId - Category ID
   * @returns {Promise} - API response
   */
  getCategoryRegistrations: async (eventId, categoryId) => {
    try {
      console.log(`[registrationService] Fetching registrations for event ${eventId}, category ${categoryId}`);
      
      if (!eventId || !categoryId) {
        throw new Error('Event ID and Category ID are required');
      }
      
      // Construct the CORRECT nested URL with categoryId as a query parameter
      const url = `/events/${eventId}/registrations?category=${categoryId}`;
      console.log(`[registrationService] Calling API: GET ${url}`);
      
      // Use the standard api instance (which includes interceptors, base URL etc.)
      const response = await api.get(url);
      
      console.log(`[registrationService] Response for category ${categoryId}:`, response.data);

      // Check if the response indicates success (adjust based on your actual API structure)
      // Assuming the structure is { success: boolean, data: [...] }
      if (response && response.data && response.data.success) {
        return {
          success: true,
          // Ensure data is returned correctly, maybe nested under response.data.data
          data: response.data.data || [], 
          // Include pagination/count if available
          count: response.data.meta?.pagination?.total || (response.data.data || []).length 
        };
      } else {
        // Handle cases where the API call succeeded (status 2xx) but the operation failed
        return {
          success: false,
          message: response?.data?.message || 'Failed to fetch category registrations'
        };
      }
    } catch (error) {
      console.error(`Error fetching registrations for category ${categoryId}:`, error);
      // Return a consistent error format
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to get category registrations'
      };
    }
  },
  
  /**
   * Export registrations for a specific category
   * @param {string} eventId - Event ID
   * @param {string} categoryId - Category ID
   * @returns {Promise} - API response (typically the blob for download)
   */
  exportCategoryRegistrations: async (eventId, categoryId) => {
    try {
      if (!eventId || !categoryId) {
        console.error('Event ID and category ID are required for export.')
        return {
          success: false,
          message: 'Event ID and category ID are required',
        };
      }

      // Construct the CORRECT URL: Use the main export endpoint with category as a query param
      const url = `/events/${eventId}/registrations/export?category=${categoryId}`;
      console.log(`[exportCategoryRegistrations] Calling API: GET ${url}`);

      // Make the GET request, expecting a blob response for file download
      const response = await api.get(url, { responseType: 'blob' });

      // Return the raw Axios response which includes the blob data and headers
      return response;

    } catch (error) {
      console.error('Error exporting category registrations:', error);
      // Return the error response if available, otherwise a generic error
      return error.response || {
          // Mimic structure for consistency if needed by caller, but data won't be blob
          data: {
             success: false,
             message: error.message || 'Failed to export registrations'
          }
      };
    }
  },

  /**
   * Send certificate to a registrant via email
   * @param {string} eventId - Event ID
   * @param {string} registrationId - Registration ID
   * @param {Object} options - Certificate options (type, includeQR, etc.)
   * @returns {Promise} - API response
   */
  sendCertificate: async (eventId, registrationId, options) => {
    try {
      if (!eventId || !registrationId) {
        console.error('Missing required parameters in sendCertificate');
        return {
          success: false,
          message: 'Event ID and Registration ID are required'
        };
      }
      
      if (!options || !options.certificateType) {
        console.error('Certificate type is required');
        return {
          success: false,
          message: 'Certificate type is required'
        };
      }
      
      const response = await api.post(
        `/events/${eventId}/registrations/${registrationId}/send-certificate`, 
        options
      );
      
      return response.data || response;
    } catch (error) {
      console.error('Error sending certificate:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to send certificate'
      };
    }
  },

  /**
   * Get resource usage for a registration
   * @param {string} eventId - Event ID
   * @param {string} registrationId - Registration ID
   * @returns {Promise} - API response with resource usage data
   */
  getResourceUsage: async (eventId, registrationId) => {
    try {
      console.log(`Getting resource usage for registration ${registrationId} in event ${eventId}`);
      const response = await api.get(`/events/${eventId}/registrations/${registrationId}/resources`);
      // Return the data part of the response, which should have { success, data, ... }
      return response.data; 
    } catch (error) {
      console.error('Error getting resource usage:', error);
      return {
        success: false,
        message: error.message || 'Failed to get resource usage',
        data: []
      };
    }
  },

  /**
   * Update resource usage for a registration
   * @param {string} eventId - Event ID
   * @param {string} registrationId - Registration ID
   * @param {string} resourceId - Resource ID
   * @param {Object} updateData - Update data
   * @returns {Promise} - API response
   */
  updateResourceUsage: async (eventId, registrationId, resourceId, updateData) => {
    try {
      console.log(`Updating resource usage for registration ${registrationId}, resource ${resourceId}`);
      const response = await api.put(
        `/events/${eventId}/registrations/${registrationId}/resources/${resourceId}`, 
        updateData
      );
      return response;
    } catch (error) {
      console.error('Error updating resource usage:', error);
      return {
        success: false,
        message: error.message || 'Failed to update resource usage'
      };
    }
  },

  /**
   * Void a specific resource usage record
   * @param {string} eventId - Event ID
   * @param {string} registrationId - Registration ID
   * @param {string} resourceUsageId - The ID of the Resource record to void
   * @returns {Promise} - API response
   */
  voidResourceUsage: async (eventId, registrationId, resourceUsageId) => {
    try {
      console.log(`[voidResourceUsage] Voiding resource ${resourceUsageId} for reg ${registrationId} in event ${eventId}`);
      const response = await api.put(
        `/events/${eventId}/registrations/${registrationId}/resources/${resourceUsageId}/void`
      );
      // Return the full Axios response
      return response;
    } catch (error) {
      console.error('Error voiding resource usage:', error);
      // Return the full error response if available
      return error.response || {
          data: {
              success: false,
              message: error.message || 'Failed to void resource usage'
          }
      };
    }
  },

  /**
   * Generate badge for a registration
   * @param {string} eventId - Event ID
   * @param {string} registrationId - Registration ID
   * @param {Object} options - Badge options (type, includeQR, etc.)
   * @returns {Promise} - API response with badge URL
   */
  generateBadge: async (eventId, registrationId, options = {}) => {
    try {
      console.log(`Generating badge for registration ${registrationId} in event ${eventId}`, options);
      if (!eventId || !registrationId) {
        return {
          success: false,
          message: 'Event ID and Registration ID are required'
        };
      }
      
      const response = await api.post(
        `/events/${eventId}/registrations/${registrationId}/generate-badge`, 
        options
      );
      
      return response.data || response;
    } catch (error) {
      console.error('Error generating badge:', error);
      return {
        success: false,
        message: error.message || 'Failed to generate badge'
      };
    }
  },

  /**
   * Update registration status (check-in, cancel, etc.)
   * @param {string} eventId - Event ID
   * @param {string} registrationId - Registration ID
   * @param {Object} data - Status update data with action field
   * @returns {Promise} - API response
   */
  updateRegistrationStatus: async (eventId, registrationId, data) => {
    try {
      console.log(`Updating registration status for ${registrationId} in event ${eventId}`, data);
      
      if (!eventId || !registrationId) {
        return {
          success: false,
          message: 'Event ID and Registration ID are required'
        };
      }
      
      const response = await api.patch(
        `/events/${eventId}/registrations/${registrationId}/status`,
        data
      );
      
      return response.data || response;
    } catch (error) {
      console.error('Error updating registration status:', error);
      return {
        success: false,
        message: error.message || 'Failed to update registration status'
      };
    }
  },

  /**
   * Import registrations from file
   * @param {string} eventId - Event ID
   * @param {File} file - File object
   * @returns {Promise} - API response
   */
  importRegistrations: async (eventId, file) => {
    // ... (existing import function)
  },

  /**
   * Check-in registration
   * @param {string} eventId - Event ID
   * @param {string} registrationId - Registration ID
   * @returns {Promise} - API response
   */
  checkInRegistration: async (eventId, registrationId) => {
    // ... (existing check-in function)
  },
};

export default registrationService; 