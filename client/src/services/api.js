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
    // Detect sponsor portal endpoints
    const isSponsorEndpoint = config.url.includes('/sponsor-portal-auth') || config.url.includes('/sponsor-auth');
    const isRegistrantEndpoint = config.url.includes('/registrant-portal');
    const isAuthEndpoint = config.url.includes('/auth/login') || config.url.includes('/auth/register');
    if (isAuthEndpoint) {
      return config;
    }
    // Use correct token
    let token;
    if (isSponsorEndpoint) {
      token = localStorage.getItem('sponsorToken');
    } else if (isRegistrantEndpoint) {
      token = localStorage.getItem('registrantToken');
    } else {
      token = localStorage.getItem('token');
    }
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
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
    const isSponsorEndpoint = url.includes('/sponsor-portal-auth') || url.includes('/sponsor-auth');
    const isRegistrantEndpoint = url.includes('/registrant-portal');
    const isReviewerEndpoint = url.includes('/reviewer-portal');
    const isAdminEndpoint = url.includes('/admin') || url.includes('/global-admin') || url.includes('/super-admin');
    const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/register');
    
    // Don't handle auth errors for login/register endpoints
    if (isAuthEndpoint) {
      return Promise.reject(error);
    }

    // Sponsor portal: redirect to sponsor login with eventId
    if (isSponsorEndpoint && error.response?.status === 401 && !originalRequest._retry) {
      // Try to get eventId from sponsorData BEFORE removing it
      let eventId = null;
      const sponsorData = localStorage.getItem('sponsorData');
      if (sponsorData) {
        try {
          eventId = JSON.parse(sponsorData).eventId;
        } catch {}
      }
      // Remove sponsor token and data
      localStorage.removeItem('sponsorToken');
      localStorage.removeItem('sponsorData');
      if (!eventId) {
        // Try to get from current path if possible
        const match = window.location.pathname.match(/sponsor-portal\/events\/(\w+)/);
        if (match) eventId = match[1];
      }
      if (eventId) {
        window.location.href = `/portal/sponsor-login/${eventId}`;
      } else {
        window.location.href = '/portal/sponsor-login/';
      }
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

    // Handle 401 errors for other portals
    if (error.response?.status === 401 && !originalRequest._retry) {
      console.error(`Authentication failed (401) for ${isRegistrantEndpoint ? 'registrant' : isReviewerEndpoint ? 'reviewer' : isAdminEndpoint ? 'admin' : 'user'}, logging out.`);
      // Store intended destination before redirect
      const currentUrl = window.location.pathname + window.location.search;
      localStorage.setItem('redirectAfterLogin', currentUrl);
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