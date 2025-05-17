import api from './api'; // Import the configured API instance
// import axios from 'axios'; // No longer needed for direct calls
// import { API_URL } from '../config'; // API_URL is part of the api instance
// import { getAuthHeader } from '../utils/authUtils'; // Not needed when using api instance

// The base URL for the api instance is already /api, so paths should be relative to that
const REVIEWER_SERVICE_BASE_URL = '/users/me/reviewer'; 

const reviewerService = {
  /**
   * Get abstracts assigned to the currently logged-in reviewer for a specific event.
   * @param {string} eventId - The ID of the event to filter abstracts by.
   * @returns {Promise} - API response with assigned abstracts data
   */
  getAssignedAbstracts: async (eventId) => {
    try {
      if (!eventId) {
        console.error('Error fetching assigned abstracts: eventId is required.');
        return {
          success: false,
          message: 'Event ID is required to fetch assigned abstracts.',
          data: [],
        };
      }
      // Use the api instance. Headers are handled by its interceptor.
      // Pass eventId as a query parameter
      const response = await api.get(`${REVIEWER_SERVICE_BASE_URL}/assigned-abstracts`, {
        params: { eventId }
      });
      // The api instance automatically returns response.data for success, 
      // and throws an error for non-2xx, which will be caught.
      // Assuming the backend structure is { success: true, data: ..., count: ... } as before
      return response.data; // If api instance is configured to return full response, else it might already be response.data
    } catch (error) {
      console.error('Error fetching assigned abstracts:', error.response?.data || error.message);
      // Return a consistent error structure, or rethrow if the api instance already formats errors.
      // Assuming the existing structure for now:
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch assigned abstracts',
        data: [],
        // count: 0 // if count is expected in error cases
      };
    }
  },

  /**
   * Export details of abstracts assigned to the reviewer for an event as CSV.
   * @param {string} eventId - The ID of the event.
   * @returns {Promise<{success: boolean, message?: string, data?: {fileUrl: string, filename: string, contentType: string}}>}
   */
  exportAssignedAbstractDetails: async (eventId) => {
    if (!eventId) {
      return { success: false, message: 'Event ID is required for exporting details.' };
    }
    try {
      const response = await api.get(
        `${REVIEWER_SERVICE_BASE_URL}/events/${eventId}/export-assigned-details`, // Ensure this endpoint matches your backend
        { responseType: 'blob' }
      );

      let filename = '';
      const contentDisposition = response.headers['content-disposition'];
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }
      if (!filename) {
        filename = `reviewer_abstract_details_${eventId}_${Date.now()}.csv`;
      }

      const fileUrl = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }));
      return {
        success: true,
        data: {
          fileUrl,
          filename,
          contentType: response.headers['content-type'] || 'text/csv'
        }
      };
    } catch (error) {
      console.error('Error exporting assigned abstract details:', error.response?.data || error.message);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to export assigned abstract details.',
        data: null
      };
    }
  },

  /**
   * Download a ZIP file of supplementary files for abstracts assigned to the reviewer for an event.
   * @param {string} eventId - The ID of the event.
   * @returns {Promise<{success: boolean, message?: string, data?: {fileUrl: string, filename: string, contentType: string}}>}
   */
  downloadAssignedAbstractFiles: async (eventId) => {
    if (!eventId) {
      return { success: false, message: 'Event ID is required for downloading files.' };
    }
    try {
      const response = await api.get(
        `${REVIEWER_SERVICE_BASE_URL}/events/${eventId}/download-assigned-files`, // Ensure this endpoint matches your backend
        { responseType: 'blob' }
      );

      let filename = '';
      const contentDisposition = response.headers['content-disposition'];
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }
      if (!filename) {
        filename = `reviewer_abstract_files_${eventId}_${Date.now()}.zip`;
      }

      const fileUrl = window.URL.createObjectURL(new Blob([response.data])); // Default type for zip will be handled by browser based on content-disposition or file extension
      return {
        success: true,
        data: {
          fileUrl,
          filename,
          contentType: response.headers['content-type'] || 'application/zip'
        }
      };
    } catch (error) {
      console.error('Error downloading assigned abstract files:', error.response?.data || error.message);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to download assigned abstract files.',
        data: null
      };
    }
  },

  // Other reviewer-specific service functions can be added here if needed in the future.
};

export default reviewerService; 