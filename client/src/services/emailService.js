import api from './api';

const emailService = {
  /**
   * Send an email to event participants filtered by criteria
   * Now supports attachments: if attachments are present, uses FormData and multipart/form-data
   * @param {string} eventId - The ID of the event
   * @param {Object} emailData - Email data object
   * @param {string} emailData.subject - Email subject
   * @param {string} emailData.body - Email body content
   * @param {Array} emailData.attachments - Optional array of attachment file objects
   * @param {Object} filters - Filtering criteria
   * @param {Array} filters.categories - Array of category IDs to filter by
   * @param {string} filters.workshopFilter - 'all', 'withWorkshop', or 'withoutWorkshop'
   * @param {Array} filters.specificEmails - Array of specific email addresses to send to
   * @returns {Promise} Promise with API response
   */
  sendEmail: async (eventId, emailData, filters = {}) => {
    // Always use FormData, even if there are no attachments
    const formData = new FormData();
    formData.append('email', JSON.stringify({ subject: emailData.subject, body: emailData.body }));
    formData.append('filters', JSON.stringify(filters));
    if (emailData.attachments && emailData.attachments.length > 0) {
      emailData.attachments.forEach(file => {
        formData.append('attachments', file);
      });
    } else {
      // Add a dummy file with a valid mimetype to ensure multipart boundary is present and multer never fails
      formData.append('attachments', new File([''], 'empty.txt', { type: 'text/plain' }));
    }
    const response = await api.post(`/events/${eventId}/emails/send`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  /**
   * Get email history for an event
   * @param {string} eventId - The ID of the event
   * @param {Object} options - Optional parameters like page, limit
   * @returns {Promise} Promise with API response
   */
  getEmailHistory: async (eventId, options = {}) => {
    const queryParams = new URLSearchParams(options).toString();
    // Using debug route temporarily to test routing
    const url = `/events/${eventId}/emails/history-debug${queryParams ? '?' + queryParams : ''}`;
    console.log("Fetching email history from:", url);
    const response = await api.get(url);
    return response.data;
  },

  /**
   * Get filtered list of recipients for an email
   * @param {string} eventId - The ID of the event
   * @param {Object} filters - Filter criteria
   * @returns {Promise} Promise with API response containing recipient list
   */
  getFilteredRecipients: async (eventId, filters = {}) => {
    const response = await api.post(`/events/${eventId}/emails/recipients`, filters);
    return response.data;
  },

  /**
   * Get templates available for an event
   * @param {string} eventId - The ID of the event
   * @returns {Promise} Promise with API response containing templates
   */
  getTemplates: async (eventId) => {
    const response = await api.get(`/events/${eventId}/emails/templates`);
    return response.data;
  },

  /**
   * Test SMTP configuration
   * @param {string} eventId - The ID of the event
   * @param {string} testEmail - Email address to send test to
   * @returns {Promise} Promise with API response
   */
  testSmtpConfiguration: async (eventId, testEmail) => {
    const response = await api.post(`/events/${eventId}/emails/test-smtp`, { testEmail });
    return response.data;
  },

  /**
   * Upload certificate template for email attachments
   * @param {string} eventId - The ID of the event
   * @param {File} templateFile - Certificate template file
   * @returns {Promise} Promise with API response
   */
  uploadCertificateTemplate: async (eventId, templateFile) => {
    const formData = new FormData();
    formData.append('templateFile', templateFile);
    
    const response = await api.post(`/events/${eventId}/emails/certificate-template`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.data;
  },

  /**
   * Upload scientific brochure for email attachments
   * @param {string} eventId - The ID of the event
   * @param {File} brochureFile - Brochure PDF file
   * @returns {Promise} Promise with API response
   */
  uploadBrochure: async (eventId, brochureFile) => {
    const formData = new FormData();
    formData.append('brochureFile', brochureFile);
    
    const response = await api.post(`/events/${eventId}/emails/brochure`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.data;
  },

  /**
   * Validate authenticity of a certificate
   * @param {string} certificateId - Unique certificate identifier
   * @returns {Promise} Promise with API response
   */
  validateCertificate: async (certificateId) => {
    const response = await api.get(`/certificates/validate/${certificateId}`);
    return response.data;
  },

  /**
   * Update email templates for an event
   * @param {string} eventId - The ID of the event
   * @param {object} templates - Templates object to update
   * @returns {Promise} Promise with API response
   */
  updateTemplates: async (eventId, templates) => {
    const response = await api.put(`/events/${eventId}/emails/templates`, { templates });
    return response.data;
  },

  /**
   * Update SMTP settings for an event
   * @param {string} eventId - The ID of the event
   * @param {object} smtpSettings - SMTP settings object to update
   * @returns {Promise} Promise with API response
   */
  updateSmtpSettings: async (eventId, smtpSettings) => {
    const response = await api.put(`/events/${eventId}/emails/smtp-settings`, smtpSettings);
    return response.data;
  }
};

export default emailService; 