import axios from 'axios';
import { API_URL, REGISTRANT_TOKEN_KEY } from '../config'; // Base API URL and token key
import { getRegistrantAuthHeader } from '../utils/authUtils'; // For registrant token
import { toast } from 'react-toastify'; // Or your preferred notification library

// Create Axios instance for registrant-specific API calls
const apiRegistrant = axios.create({
  baseURL: API_URL, // Same base URL as the main API
  timeout: 30000, // 30 seconds timeout
  // withCredentials: true, // Usually not needed if using Bearer tokens, but depends on backend setup
});

// Request Interceptor for Registrant API
apiRegistrant.interceptors.request.use(
  (config) => {
    // Get auth headers from utility function
    const authHeaders = getRegistrantAuthHeader(); // Gets { 'Authorization': 'Bearer REG_TOKEN' } or {}
    
    // For debugging - check if token exists in localStorage directly
    const rawToken = localStorage.getItem(REGISTRANT_TOKEN_KEY);
    
    if (authHeaders.Authorization) {
      config.headers['Authorization'] = authHeaders.Authorization;
      if (process.env.NODE_ENV === 'development') {
        console.log(`[API Registrant Interceptor] Auth header added for ${config.url}`);
        console.log(`[API Registrant Interceptor] Token found: ${authHeaders.Authorization.substring(0, 20)}...`);
      }
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[API Registrant Interceptor] No registrant token found for ${config.url}`);
        console.warn(`[API Registrant Interceptor] Checked localStorage for key: ${REGISTRANT_TOKEN_KEY}`);
        console.warn(`[API Registrant Interceptor] Raw token in storage: ${rawToken ? 'Present' : 'Not found'}`);
      }
    }
    
    // Log requests in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API Registrant] Request: ${config.method.toUpperCase()} ${config.baseURL}${config.url}`);
    }
    
    return config;
  },
  (error) => {
    if (process.env.NODE_ENV === 'development') {
      console.error('[API Registrant] Request Error:', error);
    }
    return Promise.reject(error);
  }
);

// Response Interceptor for Registrant API
apiRegistrant.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[API Registrant] Response:', {
        url: response.config.url,
        status: response.status,
        // data: response.data // Be careful logging full data in production
      });
    }
    // Axios typically returns response.data for 2xx status codes in the .then() block of the caller.
    // If you want to ensure all successful responses from this instance always return response.data directly:
    // return response.data; 
    // However, often it's better to let the calling service handle response.data
    return response; 
  },
  (error) => {
    if (process.env.NODE_ENV === 'development') {
      console.error('[API Registrant] Response Error:', {
        url: error.config?.url,
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
        data: error.response?.data 
      });
    }

    if (error.response?.status === 401) {
      // Handle unauthorized errors specifically for registrant context if needed
      console.warn('[API Registrant] Unauthorized access detected (401). Clearing token...');
      
      // Clear the token from storage to force re-login
      localStorage.removeItem(REGISTRANT_TOKEN_KEY);
      localStorage.removeItem('registrantData');
      
      // Show error notification
      toast.error(error.response?.data?.message || 'Your session has expired. Please log in again.');
      
      // If not on a login page, redirect (optional)
      const currentPath = window.location.pathname;
      if (!currentPath.includes('/auth/login') && !currentPath.includes('/register')) {
        // Get the active event ID reliably from localStorage
        const activeEventId = localStorage.getItem('activeEventId');
        let redirectUrl = '/registrant-portal/auth/login';
        if (activeEventId) {
          redirectUrl += `?event=${activeEventId}`;
        } else {
          console.warn('[API Registrant] Could not find activeEventId in localStorage during 401 redirect.');
          // Optionally, try to get it from the current URL as a fallback, though less reliable
          const fallbackParams = new URLSearchParams(window.location.search);
          const fallbackEventId = fallbackParams.get('event');
          if (fallbackEventId) {
            redirectUrl += `?event=${fallbackEventId}`;
          }
        }
        
        // Preserve query parameters during redirect
        window.location.href = redirectUrl;
      }
    }
    
    // Important: Re-throw the error so that the calling function's .catch() block can handle it
    return Promise.reject(error);
  }
);

export default apiRegistrant; 