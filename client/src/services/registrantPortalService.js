import api from './api';

// Base URL for registrant portal API
const baseUrl = '/registrant-portal';

// Authentication functions
export const login = async (registrationId, mobileNumber, eventId) => {
  try {
    console.log('Registrant service: attempting login', { registrationId, mobileNumber, eventId });
    
    const response = await api.post(`${baseUrl}/login`, { 
      registrationId, 
      mobileNumber, 
      eventId
    });
    
    console.log('Registrant login response:', response.data);
    
    // Store token and user data in localStorage if login is successful
    if (response.data && response.data.token) {
      localStorage.setItem('registrantToken', response.data.token);
      
      // Handle the user data which might be in data.data or directly in data.user
      const userData = response.data.data || response.data.user;
      if (userData) {
        localStorage.setItem('registrantData', JSON.stringify(userData));
        console.log('Registrant data saved to localStorage');
      }
    } else {
      console.warn('No token received in login response');
    }
    
    return response.data;
  } catch (error) {
    console.error('Registrant login error:', error.response?.data || error.message);
    throw error;
  }
};

export const register = async (registrationId, email, password) => {
  const response = await api.post(`${baseUrl}/register`, { 
    registrationId, 
    email, 
    password 
  });
  return response.data;
};

export const verifyAccount = async (token) => {
  const response = await api.post(`${baseUrl}/verify`, { token });
  return response.data;
};

export const forgotPassword = async (email) => {
  const response = await api.post(`${baseUrl}/forgot-password`, { email });
  return response.data;
};

export const resetPassword = async (token, password) => {
  const response = await api.post(`${baseUrl}/reset-password`, { token, password });
  return response.data;
};

export const logout = () => {
  localStorage.removeItem('registrantToken');
  localStorage.removeItem('registrantData');
};

// Helper function to create authenticated request config
const getAuthConfig = () => {
  const token = localStorage.getItem('registrantToken');
  return {
    headers: { Authorization: `Bearer ${token}` }
  };
};

// Check if user is logged in
export const isAuthenticated = () => {
  return !!localStorage.getItem('registrantToken');
};

// Get current registrant data
export const getCurrentRegistrant = () => {
  const data = localStorage.getItem('registrantData');
  return data ? JSON.parse(data) : null;
};

// Profile functions
export const getProfile = async () => {
  const response = await api.get(`${baseUrl}/profile`, getAuthConfig());
  return response.data;
};

export const updateProfile = async (profileData) => {
  const response = await api.put(`${baseUrl}/profile`, profileData, getAuthConfig());
  return response.data;
};

// Registration functions
export const getRegistration = async () => {
  const response = await api.get(`${baseUrl}/registration`, getAuthConfig());
  return response.data;
};

// Payment functions
export const getPayments = async () => {
  const response = await api.get(`${baseUrl}/payments`, getAuthConfig());
  return response.data;
};

export const getInvoice = async (paymentId) => {
  const response = await api.get(`${baseUrl}/payments/${paymentId}/invoice`, getAuthConfig());
  return response.data;
};

// Event information functions
export const getEventDetails = async () => {
  const response = await api.get(`${baseUrl}/event`, getAuthConfig());
  return response.data;
};

export const getAnnouncements = async () => {
  const response = await api.get(`${baseUrl}/announcements`, getAuthConfig());
  return response.data;
};

export const getResources = async () => {
  const response = await api.get(`${baseUrl}/resources`, getAuthConfig());
  return response.data;
};

export const downloadResource = async (resourceId) => {
  const response = await api.get(`${baseUrl}/resources/${resourceId}`, getAuthConfig());
  return response.data;
};

// Workshop functions
export const getWorkshops = async () => {
  const response = await api.get(`${baseUrl}/workshops`, getAuthConfig());
  return response.data;
};

export const registerForWorkshop = async (workshopId) => {
  const response = await api.post(`${baseUrl}/workshops/${workshopId}/register`, {}, getAuthConfig());
  return response.data;
};

// Abstract functions
export const getAbstracts = async () => {
  const response = await api.get(`${baseUrl}/abstracts`, getAuthConfig());
  return response.data;
};

export const submitAbstract = async (abstractData) => {
  const response = await api.post(`${baseUrl}/abstracts`, abstractData, getAuthConfig());
  return response.data;
};

export const getAbstractById = async (abstractId) => {
  const response = await api.get(`${baseUrl}/abstracts/${abstractId}`, getAuthConfig());
  return response.data;
};

export const updateAbstract = async (abstractId, abstractData) => {
  const response = await api.put(`${baseUrl}/abstracts/${abstractId}`, abstractData, getAuthConfig());
  return response.data;
};

// Certificate functions
export const getCertificates = async () => {
  const response = await api.get(`${baseUrl}/certificates`, getAuthConfig());
  return response.data;
};

export const downloadCertificate = async (certificateId) => {
  const response = await api.get(`${baseUrl}/certificates/${certificateId}`, getAuthConfig());
  return response.data;
};

const registrantPortalService = {
  login,
  register,
  verifyAccount,
  forgotPassword,
  resetPassword,
  logout,
  isAuthenticated,
  getCurrentRegistrant,
  getProfile,
  updateProfile,
  getRegistration,
  getPayments,
  getInvoice,
  getEventDetails,
  getAnnouncements,
  getResources,
  downloadResource,
  getWorkshops,
  registerForWorkshop,
  getAbstracts,
  submitAbstract,
  getAbstractById,
  updateAbstract,
  getCertificates,
  downloadCertificate,
};

export default registrantPortalService; 


