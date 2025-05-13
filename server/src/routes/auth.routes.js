const express = require('express');
const { register, login, getMe, refreshToken, logout, getUsers, getUserById, createUser, updateUserStatus, getRoles } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');
// Commenting out middleware for development
// const { validateRegistration, validateLogin, validateUserCreation } = require('../middleware/validation.middleware');

const router = express.Router();

// Public routes - validation bypassed
router.post('/register', register); // validateRegistration removed
router.post('/login', login); // validateLogin removed
router.post('/refresh-token', refreshToken);

// Protected routes - protection bypassed
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);

// User management routes - admin access - protection bypassed
router.get('/users', protect, getUsers);
router.post('/users', protect, createUser);
router.get('/users/:id', protect, getUserById);
router.patch('/users/:id/status', protect, updateUserStatus);
router.get('/roles', protect, getRoles);

module.exports = router; 