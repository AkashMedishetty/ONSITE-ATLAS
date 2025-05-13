import axios from 'axios';
import { toast } from 'react-toastify';

// Determine the base URL based on environment
const baseURL = process.env.NODE_ENV === 'production' 
  ? '/api'
  : 'http://localhost:5000/api';

console.log('API configured with baseURL:', baseURL);

// Create axios instance
const api = axios.create({
  baseURL,
  timeout: 120000, // Increase timeout to 120 seconds (120,000 ms)
  withCredentials: true, // Important for cookies
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Check URL to determine which token to use
    const isRegistrantEndpoint = config.url.includes('/registrant-portal');
    const isAuthEndpoint = config.url.includes('/auth/login') || config.url.includes('/auth/register');
    
    // Skip adding token for auth endpoints
    if (isAuthEndpoint) {
      console.log(`[Request Interceptor] Auth endpoint detected: ${config.url}, skipping token`);
      return config;
    }
    
    // Get the appropriate token
    const tokenKey = isRegistrantEndpoint ? 'registrantToken' : 'token';
    const token = localStorage.getItem(tokenKey);
    
    console.log(`[Request Interceptor] ${isRegistrantEndpoint ? 'Registrant' : 'User'} token check for ${config.url}. Found: ${token ? 'Yes' : 'No'}`);
    
    // Add token to headers if it exists
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log(`[Request Interceptor] ${isRegistrantEndpoint ? 'Registrant' : 'User'} Authorization header added for ${config.url}`);
    } else {
      console.warn(`[Request Interceptor] No ${isRegistrantEndpoint ? 'registrant' : 'user'} token found for ${config.url}`);
    }
    
    // Log requests in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`API Request: ${config.method.toUpperCase()} ${config.url}`);
    }
    
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('API Response:', {
        url: response.config.url,
        status: response.status,
        data: response.data
      });
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const url = originalRequest?.url || '';
    
    // Determine portal type by URL
    const isRegistrantEndpoint = url.includes('/registrant-portal');
    const isReviewerEndpoint = url.includes('/reviewer-portal');
    const isAdminEndpoint = url.includes('/admin') || url.includes('/global-admin') || url.includes('/super-admin');
    const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/register');
    
    // Don't handle auth errors for login/register endpoints
    if (isAuthEndpoint) {
      return Promise.reject(error);
    }

    // Set login path based on portal
    let loginPath = '/login'; // Default fallback
    if (isRegistrantEndpoint) {
      loginPath = '/registrant-portal/auth/login';
    } else if (isReviewerEndpoint) {
      loginPath = '/reviewer/login';
    } else if (isAdminEndpoint) {
      loginPath = '/admin/login';
    }

    // Handle 401 errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      console.error(`Authentication failed (401) for ${isRegistrantEndpoint ? 'registrant' : isReviewerEndpoint ? 'reviewer' : isAdminEndpoint ? 'admin' : 'user'}, logging out.`);
      // Clear only the relevant token
      if (isRegistrantEndpoint) {
        localStorage.removeItem('registrantToken');
        localStorage.removeItem('registrantData');
      } else if (isReviewerEndpoint) {
        localStorage.removeItem('reviewerToken');
        localStorage.removeItem('reviewerData');
      } else if (isAdminEndpoint) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
      // Robust redirect logic for portal isolation
      const currentPath = window.location.pathname;
      if (currentPath.startsWith('/registrant-portal')) {
        window.location.href = '/registrant-portal/auth/login';
      } else if (currentPath.startsWith('/reviewer')) {
        window.location.href = '/reviewer/login';
      } else if (currentPath.startsWith('/admin')) {
        window.location.href = '/admin/login';
      } else {
        window.location.href = loginPath;
      }
      toast.error('Session expired or invalid. Please login again.');
      return Promise.reject(error);
    }

    // Handle other errors
    const errorMessage = error.response?.data?.message || 'An error occurred';
    if (process.env.NODE_ENV === 'development') {
      console.error('API Error:', {
        url: error.config?.url,
        status: error.response?.status,
        message: errorMessage
      });
    }

    return Promise.reject(error);
  }
);

export default api; 