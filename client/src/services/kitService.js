import api from './api';

const kitService = {
  // Get kit settings for an event
  getKitSettings: async (eventId) => {
    try {
      if (!eventId) {
        return {
          success: false,
          message: 'Event ID is required',
          data: []
        };
      }
      
      const response = await api.get(`/events/${eventId}/resources/kits/items`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching kit settings for event ${eventId}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch kit settings',
        data: []
      };
    }
  },
  
  // Record kit distribution
  recordKitDistribution: async (eventId, data) => {
    try {
      const response = await api.post(`/events/${eventId}/resources/kits`, data);
      return response.data;
    } catch (error) {
      console.error('Error recording kit distribution:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to record kit distribution',
        data: null
      };
    }
  },
  
  // Get kit distribution statistics
  getKitStatistics: async (eventId, params = {}) => {
    try {
      const response = await api.get(`/events/${eventId}/resources/kits/statistics`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching kit statistics:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch kit statistics',
        data: null
      };
    }
  },
  
  // Get recent kit distribution records
  getRecentKitDistributions: async (eventId, limit = 10) => {
    try {
      const response = await api.get(`/events/${eventId}/resources/kits/recent`, { params: { limit } });
      return response.data;
    } catch (error) {
      console.error('Error fetching recent kit distributions:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch recent kit distributions',
        data: []
      };
    }
  }
};

export default kitService; 