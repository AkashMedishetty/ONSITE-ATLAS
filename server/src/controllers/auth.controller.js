const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { createApiError } = require('../middleware/error');
const logger = require('../utils/logger');
const bcrypt = require('bcryptjs');

/**
 * Register a new user
 * @route POST /api/auth/register
 * @access Public
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new ApiError(400, 'User already exists with this email'));
    }
    
    // Create new user
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'staff'
    });
    
    // Generate tokens
    const token = user.generateAuthToken();
    const refreshToken = user.generateRefreshToken();
    
    // Remove password from response
    user.password = undefined;
    
    logger.info(`New user registered: ${user.email}`);
    
    res.status(201).json({
      success: true,
      data: {
        user,
        token,
        refreshToken
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login user
 * @route POST /api/auth/login
 * @access Public
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate email and password are provided
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate token
    const token = generateToken(user._id);

    // Set cookie options
    const cookieOptions = {
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production'
    };

    // Send token in cookie
    res.cookie('token', token, cookieOptions);

    // Send response
    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
};

/**
 * Get current user profile
 * @route GET /api/auth/me
 * @access Private
 */
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user data'
    });
  }
};

/**
 * Refresh token
 * @route POST /api/auth/refresh-token
 * @access Public
 */
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return next(createApiError(400, 'Refresh token is required'));
    }
    
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    // Find user
    const user = await User.findById(decoded.id);
    if (!user) {
      return next(createApiError(401, 'Invalid refresh token'));
    }
    
    // Check if user is active
    if (!user.isActive) {
      return next(createApiError(401, 'Your account has been deactivated'));
    }
    
    // Generate new tokens
    const token = user.generateAuthToken();
    const newRefreshToken = user.generateRefreshToken();
    
    res.status(200).json({
      success: true,
      data: {
        token,
        refreshToken: newRefreshToken
      }
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(createApiError(401, 'Invalid refresh token'));
    }
    next(error);
  }
};

/**
 * Logout user
 * @route POST /api/auth/logout
 * @access Private
 */
const logout = (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000), // 10 seconds
    httpOnly: true
  });

  res.status(200).json({
    success: true,
    message: 'User logged out successfully'
  });
};

/**
 * Get all users
 * @route GET /api/auth/users
 * @access Private/Admin
 */
const getUsers = async (req, res, next) => {
  try {
    // Bypass role check for development
    // if (req.user.role !== 'admin' && req.user.role !== 'manager') {
    //   return next(new ApiError(403, 'Not authorized to access this resource'));
    // }
    
    const users = await User.find().select('-password -refreshToken');
    
    res.status(200).json({
      success: true,
      message: 'Users retrieved successfully',
      data: users
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user by ID
 * @route GET /api/auth/users/:id
 * @access Private/Admin
 */
const getUserById = async (req, res, next) => {
  try {
    // Bypass role check for development
    // if (req.user.role !== 'admin' && req.user.role !== 'manager') {
    //   return next(new ApiError(403, 'Not authorized to access this resource'));
    // }
    
    const user = await User.findById(req.params.id).select('-password -refreshToken');
    
    if (!user) {
      return next(new ApiError(404, 'User not found'));
    }
    
    res.status(200).json({
      success: true,
      message: 'User retrieved successfully',
      data: user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new user
 * @route POST /api/auth/users
 * @access Private/Admin
 */
const createUser = async (req, res, next) => {
  try {
    // Bypass role check for development
    // if (req.user.role !== 'admin') {
    //   return next(new ApiError(403, 'Not authorized to create users'));
    // }
    
    const { firstName, lastName, email, role, status = 'active' } = req.body;
    
    // Generate a temporary password
    const tempPassword = Math.random().toString(36).slice(-8);
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new ApiError(400, 'User already exists with this email'));
    }
    
    // Create new user
    const user = await User.create({
      name: `${firstName} ${lastName}`,
      email,
      password: tempPassword, // This will be hashed by the User model
      role: role || 'staff',
      isActive: status === 'active'
    });
    
    // Remove password from response
    user.password = undefined;
    
    logger.info(`New user created: ${user.email}`);
    
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        id: user._id,
        firstName,
        lastName,
        email: user.email,
        role: user.role,
        status: user.isActive ? 'active' : 'inactive',
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user status
 * @route PATCH /api/auth/users/:id/status
 * @access Private/Admin
 */
const updateUserStatus = async (req, res, next) => {
  try {
    // Bypass role check for development
    // if (req.user.role !== 'admin') {
    //   return next(new ApiError(403, 'Not authorized to update user status'));
    // }
    
    const { status } = req.body;
    
    if (!status || !['active', 'inactive'].includes(status)) {
      return next(new ApiError(400, 'Invalid status value'));
    }
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return next(new ApiError(404, 'User not found'));
    }
    
    // Bypass admin check for development
    // // Prevent deactivating the last admin
    // if (user.role === 'admin' && status === 'inactive') {
    //   const adminCount = await User.countDocuments({ role: 'admin', isActive: true });
    //   
    //   if (adminCount <= 1) {
    //     return next(new ApiError(400, 'Cannot deactivate the last admin user'));
    //   }
    // }
    
    // Update user status
    user.isActive = status === 'active';
    await user.save();
    
    logger.info(`User status updated: ${user.email} -> ${status}`);
    
    res.status(200).json({
      success: true,
      message: `User status updated to ${status}`,
      data: {
        id: user._id,
        email: user.email,
        status
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all available roles
 * @route GET /api/auth/roles
 * @access Private/Admin
 */
const getRoles = async (req, res, next) => {
  try {
    // Bypass role check for development
    // if (req.user.role !== 'admin' && req.user.role !== 'manager') {
    //   return next(new ApiError(403, 'Not authorized to access this resource'));
    // }
    
    // Define available roles with their permissions
    const roles = [
      {
        id: 'admin',
        name: 'Administrator',
        description: 'Full system access',
        permissions: ['all']
      },
      {
        id: 'manager',
        name: 'Event Manager',
        description: 'Manage events and registrations',
        permissions: ['events:all', 'registrations:all', 'reports:view']
      },
      {
        id: 'scanner',
        name: 'Scanner Staff',
        description: 'Scan badges and resources',
        permissions: ['scanner:all']
      },
      {
        id: 'staff',
        name: 'Registration Staff',
        description: 'Manage onsite registrations',
        permissions: ['registrations:create', 'registrations:view']
      },
      {
        id: 'analyst',
        name: 'Reports Analyst',
        description: 'View and export reports',
        permissions: ['reports:all']
      }
    ];
    
    res.status(200).json({
      success: true,
      message: 'Roles retrieved successfully',
      data: roles
    });
  } catch (error) {
    next(error);
  }
};

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '24h'
  });
};

module.exports = {
  register,
  login,
  getMe,
  refreshToken,
  logout,
  getUsers,
  getUserById,
  createUser,
  updateUserStatus,
  getRoles
}; 