import api from './api'; // Import the configured API instance
// import axios from 'axios'; // No longer needed for direct calls
// import { API_URL } from '../config'; // API_URL is part of the api instance
// import { getAuthHeader } from '../utils/authUtils'; // Not needed when using api instance

// Paths should be relative to the api instance's base URL (e.g., /api)
const abstractSettingsService = {
  // Get abstract settings for an event
  getSettings: async (eventId) => {
    try {
      const response = await api.get(`/events/${eventId}/abstract-workflow/settings`);
      return response.data; // Assuming backend returns { success: true, data: {...} }
    } catch (error) {
      console.error('Error getting abstract settings:', error.response?.data || error.message);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get abstract settings',
        data: null,
      };
    }
  },
  
  // Update abstract settings for an event
  updateSettings: async (eventId, settingsData) => {
    try {
      const response = await api.post(`/events/${eventId}/abstract-workflow/settings`, settingsData);
      return response.data; // Assuming backend returns { success: true, data: {...} }
    } catch (error) {
      console.error('Error updating abstract settings:', error.response?.data || error.message);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update abstract settings',
        data: null,
      };
    }
  },
  
  // Get available reviewers for an event
  getReviewers: async (eventId) => {
    try {
      // This path was identified in server/src/routes/event.routes.js
      const response = await api.get(`/events/${eventId}/abstract-workflow/reviewers`);
      // Expects { success: true, data: [user1, user2,...] }
      return response.data; 
    } catch (error) {
      console.error('Error fetching reviewers:', error.response?.data || error.message);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch reviewers',
        data: [], // Return empty array on error
      };
    }
  }
};

export default abstractSettingsService; 
