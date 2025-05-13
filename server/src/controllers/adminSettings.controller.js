const { User, Event, CustomField } = require('../models');
const { ApiError } = require('../utils/ApiError');
const httpStatus = require('http-status');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * Get available event setting tabs
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getEventSettingTabs = async (req, res) => {
  const { eventId } = req.params;
  
  // Check if event exists
  const event = await Event.findById(eventId);
  if (!event) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Event not found');
  }
  
  // Define available tabs
  const tabs = [
    {
      id: 'general',
      name: 'General Settings',
      icon: 'cog',
      order: 1
    },
    {
      id: 'registration',
      name: 'Registration',
      icon: 'user-plus',
      order: 2
    },
    {
      id: 'categories',
      name: 'Categories',
      icon: 'tags',
      order: 3
    },
    {
      id: 'resources',
      name: 'Resources',
      icon: 'box',
      order: 4
    },
    {
      id: 'abstracts',
      name: 'Abstracts',
      icon: 'file-text',
      order: 5
    },
    {
      id: 'landing-pages',
      name: 'Landing Pages',
      icon: 'layout',
      order: 6
    },
    {
      id: 'payments',
      name: 'Payments & Pricing',
      icon: 'credit-card',
      order: 7
    },
    {
      id: 'workshops',
      name: 'Workshops',
      icon: 'clipboard',
      order: 8
    },
    {
      id: 'sponsors',
      name: 'Sponsors',
      icon: 'award',
      order: 9
    },
    {
      id: 'hotel-travel',
      name: 'Hotel & Travel',
      icon: 'map-pin',
      order: 10
    },
    {
      id: 'notifications',
      name: 'Notifications',
      icon: 'bell',
      order: 11
    },
    {
      id: 'permissions',
      name: 'Permissions',
      icon: 'shield',
      order: 12
    }
  ];
  
  res.status(httpStatus.OK).json(tabs);
};

/**
 * Get settings for a specific event tab
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getEventTabSettings = async (req, res) => {
  const { eventId, tab } = req.params;
  
  // Check if event exists
  const event = await Event.findById(eventId);
  if (!event) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Event not found');
  }
  
  let settings = {};
  
  switch (tab) {
    case 'general':
      settings = {
        name: event.name,
        description: event.description,
        startDate: event.startDate,
        endDate: event.endDate,
        timeZone: event.timeZone,
        venue: event.venue,
        logoUrl: event.logoUrl,
        bannerUrl: event.bannerUrl,
        isActive: event.isActive
      };
      break;
      
    case 'registration':
      settings = {
        registrationOpen: event.registrationOpen,
        registrationClose: event.registrationClose,
        registrationIdFormat: event.registrationIdFormat,
        maxRegistrations: event.maxRegistrations,
        collectAdditionalInfo: event.collectAdditionalInfo
      };
      
      // Get custom fields for registration
      const registrationFields = await CustomField.find({
        event: eventId,
        formType: 'registration',
        isActive: true
      }).sort({ order: 1 });
      
      settings.customFields = registrationFields;
      break;
      
    // Additional case handlers for other tabs
    // ...
    
    default:
      throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid tab specified');
  }
  
  res.status(httpStatus.OK).json(settings);
};

/**
 * Update settings for a specific event tab
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateEventTabSettings = async (req, res) => {
  const { eventId, tab } = req.params;
  const updateData = req.body;
  
  // Check if event exists
  const event = await Event.findById(eventId);
  if (!event) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Event not found');
  }
  
  switch (tab) {
    case 'general':
      // Update general event settings
      Object.assign(event, {
        name: updateData.name || event.name,
        description: updateData.description || event.description,
        startDate: updateData.startDate || event.startDate,
        endDate: updateData.endDate || event.endDate,
        timeZone: updateData.timeZone || event.timeZone,
        venue: updateData.venue || event.venue,
        logoUrl: updateData.logoUrl || event.logoUrl,
        bannerUrl: updateData.bannerUrl || event.bannerUrl,
        isActive: updateData.isActive !== undefined ? updateData.isActive : event.isActive
      });
      break;
      
    case 'registration':
      // Update registration settings
      Object.assign(event, {
        registrationOpen: updateData.registrationOpen || event.registrationOpen,
        registrationClose: updateData.registrationClose || event.registrationClose,
        registrationIdFormat: updateData.registrationIdFormat || event.registrationIdFormat,
        maxRegistrations: updateData.maxRegistrations || event.maxRegistrations,
        collectAdditionalInfo: updateData.collectAdditionalInfo !== undefined ? updateData.collectAdditionalInfo : event.collectAdditionalInfo
      });
      break;
      
    // Additional case handlers for other tabs
    // ...
    
    default:
      throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid tab specified');
  }
  
  await event.save();
  
  res.status(httpStatus.OK).json({
    message: `${tab} settings updated successfully`,
    success: true
  });
};

/**
 * Update user permissions
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateUserPermissions = async (req, res) => {
  const { userId } = req.params;
  const { role, extendedPermissions, events } = req.body;
  
  // Check if user exists
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  
  // Update user role if provided
  if (role) {
    user.role = role;
  }
  
  // Update extended permissions if provided
  if (extendedPermissions) {
    user.extendedPermissions = {
      ...user.extendedPermissions,
      ...extendedPermissions
    };
  }
  
  // Update events if provided
  if (events) {
    user.events = events;
  }
  
  await user.save();
  
  res.status(httpStatus.OK).json({
    message: 'User permissions updated successfully',
    success: true
  });
};

/**
 * Create a sponsor admin account
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createSponsorAdmin = async (req, res) => {
  const { name, email, password, sponsorOrganization } = req.body;
  
  // Check if email already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already in use');
  }
  
  // Create new user with sponsor admin role
  const user = await User.create({
    name,
    email,
    password,
    role: 'staff',
    isSponsorAdmin: true,
    sponsorOrganization,
    extendedPermissions: {
      canManageLandingPages: false,
      canManagePayments: false,
      canManageSponsors: true,
      canManageWorkshops: false,
      canReviewAbstracts: false,
      canManageHotelTravel: false
    }
  });
  
  res.status(httpStatus.CREATED).json({
    message: 'Sponsor admin created successfully',
    success: true,
    userId: user._id
  });
};

module.exports = {
  getEventSettingTabs,
  getEventTabSettings,
  updateEventTabSettings,
  updateUserPermissions,
  createSponsorAdmin
}; 