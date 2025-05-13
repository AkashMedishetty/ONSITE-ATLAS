/**
 * Configuration for the client application
 */

// API configuration
export const API_URL = 'http://localhost:5000/api';

// App configuration
export const APP_NAME = 'ONSITE ATLAS';
export const APP_VERSION = '1.0.0';

// Feature flags
export const FEATURES = {
  ABSTRACTS_ENABLED: true,
  PAYMENT_GATEWAY_ENABLED: false,
  DEBUG_MODE: false
};

// Default pagination
export const DEFAULT_PAGE_SIZE = 10;

// Auth configuration
export const TOKEN_KEY = 'atlas_auth_token';
export const REGISTRANT_TOKEN_KEY = 'atlas_registrant_token'; 