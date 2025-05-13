import api from './api'; // Import the configured API instance
// import axios from 'axios'; // No longer needed for direct calls
// import { API_URL } from '../config'; // API_URL is part of the api instance
// import { getAuthHeader } from '../utils/authUtils'; // Not needed when using api instance

// The base URL for the api instance is already /api, so paths should be relative to that
const REVIEWER_SERVICE_BASE_URL = '/users/me/reviewer'; 

const reviewerService = {
  /**
   * Get abstracts assigned to the currently logged-in reviewer.
   * @returns {Promise} - API response with assigned abstracts data
   */
  getAssignedAbstracts: async () => {
    try {
      // Use the api instance. Headers are handled by its interceptor.
      const response = await api.get(`${REVIEWER_SERVICE_BASE_URL}/assigned-abstracts`);
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

  // Other reviewer-specific service functions can be added here if needed in the future.
};

export default reviewerService; 