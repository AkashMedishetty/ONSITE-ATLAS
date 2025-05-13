/**
 * API Service
 * 
 * Core utilities for API communication across the application.
 * Provides standardized error handling, authentication, and response processing.
 */
import axios from 'axios';

// API base URL from environment variable with fallback
export const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Token name constant for consistency
const TOKEN_NAME = 'token';

// Setup axios interceptors for authentication
axios.interceptors.request.use(
  config => {
    // Get auth token from localStorage for each request
    const token = localStorage.getItem(TOKEN_NAME);
    
    // If token exists, add it to the request headers
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Development logs
    if (import.meta.env.MODE === 'development') {
      console.log(`API Request: ${config.method.toUpperCase()} ${config.url}`);
      if (token) {
        console.log('Token included in request');
      } else {
        console.warn('No token found for request');
      }
    }
    
    return config;
  },
  error => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for better error handling
axios.interceptors.response.use(
  response => {
    return response;
  },
  error => {
    if (error.response && error.response.status === 401) {
      console.error('Authentication error - token may be invalid or expired');
      // Consider redirecting to login page or refreshing token here
    }
    return Promise.reject(error);
  }
);

// Handle API response formatting and error checking
export const handleApiResponse = async (response) => {
  // For Axios responses, data is already parsed
  try {
    // Log the raw API response in development
    if (import.meta.env.MODE === 'development') {
      console.log('API Response:', response.data);
    }
    
    const data = response.data;
    
    // Handle different response formats consistently
    if (data && typeof data === 'object') {
      // If the response has a success property, return it directly
      if ('success' in data) {
        return data;
      }
      
      // If the response has a data property, wrap it in a success structure
      if ('data' in data) {
        return { success: true, ...data };
      }
      
      // Otherwise, assume the response is the data itself
      return { success: true, data };
    }
    
    // For primitive responses, wrap them in a data property
    return { success: true, data };
  } catch (error) {
    console.error('Error processing API response:', error);
    throw new Error('Failed to process API response');
  }
};

// Generic fetch with authentication
export const fetchWithAuth = async (url, options = {}) => {
  // Get auth token from localStorage
  const token = localStorage.getItem(TOKEN_NAME);
  
  // Set up default headers
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  // Add authentication header if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  // Development logs
  if (import.meta.env.MODE === 'development') {
    console.log(`API Request: ${options.method || 'GET'} ${url}`);
    if (options.body) {
      console.log('Request Body:', JSON.parse(options.body));
    }
  }
  
  // Perform the fetch with timeout
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Request timed out');
    }
    console.error('Fetch error:', error);
    throw error;
  }
};

// HTTP Request methods using axios
const get = async (endpoint, params = {}) => {
  const url = endpoint.startsWith('http') ? endpoint : `${baseURL}${endpoint}`;
  const response = await axios.get(url, { params });
  return response;
};

const post = async (endpoint, data = {}) => {
  const url = endpoint.startsWith('http') ? endpoint : `${baseURL}${endpoint}`;
  const response = await axios.post(url, data);
  return response;
};

const put = async (endpoint, data = {}) => {
  const url = endpoint.startsWith('http') ? endpoint : `${baseURL}${endpoint}`;
  const response = await axios.put(url, data);
  return response;
};

const del = async (endpoint) => {
  const url = endpoint.startsWith('http') ? endpoint : `${baseURL}${endpoint}`;
  const response = await axios.delete(url);
  return response;
};

// Check authentication status
export const checkAuth = async () => {
  try {
    const response = await fetchWithAuth(`${baseURL}/auth/check`);
    return await handleApiResponse(response);
  } catch (error) {
    console.error('Auth check failed:', error);
    return { authenticated: false };
  }
};

// Helper to handle API errors in components
export const handleApiError = (error, defaultMessage = 'An unexpected error occurred') => {
  console.error('API Error:', error);
  
  if (error.message) {
    return error.message;
  }
  
  return defaultMessage;
};

export default {
  baseURL,
  handleApiResponse,
  fetchWithAuth,
  checkAuth,
  handleApiError,
  get,
  post,
  put,
  delete: del  // Using 'del' alias since 'delete' is a reserved keyword
}; 