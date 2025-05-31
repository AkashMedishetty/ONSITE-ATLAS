import apiClient from './apiClient';

/**
 * Service for managing event announcements (client portal version).
 */
export const clientAnnouncementService = {
  createAnnouncement: async (eventId, announcementData) => {
    if (!eventId) throw new Error('Event ID is required to create an announcement.');
    try {
      const response = await apiClient.post(`/events/${eventId}/announcements`, announcementData);
      return response.data;
    } catch (error) {
      console.error('Error creating announcement:', error.response?.data || error.message);
      throw error.response?.data || new Error('Failed to create announcement');
    }
  },
  getAnnouncementsByEvent: async (eventId, params = {}) => {
    if (!eventId) throw new Error('Event ID is required to fetch announcements.');
    try {
      const response = await apiClient.get(`/events/${eventId}/announcements`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching announcements by event:', error.response?.data || error.message);
      throw error.response?.data || new Error('Failed to fetch announcements');
    }
  },
  getAnnouncementById: async (eventId, announcementId) => {
    if (!eventId) throw new Error('Event ID is required.');
    if (!announcementId) throw new Error('Announcement ID is required.');
    try {
      const response = await apiClient.get(`/events/${eventId}/announcements/${announcementId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching announcement ${announcementId} for event ${eventId}:`, error.response?.data || error.message);
      throw error.response?.data || new Error('Failed to fetch announcement');
    }
  },
  updateAnnouncement: async (eventId, announcementId, updatedData) => {
    if (!eventId) throw new Error('Event ID is required for update.');
    if (!announcementId) throw new Error('Announcement ID is required for update.');
    try {
      const response = await apiClient.put(`/events/${eventId}/announcements/${announcementId}`, updatedData);
      return response.data;
    } catch (error) {
      console.error(`Error updating announcement ${announcementId} for event ${eventId}:`, error.response?.data || error.message);
      throw error.response?.data || new Error('Failed to update announcement');
    }
  },
  deleteAnnouncement: async (eventId, announcementId) => {
    if (!eventId) throw new Error('Event ID is required for deletion.');
    if (!announcementId) throw new Error('Announcement ID is required for deletion.');
    try {
      const response = await apiClient.delete(`/events/${eventId}/announcements/${announcementId}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting announcement ${announcementId} for event ${eventId}:`, error.response?.data || error.message);
      throw error.response?.data || new Error('Failed to delete announcement');
    }
  },
}; 