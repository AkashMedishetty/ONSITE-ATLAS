import api from './api';

const categoryService = {
  // Get all categories
  getCategories: async (filtersOrEventId = {}) => {
    try {
      // Handle case where the first parameter is eventId (string) instead of filters object
      let filters = {};
      
      if (typeof filtersOrEventId === 'string') {
        // If eventId is passed directly, convert it to a filters object
        filters = { eventId: filtersOrEventId };
      } else if (typeof filtersOrEventId === 'object') {
        // If a filters object is passed, use it directly
        filters = filtersOrEventId;
      }
      
      const response = await api.get('/categories', { params: filters });
      return response.data;
    } catch (error) {
      console.error('Error fetching categories:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch categories',
        data: []
      };
    }
  },

  // Get a category by ID
  getCategoryById: async (id) => {
    try {
      const response = await api.get(`/categories/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching category ${id}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || `Failed to fetch category ${id}`,
        data: null
      };
    }
  },

  // Create a new category
  createCategory: async (categoryData) => {
    try {
      const response = await api.post('/categories', categoryData);
      return response.data;
    } catch (error) {
      console.error('Error creating category:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to create category',
        data: null
      };
    }
  },

  // Update a category
  updateCategory: async (id, categoryData) => {
    try {
      const response = await api.put(`/categories/${id}`, categoryData);
      return response.data;
    } catch (error) {
      console.error(`Error updating category ${id}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || `Failed to update category ${id}`,
        data: null
      };
    }
  },

  // Delete a category
  // The proper endpoint format is /categories/:id with the eventId as a query parameter
  deleteCategory: async (eventId, categoryId) => {
    try {
      const response = await api.delete(`/categories/${categoryId}`, {
        params: { eventId }
      });
      return response.data;
    } catch (error) {
      console.error(`Error deleting category ${categoryId}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || `Failed to delete category ${categoryId}`,
        data: null
      };
    }
  },

  // Get categories for a specific event
  getCategoriesByEvent: async (eventId) => {
    try {
      if (!eventId) {
        console.warn('getCategoriesByEvent called without eventId');
        return {
          success: false,
          message: 'Event ID is required',
          data: []
        };
      }

      console.log('Fetching categories for event:', eventId);
      
      // The proper endpoint is /categories with eventId as a query parameter
      try {
        const response = await api.get('/categories', {
          params: { eventId }
        });
        
        // Handle case where response.data might be null or undefined
        if (!response || !response.data) {
          console.error('Invalid API response format:', response);
          return {
            success: false,
            message: 'Invalid response format',
            data: []
          };
        }
        
        // Check if response.data has success field
        if (response.data.success === true) {
          console.log('Categories retrieved successfully:', response.data.data?.length || 0, 'categories');
          return {
            success: true,
            data: response.data.data || [],
            message: response.data.message || 'Categories retrieved successfully'
          };
        }
        
        // Return response.data if it's an object but doesn't have success: true
        if (typeof response.data === 'object') {
          return {
            ...response.data,
            data: response.data.data || [],
            success: response.data.success !== false
          };
        }
        
        // Fallback for unexpected response format
        console.error('Unexpected API response format:', response.data);
        return {
          success: false,
          message: 'Unexpected response format',
          data: []
        };
      } catch (error) {
        // Try legacy endpoint as fallback
        if (error.response && error.response.status === 404) {
          console.warn('Category endpoint not found, trying legacy endpoint');
          try {
            const legacyResponse = await api.get(`/events/${eventId}/categories`);
            if (legacyResponse && legacyResponse.data) {
              return {
                success: true,
                data: Array.isArray(legacyResponse.data) ? legacyResponse.data : 
                      (legacyResponse.data.data || []),
                message: 'Categories retrieved from legacy endpoint'
              };
            }
          } catch (legacyError) {
            console.error('Legacy category endpoint also failed:', legacyError);
            throw legacyError;
          }
        }
        throw error;
      }
    } catch (error) {
      console.error(`Error fetching categories for event ${eventId}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || `Failed to fetch categories for event ${eventId}`,
        data: []
      };
    }
  },

  // Alias for getCategoriesByEvent to match the naming pattern used in CategoriesTab
  getEventCategories: async (eventId) => {
    return categoryService.getCategoriesByEvent(eventId);
  },

  /**
   * Update category permissions and entitlements
   * @param {string} categoryId - Category ID 
   * @param {string} eventId - Event ID
   * @param {Object} data - Permission and entitlement data
   * @returns {Promise} - API response
   */
  updateCategoryPermissions: async (categoryId, eventId, data) => {
    try {
      console.log(`Updating permissions for category ${categoryId} in event ${eventId}`);
      if (!categoryId) {
        console.error('Missing category ID');
        return {
          success: false,
          message: 'Category ID is required',
          data: null
        };
      }
      // Prepare payload: permissions and entitlements at root
      const payload = {
        permissions: data.permissions || {},
        mealEntitlements: Array.isArray(data.mealEntitlements) ? data.mealEntitlements : [],
        kitItemEntitlements: Array.isArray(data.kitItemEntitlements) ? data.kitItemEntitlements : [],
        certificateEntitlements: Array.isArray(data.certificateEntitlements) ? data.certificateEntitlements : []
      };
      // Use PUT and correct path
      const response = await api.put(`/categories/${categoryId}/permissions`, payload);
      return response.data;
    } catch (error) {
      console.error('Error updating category permissions:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update category permissions',
        data: null
      };
    }
  }
};

export default categoryService; 