import api from './api';
import { toast } from 'react-toastify';

const TOKEN_KEY = 'token';
const USER_KEY = 'user';

const authService = {
  // Login user
  login: async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      
      if (response.data.success && response.data.token) {
        // Store token and user data
        localStorage.setItem(TOKEN_KEY, response.data.token);
        localStorage.setItem(USER_KEY, JSON.stringify(response.data.user));
        
        // Set default auth header
        api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
        
        return {
          success: true,
          user: response.data.user
        };
      }
      
      return {
        success: false,
        message: response.data.message || 'Login failed'
      };
    } catch (error) {
      console.error('Login error:', error);
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
      return {
        success: false,
        message
      };
    }
  },

  // Register user
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  // Logout user
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear all auth data regardless of logout API success
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      delete api.defaults.headers.common['Authorization'];
      
      // Clear any other auth-related data
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userData');
      localStorage.removeItem('currentEvent');
      localStorage.removeItem('permissions');
      localStorage.removeItem('lastActivity');
      
      // Clear session storage
      sessionStorage.clear();
    }
  },

  // Get current user
  getCurrentUser: () => {
    try {
      const userStr = localStorage.getItem(USER_KEY);
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    const token = localStorage.getItem(TOKEN_KEY);
    const user = authService.getCurrentUser();
    return !!(token && user);
  },

  // Initialize auth state
  initializeAuth: () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  },

  // Update user data
  updateUserData: (userData) => {
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(userData));
      return true;
    } catch (error) {
      console.error('Error updating user data:', error);
      return false;
    }
  },

  // Refresh token
  refreshToken: async () => {
    try {
      const response = await api.post('/auth/refresh-token');
      
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
      }
      
      return response.data;
    } catch (error) {
      console.error('Token refresh error:', error);
      throw error;
    }
  },

  // Request password reset
  requestPasswordReset: async (email) => {
    try {
      const response = await api.post('/auth/forgot-password', { email });
      return response.data;
    } catch (error) {
      console.error('Password reset request error:', error);
      throw error;
    }
  },

  // Reset password
  resetPassword: async (token, newPassword) => {
    try {
      const response = await api.post('/auth/reset-password', { token, newPassword });
      return response.data;
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  },

  // Change password
  changePassword: async (currentPassword, newPassword) => {
    try {
      const response = await api.post('/auth/change-password', { currentPassword, newPassword });
      return response.data;
    } catch (error) {
      console.error('Password change error:', error);
      throw error;
    }
  },

  // Get all users
  getUsers: async () => {
    try {
      const response = await api.get('/auth/users');
      return response.data;
    } catch (error) {
      console.error('Get users error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch users'
      };
    }
  },

  // Get all roles
  getRoles: async () => {
    try {
      const response = await api.get('/auth/roles');
      return response.data;
    } catch (error) {
      console.error('Get roles error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch roles'
      };
    }
  },

  // Create new user
  createUser: async (userData) => {
    try {
      const response = await api.post('/auth/users', userData);
      return response.data;
    } catch (error) {
      console.error('Create user error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to create user'
      };
    }
  },

  // Update user status
  updateUserStatus: async (userId, status) => {
    try {
      const response = await api.patch(`/auth/users/${userId}/status`, { status });
      return response.data;
    } catch (error) {
      console.error('Update user status error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update user status'
      };
    }
  },

  // Get user by ID
  getUserById: async (userId) => {
    try {
      const response = await api.get(`/auth/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Get user error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch user'
      };
    }
  },

  // Update user
  updateUser: async (userId, userData) => {
    try {
      const response = await api.put(`/auth/users/${userId}`, userData);
      return response.data;
    } catch (error) {
      console.error('Update user error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update user'
      };
    }
  },

  // Delete user
  deleteUser: async (userId) => {
    try {
      const response = await api.delete(`/auth/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Delete user error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to delete user'
      };
    }
  }
};

// Initialize auth state when the service is imported
authService.initializeAuth();

export default authService; 