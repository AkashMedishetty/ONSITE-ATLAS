import api from './api';

const API_BASE_PATH = '/events'; // Base path for event-specific resources

const sponsorService = {
  // POST /api/events/:eventId/sponsors
  createSponsor: async (eventId, sponsorData) => {
    try {
      const response = await api.post(`${API_BASE_PATH}/${eventId}/sponsors`, sponsorData);
      // The backend sends the created sponsor object directly on 201.
      // We wrap it here to match the expected structure in the form.
      return { success: true, data: response.data, message: 'Sponsor created successfully.' }; 
    } catch (error) {
      console.error('[SponsorService] Create Sponsor Error:', error.response?.data || error.message);
      // Ensure the thrown error has a structure that the form can use for messages
      const serviceError = error.response?.data || { message: error.message, success: false };
      if (typeof serviceError === 'string') { // Handle plain string errors
        throw { message: serviceError, success: false };
      }
      throw { ...serviceError, success: false }; // Ensure success is false
    }
  },

  // GET /api/events/:eventId/sponsors
  getSponsorsByEvent: async (eventId) => {
    try {
      const response = await api.get(`${API_BASE_PATH}/${eventId}/sponsors`);
      return response.data; // Expected: { success: true, count: ..., data: [sponsors] }
    } catch (error) {
      console.error('[SponsorService] Get Sponsors Error:', error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },

  // GET /api/events/:eventId/sponsors/:sponsorDbId
  getSponsorById: async (eventId, sponsorDbId) => {
    try {
      const response = await api.get(`${API_BASE_PATH}/${eventId}/sponsors/${sponsorDbId}`);
      // Wrap the response to match the expected structure in the form
      return { success: true, data: response.data, message: 'Sponsor data retrieved successfully.' };
    } catch (error) {
      console.error('[SponsorService] Get Sponsor By ID Error:', error.response?.data || error.message);
      const serviceError = error.response?.data || { message: error.message, success: false };
      if (typeof serviceError === 'string') {
        throw { message: serviceError, success: false };
      }
      throw { ...serviceError, success: false };
    }
  },

  // PUT /api/events/:eventId/sponsors/:sponsorDbId
  updateSponsor: async (eventId, sponsorDbId, sponsorData) => {
    try {
      const response = await api.put(`${API_BASE_PATH}/${eventId}/sponsors/${sponsorDbId}`, sponsorData);
      // Wrap the response to match the expected structure in the form
      return { success: true, data: response.data, message: 'Sponsor updated successfully.' };
    } catch (error) {
      console.error('[SponsorService] Update Sponsor Error:', error.response?.data || error.message);
      const serviceError = error.response?.data || { message: error.message, success: false };
      if (typeof serviceError === 'string') {
        throw { message: serviceError, success: false };
      }
      throw { ...serviceError, success: false };
    }
  },

  // DELETE /api/events/:eventId/sponsors/:sponsorDbId
  deleteSponsor: async (eventId, sponsorDbId) => {
    try {
      await api.delete(`${API_BASE_PATH}/${eventId}/sponsors/${sponsorDbId}`);
      // Return a success structure consistent with other methods
      return { success: true, message: 'Sponsor deleted successfully.' };
    } catch (error) {
      console.error('[SponsorService] Delete Sponsor Error:', error.response?.data || error.message);
      const serviceError = error.response?.data || { message: error.message, success: false };
      if (typeof serviceError === 'string') {
        throw { message: serviceError, success: false };
      }
      throw { ...serviceError, success: false };
    }
  },
};

export default sponsorService; 