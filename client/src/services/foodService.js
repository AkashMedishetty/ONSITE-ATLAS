import api from './api';

const foodService = {
  // Get food settings for an event
  getFoodSettings: async (eventId) => {
    try {
      if (!eventId) {
        return {
          success: false,
          message: 'Event ID is required',
          data: []
        };
      }
      
      const response = await api.get(`/events/${eventId}/resources/food/config`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching food settings for event ${eventId}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch food settings',
        data: []
      };
    }
  },
  
  // Record food distribution
  recordFoodDistribution: async (eventId, data) => {
    try {
      const response = await api.post(`/events/${eventId}/resources/food`, data);
      return response.data;
    } catch (error) {
      console.error('Error recording food distribution:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to record food distribution',
        data: null
      };
    }
  },
  
  // Get food distribution statistics
  getFoodStatistics: async (eventId, params = {}) => {
    try {
      const response = await api.get(`/events/${eventId}/resources/food/statistics`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching food statistics:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch food statistics',
        data: null
      };
    }
  },
  
  // Get recent food scan records
  getRecentFoodScans: async (eventId, limit = 10) => {
    try {
      const response = await api.get(`/events/${eventId}/resources/food/recent`, { params: { limit } });
      return response.data;
    } catch (error) {
      console.error('Error fetching recent food scans:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch recent food scans',
        data: []
      };
    }
  }
};

export default foodService; 