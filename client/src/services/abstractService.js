import api from './api'; // Main API instance
import apiRegistrant from './apiRegistrant'; // Registrant-specific API instance
import { REGISTRANT_TOKEN_KEY } from '../config';
import { getRegistrantAuthHeader } from '../utils/authUtils';

/**
 * Service for managing abstract submissions
 */
const abstractService = {
  /**
   * Get all abstracts for an event OR a specific registrant's abstracts
   * @param {string} eventId - Event ID to get abstracts for
   * @param {Object} params - Query parameters for filtering (e.g., { registration: registrantId })
   * @returns {Promise<object>} - API response ({ success: boolean, data: [], count: number } or error structure)
   */
  getAbstracts: async (eventId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = `/events/${eventId}/abstracts${queryString ? `?${queryString}` : ''}`;
    
    console.log(`[AbstractService] Fetching abstracts (registrant) from: ${url}`);
    
    try {
      const response = await apiRegistrant.get(url, { params });
      return response.data;
    } catch (error) {
      console.error('[AbstractService] Exception fetching abstracts (registrant):', error.response?.data || error.message);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch abstracts for registrant',
        status: error.response?.status,
        data: [],
        count: 0
      };
    }
  },

  /**
   * Get a single abstract by ID
   * @param {string} eventId - Event ID
   * @param {string} abstractId - Abstract ID to fetch
   * @returns {Promise} - API response with abstract data
   */
  getAbstractById: async (eventId, abstractId) => {
    try {
      // Debug logging for eventId, abstractId, and token
      const token = localStorage.getItem('atlas_registrant_token') || localStorage.getItem('registrantToken');
      console.log('[AbstractService][getAbstractById] eventId:', eventId, 'abstractId:', abstractId, 'token:', token ? token.substring(0, 16) + '...' : 'NOT FOUND');
      const response = await apiRegistrant.get(`/events/${eventId}/abstracts/${abstractId}`);
      return response.data; // Assumes api instance returns data directly or it's handled in a wrapper
    } catch (error) {
      console.error('Error getting abstract by ID:', error.response?.data || error.message);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to get abstract details', 
        data: null 
      };
    }
  },

  /**
   * Create a new abstract submission
   * @param {string} eventId - Event ID
   * @param {Object} abstractData - Abstract submission data
   * @returns {Promise<object>} - API response { success: boolean, data?: object, message?: string, details?: any }
   */
  createAbstract: async (eventId, abstractData) => {
    if (!eventId) return { success: false, message: 'Missing event ID' };
    if (!abstractData.title || !abstractData.authors || !abstractData.content) {
        return { success: false, message: 'Missing required fields (title, authors, content)' };
    }

    const cleanedData = { ...abstractData };
    if (cleanedData.registration) cleanedData.registration = String(cleanedData.registration);
    if (cleanedData.category) cleanedData.category = String(cleanedData.category);

    const url = `/events/${eventId}/abstracts`;
    console.log("[AbstractService] Creating abstract (registrant) for URL:", url);

    try {
      const response = await apiRegistrant.post(url, cleanedData);
      return response.data;
    } catch (error) {
      console.error('[AbstractService] Exception creating abstract (registrant):', error.response?.data || error.message);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to create abstract', 
        status: error.response?.status,
        details: error.response?.data?.details
      };
    }
  },

  /**
   * Update an existing abstract
   * @param {string} eventId - Event ID
   * @param {string} abstractId - Abstract ID to update
   * @param {Object} abstractData - Updated abstract data
   * @returns {Promise} - API response with updated abstract
   */
  updateAbstract: async (eventId, abstractId, abstractData) => {
    try {
      const response = await api.put(`/events/${eventId}/abstracts/${abstractId}`, abstractData);
      return response.data;
    } catch (error) {
      console.error('Error updating abstract:', error.response?.data || error.message);
      return { success: false, message: error.response?.data?.message || 'Failed to update abstract', data: null };
    }
  },

  /**
   * Update abstract review status
   * @param {string} eventId - Event ID
   * @param {string} abstractId - Abstract ID to update
   * @param {string} status - New status (draft, submitted, under-review, approved, rejected)
   * @returns {Promise} - API response with updated abstract
   */
  updateAbstractStatus: async (eventId, abstractId, status) => {
    try {
      const response = await api.put(`/events/${eventId}/abstracts/${abstractId}/status`, { status });
      return response.data;
    } catch (error) {
      console.error('Error updating abstract status:', error.response?.data || error.message);
      return { success: false, message: error.response?.data?.message || 'Failed to update abstract status', data: null };
    }
  },

  /**
   * Delete an abstract
   * @param {string} eventId - Event ID
   * @param {string} abstractId - Abstract ID to delete
   * @returns {Promise<object>} - API response object { success: boolean, message?: string }
   */
  deleteAbstract: async (eventId, abstractId) => {
    const url = `${API_URL}/events/${eventId}/abstracts/${abstractId}`;
    console.log(`[AbstractService] Attempting to delete abstract: DELETE ${url}`);
    
    try {
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          ...getRegistrantAuthHeader() // Use registrant header
        }
      });

      // Check if the response indicates success (e.g., 200 OK or 204 No Content)
      if (response.ok) {
        let responseData = { success: true, message: 'Abstract deleted successfully.' };
        // Try to parse JSON if content type suggests it, otherwise assume success based on status
        try {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const data = await response.json();
                // Merge backend response message if available
                responseData = { ...responseData, ...data }; 
            }
        } catch(e) { /* Ignore parsing errors on success */ }

        console.log('[AbstractService] Delete successful:', responseData);
        return responseData;
      } else {
        // Handle error response
        let errorData = { message: `HTTP error! status: ${response.status}` };
        try {
            const data = await response.json();
            errorData = data; // Use error data from backend if available
        } catch(e) { /* Ignore parsing errors on error */ }
        
        console.error(`[AbstractService] Error deleting abstract (${response.status}):`, errorData);
        const error = new Error(errorData?.message || `HTTP error! status: ${response.status}`);
        error.status = response.status;
        error.responseBody = errorData;
        throw error; // Throw error to be caught by the outer catch
      }
    } catch (error) {
      console.error('[AbstractService] Exception deleting abstract:', error);
      // Return a consistent error structure
      return {
        success: false,
        message: error.message || 'Failed to delete abstract due to a network or parsing error.',
        status: error.status
      };
    }
  },

  /**
   * Upload a file for an abstract
   * @param {string} eventId - Event ID the abstract belongs to
   * @param {string} abstractId - Abstract ID to upload file for
   * @param {File} file - File to upload
   * @returns {Promise} - API response with file upload status
   */
  uploadAbstractFile: async (eventId, abstractId, file) => {
    if (!eventId) return { success: false, message: 'Event ID is required for file upload' };
    if (!abstractId) return { success: false, message: 'Abstract ID is required for file upload' };
    if (!file) return { success: false, message: 'No file provided for upload' };
      
      const formData = new FormData();
    formData.append('file', file); // The backend multer middleware expects a field named 'file'

    const url = `/events/${eventId}/abstracts/${abstractId}/file`;
    console.log(`[AbstractService] Uploading abstract file (registrant) to: ${url}`);

    try {
      // Use apiRegistrant.post for FormData. Axios will set Content-Type to multipart/form-data.
      // The apiRegistrant interceptor will add the registrant auth token.
      const response = await apiRegistrant.post(url, formData);
      // No need to manually set Content-Type header for FormData with Axios
      
      return response.data; // Assuming backend returns { success: true, message: ..., data: ... }
    } catch (error) {
      console.error('Error uploading file (registrant via apiRegistrant):', error.response?.data || error.message);
      return {
        success: false,
        message: error.response?.data?.message || 'An unexpected error occurred during file upload.',
        // status: error.response?.status // if you need to pass status back
      };
    }
  },

  /**
   * Download all abstracts for an event
   * @param {string} eventId - Event ID to download abstracts for
   * @param {Object} params - Filter parameters
   * @returns {Promise} - API response with file URL
   */
  downloadAbstracts: async (eventId, format = 'excel') => {
    try {
      const response = await api.get(
        `/events/${eventId}/abstracts/download`,
        { params: { format }, responseType: 'blob' }
      );
      // Create a download link (this part remains client-side JS)
      const url = window.URL.createObjectURL(new Blob([response.data])); // response.data is the blob from api.get
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `abstracts-${eventId}.${format === 'excel' ? 'xlsx' : format}`);
    document.body.appendChild(link);
    link.click();
    link.remove();
      window.URL.revokeObjectURL(url);
    return { success: true };
    } catch (error) {
      console.error('Error in downloadAbstracts:', error.response?.data || error.message);
      return { success: false, message: error.response?.data?.message || 'Failed to download abstracts' };
    }
  },

  /**
   * Add a review comment to an abstract
   * @param {string} eventId - Event ID
   * @param {string} abstractId - Abstract ID to add comment to
   * @param {string} comment - Comment text
   * @returns {Promise} - API response with updated abstract
   */
  addReviewComment: async (eventId, abstractId, comment) => {
    try {
      const response = await api.post(`/events/${eventId}/abstracts/${abstractId}/comments`, { comment });
      return response.data;
    } catch (error) {
      console.error('Error adding review comment:', error.response?.data || error.message);
      return { success: false, message: error.response?.data?.message || 'Failed to add review comment', data: null };
    }
  },

  /**
   * Get abstracts for a specific registration
   * @param {string} eventId - Event ID to get abstracts for
   * @param {string} registrationId - Registration ID to get abstracts for
   * @returns {Promise} - API response with abstracts data
   */
  getAbstractsByRegistration: async (eventId, registrationId) => {
    try {
      console.log(`Fetching abstracts for event ${eventId} with registration ID ${registrationId}`);
      
      if (!registrationId) {
        return {
          success: false,
          message: 'Registration ID is required',
          data: []
        };
      }
      
      // Step 1: Try to get the MongoDB ID for this registration
      let registrationMongoId = null;
      
      try {
        const regResponse = await api.get(`/registrations?registrationId=${registrationId}`);
        
        if (regResponse.data && regResponse.data.success && 
            regResponse.data.data && regResponse.data.data.length > 0) {
          registrationMongoId = regResponse.data.data[0]._id;
          console.log(`✅ Found MongoDB ID for registration ${registrationId}: ${registrationMongoId}`);
        } else {
          console.log(`⚠️ Could not find MongoDB ID for registration: ${registrationId}`);
        }
      } catch (error) {
        console.error('Error getting registration MongoDB ID for abstracts:', error.response?.data || error.message);
        // Don't necessarily fail the whole abstract fetch, backend might handle short ID
      }
      
      const queryParams = { registrationId };
      if (registrationMongoId) queryParams.registration = registrationMongoId;
      
      console.log('Using query parameters:', queryParams);
      
      // Step 3: Fetch abstracts with all available IDs
      const response = await api.get(`/events/${eventId}/abstracts`, { params: queryParams });
      
      console.log(`API returned ${response.data.data?.length || 0} abstracts`);
      
      // Step 4: Client-side filtering by MongoDB ID
      if (response.data.success && Array.isArray(response.data.data)) {
        const allAbstracts = response.data.data;
        
        // If we have a MongoDB ID, apply strict filtering
        if (registrationMongoId) {
          console.log(`Applying strict MongoDB ID filtering with: ${registrationMongoId}`);
          
          const filteredAbstracts = allAbstracts.filter(abstract => {
            // Try to get registration ID in different formats
            const abstractRegId = 
              (typeof abstract.registration === 'object' ? abstract.registration._id : abstract.registration) || 
              (abstract.registrationInfo ? abstract.registrationInfo._id : null);
            
            // Use string comparison to avoid reference issues
            const isMatch = String(abstractRegId) === String(registrationMongoId);
            
            if (!isMatch) {
              console.log(`❌ Filtering out abstract ${abstract._id} - registration mismatch`);
            }
            
            return isMatch;
          });
          
          console.log(`After MongoDB ID filtering: ${filteredAbstracts.length} abstracts remain`);
          response.data.data = filteredAbstracts;
        }
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching abstracts for registration:', error.response?.data || error.message);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch abstracts for this registration',
        data: []
      };
    }
  },

  /**
   * Get all abstracts for a specific event (intended for Admin/Staff view)
   * @param {string} eventId - Event ID to get abstracts for
   * @param {Object} params - Query parameters for filtering (passed by admin UI)
   * @returns {Promise} - API response with abstracts data
   */
  getAbstractsByEvent: async (eventId, params = {}) => {
    try {
      const response = await api.get(`/events/${eventId}/abstracts/all-event-abstracts`, { params });
      return response.data; 
    } catch (error) {
      console.error('Error fetching abstracts for event:', error.response?.data || error.message);
      return { success: false, message: error.response?.data?.message || 'Failed to fetch abstracts for event', data: [] };
    }
  },

  /**
   * Get abstract statistics for an event
   * @param {string} eventId - Event ID
   * @returns {Promise} - API response with abstract statistics
   */
  getAbstractStatistics: async (eventId) => {
    if (!eventId) {
      console.error('getAbstractStatistics called without eventId');
      return {
        success: false,
        message: 'Event ID is required for abstract statistics',
        data: null
      };
    }
    try {
      const response = await api.get(`/events/${eventId}/abstracts/statistics`);
        return response.data;
    } catch (error) {
      console.error(`Error fetching abstract statistics for event ${eventId}:`, error.response?.data || error.message);
      return { success: false, message: error.response?.data?.message || 'Failed to get abstract statistics', data: null };
    }
  },

  /**
   * Bulk export abstracts
   * @param {string} eventId - Event ID
   * @param {Object} filters - { exportMode, category, topic, minScore, maxScore }
   * @returns {Promise<{success: boolean, message: string, data: {fileUrl: string}}>} - Export result
   */
  exportAbstracts: async (eventId, filters = {}) => {
    try {
      const params = { ...filters };
      console.log('[abstractService] Calling export API with params:', params);
      const response = await api.get(
        `/events/${eventId}/abstracts/download`,
        { params, responseType: 'blob' }
      );
      
      // Get filename from Content-Disposition header if available
      let filename = '';
      const contentDisposition = response.headers['content-disposition'];
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      // If no filename from headers, create one based on exportMode
      if (!filename) {
        const fileExtension = params.exportMode === 'files-only' ? 'zip' : 
                              (params.exportMode && params.exportMode.startsWith('excel')) ? 'xlsx' : 'zip';
        filename = `abstracts-${eventId}.${fileExtension}`;
      }
      
      console.log('[abstractService] Using filename:', filename);
      
      // Create blob URL and return it
      const fileUrl = window.URL.createObjectURL(new Blob([response.data]));
      
      return { 
        success: true, 
        message: 'Export successful', 
        data: { 
          fileUrl,
          filename,
          contentType: response.headers['content-type']
        } 
      };
    } catch (error) {
      console.error('Error exporting abstracts:', error.response?.data || error.message);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to export abstracts',
        data: null
      };
    }
  },

  // Submit an abstract attachment
  uploadAttachment: async (id, fileData) => {
    const url = `/abstracts/${id}/attachment`;
    console.log(`[AbstractService] Uploading attachment (assumed registrant) to: ${url}`);
    try {
      const response = await apiRegistrant.post(url, fileData);
      return response.data;
    } catch (error) {
      console.error(`Error uploading attachment for abstract ${id} (assumed registrant):`, error.response?.data || error.message);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to upload attachment',
        data: null
      };
    }
  },

  /**
   * Validate a registration ID for abstract submission
   * @param {string} eventId - Event ID
   * @param {string} registrationId - Registration ID to validate
   * @returns {Promise} - API response with validation result
   */
  validateRegistrationId: async (eventId, registrationId) => {
    try {
      const response = await api.post(`/events/${eventId}/abstracts/validate-registration`, { registrationId });
      return response.data;
    } catch (error) {
      console.error('Error validating registration ID:', error.response?.data || error.message);
      return { success: false, message: error.response?.data?.message || 'Invalid registration ID', data: null };
    }
  },

  /**
   * Upload an attachment to an abstract
   * @param {string} abstractId - The ID of the abstract
   * @param {FormData} fileData - FormData containing the file
   * @returns {Promise} - API response
   */
  uploadAbstractAttachment: async (abstractId, fileData) => {
    const url = `/abstracts/${abstractId}/attachments`;
    console.log(`[AbstractService] Uploading abstract attachment (assumed registrant) to: ${url}`);
    try {
      const response = await apiRegistrant.post(url, fileData);
      return response.data;
    } catch (error) {
      console.error('Error uploading abstract attachment (assumed registrant):', error.response?.data || error.message);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to upload attachment'
      };
    }
  },

  // Get abstracts pending review
  getPendingReviews: async (eventId) => {
    try {
      const response = await api.get(`/events/${eventId}/abstracts/pending-reviews`);
    return response.data;
    } catch (error) {
      console.error('Error getting pending reviews:', error.response?.data || error.message);
      return { success: false, message: error.response?.data?.message || 'Failed to get pending reviews', data: [] };
    }
  },
  
  // Get abstracts assigned to the current user for review
  getMyAssignedReviews: async (eventId) => {
    try {
      const response = await api.get(`/events/${eventId}/abstracts/my-reviews`);
    return response.data;
    } catch (error) {
      console.error('Error getting my assigned reviews:', error.response?.data || error.message);
      return { success: false, message: error.response?.data?.message || 'Failed to get my reviews', data: [] };
    }
  },
  
  // Get statistics about abstracts
  getStatistics: async (eventId) => {
    try {
      const response = await api.get(`/events/${eventId}/abstracts/review-statistics`);
    return response.data;
    } catch (error) {
      console.error('Error getting review statistics:', error.response?.data || error.message);
      return { success: false, message: error.response?.data?.message || 'Failed to get review statistics', data: [] };
    }
  },
  
  // Assign reviewers to an abstract
  assignReviewers: async (eventId, abstractId, reviewerIds) => {
    try {
      const response = await api.post(`/events/${eventId}/abstracts/${abstractId}/assign-reviewers`, { reviewerIds });
    return response.data;
    } catch (error) {
      console.error('Error assigning reviewers:', error.response?.data || error.message);
      return { success: false, message: error.response?.data?.message || 'Failed to assign reviewers', data: null };
    }
  },
  
  // Auto-assign reviewers to abstracts
  autoAssignReviewers: async (eventId) => {
    try {
      const response = await api.post(`/events/${eventId}/abstracts/auto-assign-reviewers`, {});
    return response.data;
    } catch (error) {
      console.error('Error auto-assigning reviewers:', error.response?.data || error.message);
      return { success: false, message: error.response?.data?.message || 'Failed to auto-assign reviewers', data: null };
    }
  },
  
  // Submit a review for an abstract
  submitReview: async (eventId, abstractId, reviewData) => {
    try {
      const response = await api.post(`/events/${eventId}/abstracts/${abstractId}/review`, reviewData);
    return response.data;
    } catch (error) {
      console.error('Error submitting review:', error.response?.data || error.message);
      return { success: false, message: error.response?.data?.message || 'Failed to submit review', data: null };
    }
  },
  
  // Approve an abstract
  approveAbstract: async (eventId, abstractId) => {
    try {
      const response = await api.post(`/events/${eventId}/abstracts/${abstractId}/approve`, {});
    return response.data;
    } catch (error) {
      console.error('Error approving abstract:', error.response?.data || error.message);
      return { success: false, message: error.response?.data?.message || 'Failed to approve abstract', data: null };
    }
  },
  
  // Reject an abstract
  rejectAbstract: async (eventId, abstractId, data) => {
    try {
      const response = await api.post(`/events/${eventId}/abstracts/${abstractId}/reject`, data);
    return response.data;
    } catch (error) {
      console.error('Error rejecting abstract:', error.response?.data || error.message);
      return { success: false, message: error.response?.data?.message || 'Failed to reject abstract', data: null };
    }
  },
  
  // Request a revision for an abstract
  requestRevision: async (eventId, abstractId, data) => {
    try {
      const response = await api.post(`/events/${eventId}/abstracts/${abstractId}/request-revision`, data);
      return response.data;
    } catch (error) {
      console.error('Error requesting revision:', error.response?.data || error.message);
      return { success: false, message: error.response?.data?.message || 'Failed to request revision', data: null };
    }
  },

  /**
   * Download an abstract's attached file.
   * @param {string} eventId - Event ID
   * @param {string} abstractId - Abstract ID
   * @returns {Promise<object>} - Object containing blob and filename, or error structure
   */
  downloadAbstractAttachment: async (eventId, abstractId) => {
    if (!eventId || !abstractId) {
      console.error("[AbstractService] Event ID and Abstract ID are required for download.");
      return { success: false, message: 'Event ID and Abstract ID are required for download.' };
    }
    const url = `/events/${eventId}/abstracts/${abstractId}/download-attachment`;
    try {
      const response = await api.get(url, { responseType: 'blob' });
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'downloaded-file';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename\*?=\s*(?:(?:\"([^\"]+)\")|([^\s;]+))/i);
        if (filenameMatch) {
          const extracted = filenameMatch[1] || filenameMatch[2];
          if (extracted) filename = decodeURIComponent(extracted);
        }
      }
      return { success: true, blob: response.data, filename };
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to download file.';
      const status = error.response?.status;
      console.error(`[AbstractService] Detailed error: Status ${status}, Message: ${message}`);
      return { success: false, message, status };
    }
  },

  /**
   * Assign multiple reviewers to multiple abstracts for an event.
   * @param {string} eventId - The ID of the event.
   * @param {string[]} abstractIds - An array of abstract IDs.
   * @param {string[]} reviewerIds - An array of reviewer user IDs.
   * @returns {Promise<object>} The API response.
   */
  assignReviewers: async (eventId, abstractIds, reviewerIds) => {
    try {
      const response = await api.post(`/events/${eventId}/abstracts/assign-reviewers`, {
        abstractIds,
        reviewerIds,
      });
      return response.data; // Assuming response.data contains { success: boolean, message: string, ... }
    } catch (error) {
      console.error('Error assigning reviewers to abstracts:', error.response?.data || error.message);
      // Rethrow or return a standardized error object for the UI to handle
      throw error.response?.data || { success: false, message: error.message || 'Network error during assignment.' };
    }
  },

  /**
   * Get abstracts submitted by the current registrant
   * @param {string} eventId - Event ID to get abstracts for (optional)
   * @param {Object} options - Options for pagination and filtering
   * @param {number} options.page - Page number (default: 1)
   * @param {number} options.limit - Items per page (default: 10)
   * @param {boolean} options.useCache - Whether to use cached results if available (default: true)
   * @returns {Promise<object>} - API response with abstracts submitted by the registrant
   */
  getRegistrantAbstracts: async (eventId, options = {}) => {
    const { page = 1, limit = 10, useCache = true } = options;
    const cacheKey = `registrant-abstracts-${eventId || 'all'}-p${page}-l${limit}`;
    
    // Simple client-side cache to reduce repeated API calls
    if (useCache && abstractService.cache && abstractService.cache[cacheKey]) {
      const cacheEntry = abstractService.cache[cacheKey];
      const now = Date.now();
      // Use cache if less than 30 seconds old
      if (now - cacheEntry.timestamp < 30000) {
        console.log(`[AbstractService] Using cached abstracts data for ${cacheKey}`);
        return cacheEntry.data;
      }
    }
    
    console.log(`[AbstractService] Fetching abstracts for current registrant${eventId ? ` in event ${eventId}` : ''} (page: ${page}, limit: ${limit})`);
    
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (eventId) params.append('eventId', eventId);
      params.append('page', page);
      params.append('limit', limit);
      
      // Get the registrant's abstracts from the API
      const url = `/registrant-portal/abstracts?${params.toString()}`;
      
      const response = await apiRegistrant.get(url);
      
      console.log('[AbstractService] Registrant abstracts response:', response.data);
      
      // Cache the response
      if (!abstractService.cache) abstractService.cache = {};
      abstractService.cache[cacheKey] = {
        data: response.data,
        timestamp: Date.now()
      };
      
      return response.data;
    } catch (error) {
      console.error('[AbstractService] Error fetching registrant abstracts:', error.response?.data || error.message);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch your abstracts',
        status: error.response?.status,
        data: []
      };
    }
  },

  /**
   * Download a single abstract file
   * @param {string} abstractId - ID of the abstract to download
   * @returns {Promise<object>} - API response with file URL
   */
  downloadAbstract: async (abstractId) => {
    console.log(`[AbstractService] Attempting to download abstract ${abstractId}`);
    
    try {
      const response = await apiRegistrant.get(`/registrant-portal/abstracts/${abstractId}/download`, {
        responseType: 'blob'
      });
      
      // Handle direct blob response
      if (response.data instanceof Blob) {
        const url = window.URL.createObjectURL(response.data);
        const contentDisposition = response.headers['content-disposition'];
        let fileName = `abstract-${abstractId}.pdf`;
        
        // Try to extract filename from content-disposition header
        if (contentDisposition) {
          const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
          if (fileNameMatch && fileNameMatch[1]) {
            fileName = fileNameMatch[1];
          }
        }
        
        return {
          success: true,
          data: {
            fileUrl: url,
            fileName: fileName
          }
        };
      }
      
      // Handle JSON response (if the API doesn't return a direct blob)
      if (response.data && response.data.success) {
        console.log('[AbstractService] Download response:', response.data);
    return response.data;
      }
      
      return {
        success: false,
        message: 'Failed to download abstract file'
      };
    } catch (error) {
      console.error('[AbstractService] Error downloading abstract:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to download abstract file',
        error: error
      };
    }
  },
};

export default abstractService; 