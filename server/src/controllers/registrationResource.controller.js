const mongoose = require('mongoose');
const Resource = require('../models/Resource');
const Registration = require('../models/Registration');
const Event = require('../models/Event');
const ResourceSetting = require('../models/ResourceSetting');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const emailService = require('../services/emailService');

/**
 * @desc    Get resources for a specific registration
 * @route   GET /api/events/:eventId/registrations/:registrationId/resources
 * @access  Private
 */
exports.getRegistrationResources = asyncHandler(async (req, res, next) => {
  const { eventId, registrationId } = req.params;
  const { type } = req.query;
  
  // Find the registration to ensure it exists
  const registration = await Registration.findOne({ 
    _id: registrationId,
    event: eventId 
  });
  
  if (!registration) {
    return next(new ErrorResponse('Registration not found', 404));
  }
  
  // Build query object
  const query = {
    event: eventId,
    registration: registrationId,
    status: { $ne: 'voided' },
    isVoided: { $ne: true }
  };
  
  // Filter by resource type if provided
  if (type && ['food', 'kitBag', 'certificate'].includes(type)) {
    query.type = type;
  }
  
  // Find resources
  const resources = await Resource.find(query)
    .sort({ createdAt: -1 })
    .populate('createdBy', 'name')
    .populate('updatedBy', 'name')
    .populate('actionBy', 'name');
  
  // Prepare response data with formatted resources
  const formattedResources = resources.map(resource => {
    const { _id, type, status, details, createdAt, updatedAt, actionDate } = resource;
    
    // Format based on resource type
    let resourceName = '';
    let description = '';
    
    if (type === 'food' && details.meal) {
      resourceName = details.meal;
      description = `Day ${details.day || '1'} - ${details.mealTime || ''}`;
    } else if (type === 'kitBag' && details.item) {
      resourceName = details.item;
      description = details.description || '';
    } else if (type === 'certificate' && details.template) {
      resourceName = details.template;
      description = details.description || '';
    }
    
    return {
      _id,
      type,
      name: resourceName,
      description,
      status,
      isUsed: status === 'used',
      date: actionDate || createdAt,
      usageTime: actionDate,
      createdAt,
      updatedAt,
      issuedBy: resource.createdBy?.name || 'System',
      actionBy: resource.actionBy?.name || ''
    };
  });
  
  res.status(200).json({
    success: true,
    count: formattedResources.length,
    data: formattedResources
  });
});

/**
 * @desc    Update resource usage status
 * @route   PATCH /api/events/:eventId/registrations/:registrationId/resources/:resourceId
 * @access  Private
 */
exports.updateResourceUsage = asyncHandler(async (req, res, next) => {
  const { eventId, registrationId, resourceId } = req.params;
  const { isUsed } = req.body;
  
  if (isUsed === undefined) {
    return next(new ErrorResponse('isUsed field is required', 400));
  }
  
  // Find the resource
  const resource = await Resource.findOne({
    _id: resourceId,
    event: eventId,
    registration: registrationId,
    status: { $ne: 'voided' },
    isVoided: { $ne: true }
  });
  
  if (!resource) {
    return next(new ErrorResponse('Resource not found or already voided', 404));
  }
  
  // Update resource status based on isUsed flag
  resource.status = isUsed ? 'used' : 'assigned';
  
  // If marked as used, record action date and user
  if (isUsed && resource.status !== 'used') {
    resource.actionDate = new Date();
    resource.actionBy = req.user._id;
  } else if (!isUsed && resource.status === 'used') {
    // If marked as unused, clear action information
    resource.actionDate = null;
    resource.actionBy = null;
  }
  
  resource.updatedBy = req.user._id;
  await resource.save();
  
  // Record activity for audit trail
  const registration = await Registration.findById(registrationId);
  if (registration) {
    const activities = registration.activities || [];
    activities.push({
      action: isUsed ? 'Resource Used' : 'Resource Unused',
      description: `${resource.type} resource "${resource.details.meal || resource.details.item || resource.details.template || 'Unknown'}" marked as ${isUsed ? 'used' : 'unused'}`,
      user: req.user.name,
      timestamp: new Date()
    });
    
    registration.activities = activities;
    await registration.save();
  }
  
  res.status(200).json({
    success: true,
    message: `Resource ${isUsed ? 'marked as used' : 'marked as unused'} successfully`,
    data: {
      _id: resource._id,
      status: resource.status,
      isUsed: resource.status === 'used',
      actionDate: resource.actionDate
    }
  });
});

/**
 * @desc    Send certificate to a specific registrant
 * @route   POST /api/events/:eventId/registrations/:registrationId/send-certificate
 * @access  Private
 */
exports.sendCertificate = asyncHandler(async (req, res, next) => {
  const { eventId, registrationId } = req.params;
  const { certificateType, includeQR = true } = req.body;
  
  // Validate certificate type
  if (!certificateType) {
    return next(new ErrorResponse('Certificate type is required', 400));
  }
  
  // Find the registration
  const registration = await Registration.findOne({ 
    _id: registrationId,
    event: eventId 
  }).populate('category');
  
  if (!registration) {
    return next(new ErrorResponse('Registration not found', 404));
  }
  
  // Check if email is available
  const email = registration.personalInfo?.email;
  if (!email) {
    return next(new ErrorResponse('Registrant has no email address', 400));
  }
  
  // Get event details for certificate
  const event = await Event.findById(eventId);
  if (!event) {
    return next(new ErrorResponse('Event not found', 404));
  }
  
  // Get certificate settings
  const certificateSettings = await ResourceSetting.findOne({
    event: eventId,
    type: 'certificate'
  });
  
  if (!certificateSettings || !certificateSettings.isEnabled) {
    return next(new ErrorResponse('Certificate feature is not enabled for this event', 400));
  }
  
  // Check if the category has permission for certificates
  if (registration.category && 
      registration.category.permissions && 
      registration.category.permissions.certificates === false) {
    return next(new ErrorResponse('This registration category does not have permission for certificates', 403));
  }
  
  // Validate certificate type is available in settings
  const availableTemplates = certificateSettings.settings?.templates || [];
  const templateExists = availableTemplates.some(t => t.name === certificateType);
  
  if (!templateExists) {
    return next(new ErrorResponse(`Certificate type "${certificateType}" is not available`, 400));
  }
  
  try {
    // Send certificate email
    await emailService.sendCertificateEmail({
      event,
      registration,
      certificateType,
      includeQR
    });
    
    // Create or update resource record
    let certificateResource = await Resource.findOne({
      event: eventId,
      registration: registrationId,
      type: 'certificate',
      'details.template': certificateType
    });
    
    if (!certificateResource) {
      // Create new resource record
      certificateResource = await Resource.create({
        event: eventId,
        registration: registrationId,
        type: 'certificate',
        status: 'used',
        details: {
          template: certificateType,
          description: `Certificate of ${certificateType}`,
          sentViaEmail: true
        },
        actionDate: new Date(),
        actionBy: req.user._id,
        createdBy: req.user._id,
        updatedBy: req.user._id
      });
    } else {
      // Update existing resource
      certificateResource.status = 'used';
      certificateResource.actionDate = new Date();
      certificateResource.actionBy = req.user._id;
      certificateResource.updatedBy = req.user._id;
      certificateResource.details = {
        ...certificateResource.details,
        sentViaEmail: true,
        lastSent: new Date()
      };
      await certificateResource.save();
    }
    
    // Record activity
    const activities = registration.activities || [];
    activities.push({
      action: 'Certificate Sent',
      description: `${certificateType} certificate sent via email`,
      user: req.user.name,
      timestamp: new Date()
    });
    
    registration.activities = activities;
    await registration.save();
    
    res.status(200).json({
      success: true,
      message: `Certificate sent to ${email} successfully`,
      data: {
        resourceId: certificateResource._id,
        certificateType,
        sentTo: email,
        sentAt: new Date()
      }
    });
  } catch (error) {
    console.error('Certificate email error:', error);
    return next(new ErrorResponse(`Failed to send certificate: ${error.message}`, 500));
  }
});

/**
 * @desc    Get resource usage statistics for a registration
 * @route   GET /api/events/:eventId/registrations/:registrationId/resource-stats
 * @access  Private
 */
exports.getResourceStats = asyncHandler(async (req, res, next) => {
  const { eventId, registrationId } = req.params;
  
  // Find the registration
  const registration = await Registration.findOne({ 
    _id: registrationId,
    event: eventId 
  });
  
  if (!registration) {
    return next(new ErrorResponse('Registration not found', 404));
  }
  
  // Get resource counts by type and status
  const resourceStats = await Resource.aggregate([
    {
      $match: {
        event: mongoose.Types.ObjectId(eventId),
        registration: mongoose.Types.ObjectId(registrationId)
      }
    },
    {
      $group: {
        _id: {
          type: '$type',
          status: '$status'
        },
        count: { $sum: 1 }
      }
    }
  ]);
  
  // Format the statistics
  const stats = {
    food: {
      total: 0,
      used: 0,
      unused: 0
    },
    kitBag: {
      total: 0,
      used: 0,
      unused: 0
    },
    certificate: {
      total: 0,
      used: 0,
      unused: 0
    }
  };
  
  resourceStats.forEach(stat => {
    const { type, status } = stat._id;
    const count = stat.count;
    
    // Increment total count
    stats[type].total += count;
    
    // Increment used/unused count based on status
    if (status === 'used') {
      stats[type].used += count;
    } else {
      stats[type].unused += count;
    }
  });
  
  res.status(200).json({
    success: true,
    data: stats
  });
}); 