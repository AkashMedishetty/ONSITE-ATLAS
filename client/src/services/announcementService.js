import api from './api'; // Assuming your base api instance is in api.js

/**
 * Service for managing event announcements.
 */
export const announcementService = {
  /**
   * Creates a new announcement for a given event.
   * @param {string} eventId - The ID of the event.
   * @param {object} announcementData - The data for the new announcement.
   * @param {string} announcementData.title - The title of the announcement.
   * @param {string} announcementData.content - The content of the announcement.
   * @param {string} [announcementData.deadline] - Optional deadline for the announcement (ISO date string).
   * @param {boolean} [announcementData.isActive] - Optional active status (defaults to true on backend).
   * @returns {Promise<object>} The created announcement data.
   */
  createAnnouncement: async (eventId, announcementData) => {
    if (!eventId) throw new Error('Event ID is required to create an announcement.');
    try {
      const response = await api.post(`/events/${eventId}/announcements`, announcementData);
      return response.data; // Assuming response structure is { success: true, data: {...} }
    } catch (error) {
      console.error('Error creating announcement:', error.response?.data || error.message);
      throw error.response?.data || new Error('Failed to create announcement');
    }
  },

  /**
   * Retrieves announcements for a specific event.
   * @param {string} eventId - The ID of the event.
   * @param {object} [params] - Optional query parameters.
   * @param {boolean} [params.isActive] - Filter by active status.
   * @param {number} [params.page] - Page number for pagination.
   * @param {number} [params.limit] - Number of items per page.
   * @returns {Promise<object>} An object containing the list of announcements and pagination info.
   */
  getAnnouncementsByEvent: async (eventId, params = {}) => {
    if (!eventId) throw new Error('Event ID is required to fetch announcements.');
    try {
      const response = await api.get(`/events/${eventId}/announcements`, { params });
      return response.data; // Assuming response structure is { success: true, count, total, pagination, data: [...] }
    } catch (error) {
      console.error('Error fetching announcements by event:', error.response?.data || error.message);
      throw error.response?.data || new Error('Failed to fetch announcements');
    }
  },

  /**
   * Retrieves a single announcement by its ID for a specific event.
   * @param {string} eventId - The ID of the event.
   * @param {string} announcementId - The ID of the announcement.
   * @returns {Promise<object>} The announcement data.
   */
  getAnnouncementById: async (eventId, announcementId) => {
    if (!eventId) throw new Error('Event ID is required.');
    if (!announcementId) throw new Error('Announcement ID is required.');
    try {
      const response = await api.get(`/events/${eventId}/announcements/${announcementId}`); 
      return response.data;
    } catch (error) {
      console.error(`Error fetching announcement ${announcementId} for event ${eventId}:`, error.response?.data || error.message);
      throw error.response?.data || new Error('Failed to fetch announcement');
    }
  },

  /**
   * Updates an existing announcement for a specific event.
   * @param {string} eventId - The ID of the event.
   * @param {string} announcementId - The ID of the announcement to update.
   * @param {object} updatedData - The data to update.
   * @returns {Promise<object>} The updated announcement data.
   */
  updateAnnouncement: async (eventId, announcementId, updatedData) => {
    if (!eventId) throw new Error('Event ID is required for update.');
    if (!announcementId) throw new Error('Announcement ID is required for update.');
    try {
      const response = await api.put(`/events/${eventId}/announcements/${announcementId}`, updatedData);
      return response.data;
    } catch (error) {
      console.error(`Error updating announcement ${announcementId} for event ${eventId}:`, error.response?.data || error.message);
      throw error.response?.data || new Error('Failed to update announcement');
    }
  },

  /**
   * Deletes an announcement for a specific event.
   * @param {string} eventId - The ID of the event.
   * @param {string} announcementId - The ID of the announcement to delete.
   * @returns {Promise<object>} Response from the server (usually success status).
   */
  deleteAnnouncement: async (eventId, announcementId) => {
    if (!eventId) throw new Error('Event ID is required for deletion.');
    if (!announcementId) throw new Error('Announcement ID is required for deletion.');
    try {
      const response = await api.delete(`/events/${eventId}/announcements/${announcementId}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting announcement ${announcementId} for event ${eventId}:`, error.response?.data || error.message);
      throw error.response?.data || new Error('Failed to delete announcement');
    }
  },
}; 