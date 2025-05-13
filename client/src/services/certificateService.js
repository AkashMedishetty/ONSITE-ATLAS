import api from './api';

const certificateService = {
  // Get certificate settings for an event
  getCertificateSettings: async (eventId) => {
    try {
      if (!eventId) {
        return {
          success: false,
          message: 'Event ID is required',
          data: []
        };
      }
      
      const response = await api.get(`/events/${eventId}/resources/certificates/types`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching certificate settings for event ${eventId}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch certificate settings',
        data: []
      };
    }
  },
  
  // Issue a certificate
  issueCertificate: async (eventId, data) => {
    try {
      const response = await api.post(`/events/${eventId}/resources/certificates`, data);
      return response.data;
    } catch (error) {
      console.error('Error issuing certificate:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to issue certificate',
        data: null
      };
    }
  },
  
  // Get certificate issuance statistics
  getCertificateStatistics: async (eventId, params = {}) => {
    try {
      const response = await api.get(`/events/${eventId}/resources/certificates/statistics`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching certificate statistics:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch certificate statistics',
        data: null
      };
    }
  },
  
  // Get recent certificate issuances
  getRecentCertificateIssuances: async (eventId, limit = 10) => {
    try {
      const response = await api.get(`/events/${eventId}/resources/certificates/recent`, { params: { limit } });
      return response.data;
    } catch (error) {
      console.error('Error fetching recent certificate issuances:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch recent certificate issuances',
        data: []
      };
    }
  }
};

export default certificateService; 