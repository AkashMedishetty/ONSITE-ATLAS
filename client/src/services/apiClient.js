import axios from 'axios';
import { API_URL } from '../config';

// Key for storing client portal JWT
const CLIENT_TOKEN_KEY = 'client_jwt_token';

// Create Axios instance for client portal
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 30000,
});

// Request interceptor: add Authorization header if token exists
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(CLIENT_TOKEN_KEY);
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 errors and log others
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login if unauthorized
      localStorage.removeItem(CLIENT_TOKEN_KEY);
      // Try to extract eventId from the current URL
      const match = window.location.pathname.match(/([0-9a-fA-F]{24})/); // Mongo ObjectId
      const eventId = match ? match[1] : null;
      if (eventId) {
        window.location.href = `/portal/client-login/${eventId}`;
      } else {
        window.location.href = '/client/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient; 