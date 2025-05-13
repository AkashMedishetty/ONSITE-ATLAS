import api from './api';

/**
 * Service for interacting with landing page API endpoints
 */
const landingPageService = {
  /**
   * Get all landing pages for an event
   * @param {string} eventId - Event ID
   * @returns {Promise} - Promise with landing pages data
   */
  getLandingPages: async (eventId) => {
    try {
      const response = await api.get(`/events/${eventId}/landing-pages`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Create a new landing page
   * @param {string} eventId - Event ID
   * @param {Object} landingPageData - Landing page data
   * @returns {Promise} - Promise with created landing page
   */
  createLandingPage: async (eventId, landingPageData) => {
    try {
      const dataToSend = { ...landingPageData, event: eventId };
      const response = await api.post(`/events/${eventId}/landing-pages`, dataToSend);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get a landing page by ID
   * @param {string} eventId - Event ID
   * @param {string} id - Landing page ID
   * @returns {Promise} - Promise with landing page data
   */
  getLandingPageById: async (eventId, id) => {
    try {
      const response = await api.get(`/events/${eventId}/landing-pages/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Update a landing page
   * @param {string} eventId - Event ID
   * @param {string} id - Landing page ID
   * @param {Object} updateData - Data to update
   * @returns {Promise} - Promise with updated landing page
   */
  updateLandingPage: async (eventId, id, updateData) => {
    try {
      const response = await api.patch(`/events/${eventId}/landing-pages/${id}`, updateData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Delete a landing page
   * @param {string} eventId - Event ID
   * @param {string} id - Landing page ID
   * @returns {Promise} - Promise with deletion result
   */
  deleteLandingPage: async (eventId, id) => {
    try {
      const response = await api.delete(`/events/${eventId}/landing-pages/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Publish a landing page
   * @param {string} eventId - Event ID
   * @param {string} id - Landing page ID
   * @returns {Promise} - Promise with published landing page
   */
  publishLandingPage: async (eventId, id) => {
    try {
      const response = await api.post(`/events/${eventId}/landing-pages/${id}/publish`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get a preview of a landing page
   * @param {string} eventId - Event ID
   * @param {string} id - Landing page ID
   * @returns {Promise} - Promise with landing page preview data
   */
  previewLandingPage: async (eventId, id) => {
    try {
      const response = await api.get(`/events/${eventId}/landing-pages/${id}/preview`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Import an HTML page as a landing page
   * @param {string} eventId - Event ID
   * @param {Object} importData - HTML import data
   * @returns {Promise} - Promise with created landing page
   */
  importHtmlPage: async (eventId, importData) => {
    try {
      const dataToSend = { ...importData, event: eventId };
      const response = await api.post(`/events/${eventId}/landing-pages/import-html`, dataToSend);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Restore a previous version of a landing page
   * @param {string} eventId - Event ID
   * @param {string} id - Landing page ID
   * @param {string} versionId - Version ID to restore
   * @returns {Promise} - Promise with restored landing page
   */
  restoreVersion: async (eventId, id, versionId) => {
    try {
      const response = await api.post(`/events/${eventId}/landing-pages/${id}/restore/${versionId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get a public landing page by event slug
   * @param {string} eventSlug - Event slug
   * @returns {Promise} - Promise with public landing page data
   */
  getPublicLandingPage: async (eventSlug) => {
    try {
      const response = await api.get(`/public/events/${eventSlug}/landing`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default landingPageService; 