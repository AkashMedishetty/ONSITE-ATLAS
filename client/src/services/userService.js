import api from './api'; // Assuming your main Axios instance is named api.js

const API_URL = '/users'; // Base URL for user-related endpoints

/**
 * Creates a new user.
 * @param {object} userData - The user data (name, email, password, role).
 * @returns {Promise} Axios promise object.
 */
const createUser = (userData) => {
  return api.post(API_URL, userData);
};

/**
 * Gets all users.
 * @param {object} params - Optional query parameters (e.g., for pagination, sorting, filtering).
 * @returns {Promise} Axios promise object.
 */
const getUsers = (params) => {
  return api.get(API_URL, { params });
};

/**
 * Gets a single user by ID.
 * @param {string} userId - The ID of the user.
 * @returns {Promise} Axios promise object.
 */
const getUserById = (userId) => {
  return api.get(`${API_URL}/${userId}`);
};

/**
 * Updates an existing user.
 * @param {string} userId - The ID of the user to update.
 * @param {object} userData - The user data to update.
 * @returns {Promise} Axios promise object.
 */
const updateUser = (userId, userData) => {
  return api.put(`${API_URL}/${userId}`, userData);
};

/**
 * Deletes a user.
 * @param {string} userId - The ID of the user to delete.
 * @returns {Promise} Axios promise object.
 */
const deleteUser = (userId) => {
  return api.delete(`${API_URL}/${userId}`);
};

// You can add other user-specific service functions here, e.g.:
// const getCurrentUserProfile = () => api.get(`${API_URL}/me`);
// const updateUserProfile = (profileData) => api.put(`${API_URL}/me`, profileData);

const userService = {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  // getCurrentUserProfile, 
  // updateUserProfile,
};

export default userService; 