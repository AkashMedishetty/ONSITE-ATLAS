import api from './api';

const sponsorAuthService = {
  login: async (eventId, sponsorId, password) => {
    try {
      const response = await api.post(`/sponsor-auth/events/${eventId}/login`, {
        sponsorId,
        password, // This is the contactPhone
      });
      // The backend sends { message, token, sponsor }
      if (response.data && response.data.token) {
        // Store sponsor token separately
        localStorage.setItem('sponsorToken', response.data.token); 
        
        // Add eventId to the sponsor data before storing it
        const sponsorData = { 
          ...response.data.sponsor,
          eventId: eventId // Add eventId to make it accessible for routing
        };
        
        // Storing sponsor details separately for easy access by the portal, if needed.
        localStorage.setItem('sponsorData', JSON.stringify(sponsorData));
        
        return response.data; // Contains token and sponsor object
      } else {
        // Should be caught by the error interceptor mostly, but as a fallback:
        throw new Error(response.data.message || 'Login failed, no token received');
      }
    } catch (error) {
      console.error('[SponsorAuthService] Login error:', error.response?.data?.message || error.message);
      // Re-throw the error so the component can catch it and display a message
      // The error object from axios usually has error.response.data for server-sent errors
      throw error.response?.data || new Error('An unexpected error occurred during login.');
    }
  },

  logout: () => {
    // Clear the generic token and sponsor-specific data
    localStorage.removeItem('sponsorToken');
    localStorage.removeItem('sponsorData');
    // Optionally, could also call a backend logout endpoint if one exists
  },

  // Utility to get the current sponsor token (if needed by other services)
  getCurrentSponsorToken: () => {
    // This function might be misleading if token is generic. Consider removing or clarifying.
    // For now, it reflects the idea that this service manages the sponsor's session token.
    return localStorage.getItem('sponsorToken'); 
  },

  // Utility to get sponsor data from localStorage (if stored there by login)
  getCurrentSponsorData: () => {
    const sponsorData = localStorage.getItem('sponsorData');
    return sponsorData ? JSON.parse(sponsorData) : null;
  },

  getProfile: async () => {
    try {
      const response = await api.get('/sponsor-auth/me');
      // Assuming the backend sends { success: true, data: { sponsor profile } }
      if (response.data && response.data.success) {
        // Optionally update localStorage sponsorData if it differs or for consistency
        localStorage.setItem('sponsorData', JSON.stringify(response.data.data));
        return response.data.data; 
      }
      throw new Error(response.data.message || 'Failed to fetch sponsor profile');
    } catch (error) {
      console.error('[SponsorAuthService] Get Profile error:', error.response?.data?.message || error.message);
      throw error.response?.data || new Error('An unexpected error occurred while fetching profile.');
    }
  },

  getSponsorRegistrants: async () => {
    try {
      const response = await api.get('/sponsor-auth/me/registrants');
      // Backend sends { success: true, count: number, data: [...] }
      if (response.data && response.data.success) {
        return response.data; // Contains count and data (array of registrants)
      }
      throw new Error(response.data.message || 'Failed to fetch sponsor registrants');
    } catch (error) {
      console.error('[SponsorAuthService] Get Sponsor Registrants error:', error.response?.data?.message || error.message);
      throw error.response?.data || new Error('An unexpected error occurred while fetching sponsor registrants.');
    }
  },

  getSponsorDashboard: async () => {
    try {
      const response = await api.get('/sponsor-portal-auth/me/dashboard');
      if (response.data && response.data.success) {
        return response.data;
      }
      throw new Error(response.data.message || 'Failed to fetch sponsor dashboard');
    } catch (error) {
      console.error('[SponsorAuthService] Get Sponsor Dashboard error:', error.response?.data?.message || error.message);
      throw error.response?.data || new Error('An unexpected error occurred while fetching dashboard.');
    }
  },

  getSponsorPortalRegistrants: async () => {
    try {
      const response = await api.get('/sponsor-portal-auth/me/registrants');
      if (response.data && response.data.success) {
        return response.data;
      }
      throw new Error(response.data.message || 'Failed to fetch sponsor registrants');
    } catch (error) {
      console.error('[SponsorAuthService] Get Sponsor Portal Registrants error:', error.response?.data?.message || error.message);
      throw error.response?.data || new Error('An unexpected error occurred while fetching sponsor registrants.');
    }
  },

  addSponsorPortalRegistrant: async (registrant) => {
    try {
      const response = await api.post('/sponsor-portal-auth/me/registrants', registrant);
      return response.data;
    } catch (error) {
      console.error('[SponsorAuthService] Add Sponsor Portal Registrant error:', error.response?.data?.message || error.message);
      throw error.response?.data || new Error('An unexpected error occurred while adding registrant.');
    }
  },

  editSponsorPortalRegistrant: async (id, registrant) => {
    try {
      const response = await api.put(`/sponsor-portal-auth/me/registrants/${id}`, registrant);
      return response.data;
    } catch (error) {
      console.error('[SponsorAuthService] Edit Sponsor Portal Registrant error:', error.response?.data?.message || error.message);
      throw error.response?.data || new Error('An unexpected error occurred while editing registrant.');
    }
  },

  deleteSponsorPortalRegistrant: async (id) => {
    try {
      const response = await api.delete(`/sponsor-portal-auth/me/registrants/${id}`);
      return response.data;
    } catch (error) {
      console.error('[SponsorAuthService] Delete Sponsor Portal Registrant error:', error.response?.data?.message || error.message);
      throw error.response?.data || new Error('An unexpected error occurred while deleting registrant.');
    }
  },

  bulkImportSponsorPortalRegistrants: async (registrants) => {
    try {
      const response = await api.post('/sponsor-portal-auth/me/registrants/bulk-import', { registrants });
      return response.data;
    } catch (error) {
      console.error('[SponsorAuthService] Bulk Import Sponsor Portal Registrants error:', error.response?.data?.message || error.message);
      throw error.response?.data || new Error('An unexpected error occurred during bulk import.');
    }
  },

  exportSponsorPortalRegistrants: () => {
    // Just return the URL for download
    return '/api/sponsor-portal-auth/me/registrants/export';
  },
};

export default sponsorAuthService; 