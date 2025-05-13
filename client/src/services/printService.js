import api from './api';

const printService = {
  /**
   * Print badge for a registration
   * @param {string} eventId - Event ID
   * @param {string} registrationId - Registration ID
   * @param {Object} options - Print options
   * @returns {Promise} - API response
   */
  printBadge: async (eventId, registrationId, options = {}) => {
    try {
      console.log(`Printing badge for registration ${registrationId} in event ${eventId}`);
      const response = await api.post(`/events/${eventId}/registrations/${registrationId}/print-badge`, options);
      return response;
    } catch (error) {
      console.error('Error printing badge:', error);
      return {
        success: false,
        message: error.message || 'Failed to print badge'
      };
    }
  },

  /**
   * Get available printers
   * @returns {Promise} - API response with available printers
   */
  getAvailablePrinters: async () => {
    try {
      const response = await api.get('/system/printers');
      return response;
    } catch (error) {
      console.error('Error getting available printers:', error);
      return {
        success: false,
        message: error.message || 'Failed to get available printers',
        data: []
      };
    }
  },

  /**
   * Preview badge for a registration
   * @param {string} eventId - Event ID
   * @param {string} registrationId - Registration ID
   * @returns {Promise} - API response with badge preview data
   */
  previewBadge: async (eventId, registrationId) => {
    try {
      const response = await api.get(`/events/${eventId}/registrations/${registrationId}/badge-preview`);
      return response;
    } catch (error) {
      console.error('Error getting badge preview:', error);
      return {
        success: false,
        message: error.message || 'Failed to get badge preview',
        data: { imageUrl: null }
      };
    }
  }
};

export default printService; 