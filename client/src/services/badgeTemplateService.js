import api from './apiService';

const badgeTemplateService = {
  /**
   * Get all badge templates
   * @param {string} eventId - Optional event ID to filter templates
   * @returns {Promise} - API response
   */
  getTemplates: async (eventId) => {
    try {
      const url = eventId ? `/badge-templates?event=${eventId}` : '/badge-templates';
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching badge templates:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch badge templates',
        data: []
      };
    }
  },

  /**
   * Get a specific badge template by ID
   * @param {string} id - Template ID
   * @returns {Promise} - API response
   */
  getTemplateById: async (id) => {
    try {
      const response = await api.get(`/badge-templates/${id}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error(`Error fetching badge template ${id}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch badge template'
      };
    }
  },

  /**
   * Create a new badge template
   * @param {Object} templateData - The template data
   * @returns {Promise} - API response
   */
  createTemplate: async (templateData) => {
    try {
      const response = await api.post('/badge-templates', templateData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error creating badge template:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to create badge template'
      };
    }
  },

  /**
   * Update an existing badge template
   * @param {string} id - Template ID
   * @param {Object} templateData - The updated template data
   * @returns {Promise} - API response
   */
  updateTemplate: async (id, templateData) => {
    try {
      const response = await api.put(`/badge-templates/${id}`, templateData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error(`Error updating badge template ${id}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update badge template'
      };
    }
  },

  /**
   * Delete a badge template
   * @param {string} id - Template ID
   * @returns {Promise} - API response
   */
  deleteTemplate: async (id) => {
    try {
      const response = await api.delete(`/badge-templates/${id}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error(`Error deleting badge template ${id}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to delete badge template'
      };
    }
  },

  /**
   * Set a template as the default for an event
   * @param {string} eventId - The ID of the event
   * @param {string} templateId - The ID of the template to set as default
   * @returns {Promise} - API response
   */
  setDefaultTemplate: async (eventId, templateId) => {
    if (!eventId || !templateId) {
      throw new Error('Event ID and Template ID are required to set default template.');
    }
    const response = await api.post(`/badge-templates/${eventId}/${templateId}/set-default`);
    return response.data;
  },

  /**
   * Duplicate a badge template
   * @param {string} id - Template ID to duplicate
   * @param {string} eventId - Optional event ID to assign the copy to
   * @returns {Promise} - API response
   */
  duplicateTemplate: async (id, eventId) => {
    try {
      const payload = eventId ? { event: eventId } : {};
      const response = await api.post(`/badge-templates/${id}/duplicate`, payload);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error(`Error duplicating badge template ${id}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to duplicate badge template'
      };
    }
  }
};

export default badgeTemplateService; 