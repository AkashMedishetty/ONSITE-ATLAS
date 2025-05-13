import { TOKEN_KEY, REGISTRANT_TOKEN_KEY } from '../config';

/**
 * Get the authentication header with Bearer token for API requests
 * @returns {Object} Authentication header object
 */
export const getAuthHeader = () => {
  console.log('[authUtils] Attempting to get token with key:', TOKEN_KEY);
  const token = localStorage.getItem(TOKEN_KEY);
  console.log('[authUtils] Token found in localStorage:', token ? token.substring(0, 20) + '...' : token);
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

/**
 * Get the registrant authentication header with Bearer token for API requests
 * @returns {Object} Registrant-specific authentication header object
 */
export const getRegistrantAuthHeader = () => {
  const token = localStorage.getItem(REGISTRANT_TOKEN_KEY);
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

/**
 * Check if user is authenticated
 * @returns {boolean} Whether the user is authenticated 
 */
export const isAuthenticated = () => {
  return !!localStorage.getItem(TOKEN_KEY);
};

/**
 * Check if registrant is authenticated
 * @returns {boolean} Whether the registrant is authenticated
 */
export const isRegistrantAuthenticated = () => {
  return !!localStorage.getItem(REGISTRANT_TOKEN_KEY);
}; 