const asyncHandler = require('../middleware/async');
const ApiError = require('../utils/ApiError');
const httpStatus = require('http-status');

// @desc    Get dashboard data for the currently logged-in sponsor
// @route   GET /api/sponsor-portal-auth/me/dashboard
// @access  Private (Sponsor)
const getSponsorDashboard = asyncHandler(async (req, res) => {
  const sponsor = await require('../models').EventSponsor.findById(req.user.id);
  if (!sponsor) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Sponsor profile not found.');
  }
  // Count sponsored registrants
  const registrantCount = await require('../models').Registration.countDocuments({
    event: sponsor.event,
    sponsoredBy: sponsor._id,
  });
  res.status(200).json({
    success: true,
    data: {
      id: sponsor._id,
      sponsorId: sponsor.sponsorId,
      companyName: sponsor.companyName,
      authorizedPerson: sponsor.authorizedPerson,
      email: sponsor.email,
      displayPhoneNumber: sponsor.displayPhoneNumber,
      sponsoringAmount: sponsor.sponsoringAmount,
      registrantAllotment: sponsor.registrantAllotment,
      description: sponsor.description,
      status: sponsor.status,
      event: sponsor.event,
      registrantCount,
    },
  });
});

// @desc    Get all sponsored registrants for the logged-in sponsor (export/import compatible)
// @route   GET /api/sponsor-portal-auth/me/registrants
// @access  Private (Sponsor)
const getSponsorPortalRegistrants = asyncHandler(async (req, res) => {
  const sponsor = await require('../models').EventSponsor.findById(req.user.id);
  if (!sponsor) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Sponsor profile not found.');
  }
  const registrants = await require('../models').Registration.find({
    event: sponsor.event,
    sponsoredBy: sponsor._id,
  }).lean();
  res.status(200).json({
    success: true,
    count: registrants.length,
    data: registrants,
  });
});

// @desc    Add a new sponsored registrant (enforce allotment)
// @route   POST /api/sponsor-portal-auth/me/registrants
// @access  Private (Sponsor)
const addSponsorPortalRegistrant = asyncHandler(async (req, res) => {
  const sponsor = await require('../models').EventSponsor.findById(req.user.id);
  if (!sponsor) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Sponsor profile not found.');
  }
  const Registration = require('../models').Registration;
  const Event = require('../models').Event;
  const Category = require('../models').Category;
  const { getNextSequenceValue } = require('../utils/counterUtils');

  // Enforce sponsor allotment
  const currentCount = await Registration.countDocuments({
    event: sponsor.event,
    sponsoredBy: sponsor._id,
  });
  if (currentCount >= sponsor.registrantAllotment) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Registrant allotment exceeded.');
  }

  // Validate required fields
  const eventId = sponsor.event;
  const { category: categoryId, personalInfo, professionalInfo, customFields } = req.body;
  if (!eventId || !categoryId || !personalInfo) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Missing required fields: event, category, personalInfo');
  }

  // Check if event exists
  const event = await Event.findById(eventId);
  if (!event) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Event not found');
  }

  // Check if category exists
  const category = await Category.findById(categoryId);
  if (!category) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Category not found');
  }

  // Generate registrationId using event settings
  const registrationPrefix = event.registrationSettings?.idPrefix || 'REG';
  const startNumber = event.registrationSettings?.startNumber || 1;
  const sequenceName = `${eventId}_registration_id`;
  let registrationId;
  try {
    const nextNumber = await getNextSequenceValue(sequenceName, startNumber);
    const formattedNumber = nextNumber.toString().padStart(4, '0');
    registrationId = `${registrationPrefix}-${formattedNumber}`;
    // Double-check uniqueness
    const existing = await Registration.findOne({ event: eventId, registrationId });
    if (existing) {
      throw new ApiError(httpStatus.CONFLICT, 'Failed to generate unique registration ID. Please try again.');
    }
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to generate registration ID');
  }

  // Create registration
  let registration;
  try {
    console.log('[SponsorPortal] Add Registrant req.body:', req.body);
    console.log('[SponsorPortal] Required fields: eventId', sponsor.event, 'category', req.body.category, 'personalInfo', req.body.personalInfo);
    registration = await Registration.create({
      registrationId,
      event: eventId,
      category: categoryId,
      personalInfo,
      ...(professionalInfo && { professionalInfo }),
      ...(customFields && { customFields }),
      status: 'active',
      registrationType: 'sponsored',
      sponsoredBy: sponsor._id,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  } catch (err) {
    if (err.code === 11000) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'A registration with this name already exists in this category for this event.');
    }
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to create registration');
  }

  // Return created registration with populated references
  const populatedRegistration = await Registration.findById(registration._id)
    .populate('event', 'name startDate endDate logo')
    .populate('category', 'name color permissions');

  res.status(201).json({ success: true, data: populatedRegistration });
});

// @desc    Edit a sponsored registrant (only if owned by sponsor)
// @route   PUT /api/sponsor-portal-auth/me/registrants/:id
// @access  Private (Sponsor)
const editSponsorPortalRegistrant = asyncHandler(async (req, res) => {
  const sponsor = await require('../models').EventSponsor.findById(req.user.id);
  if (!sponsor) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Sponsor profile not found.');
  }
  const Registration = require('../models').Registration;
  const reg = await Registration.findOne({
    _id: req.params.id,
    event: sponsor.event,
    sponsoredBy: sponsor._id,
  });
  if (!reg) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Registrant not found or not owned by sponsor.');
  }
  console.log('[SponsorPortal] Edit Registrant req.body:', req.body);
  console.log('[SponsorPortal] Edit Registrant params.id:', req.params.id);
  Object.assign(reg, req.body);
  await reg.save();
  res.status(200).json({ success: true, data: reg });
});

// @desc    Delete a sponsored registrant (only if owned by sponsor)
// @route   DELETE /api/sponsor-portal-auth/me/registrants/:id
// @access  Private (Sponsor)
const deleteSponsorPortalRegistrant = asyncHandler(async (req, res) => {
  const sponsor = await require('../models').EventSponsor.findById(req.user.id);
  if (!sponsor) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Sponsor profile not found.');
  }
  const Registration = require('../models').Registration;
  const reg = await Registration.findOneAndDelete({
    _id: req.params.id,
    event: sponsor.event,
    sponsoredBy: sponsor._id,
  });
  if (!reg) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Registrant not found or not owned by sponsor.');
  }
  res.status(200).json({ success: true, message: 'Registrant deleted.' });
});

// @desc    Bulk import sponsored registrants (Excel/CSV, enforce allotment)
// @route   POST /api/sponsor-portal-auth/me/registrants/bulk-import
// @access  Private (Sponsor)
const bulkImportSponsorPortalRegistrants = asyncHandler(async (req, res) => {
  const sponsor = await require('../models').EventSponsor.findById(req.user.id);
  if (!sponsor) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Sponsor profile not found.');
  }
  const Registration = require('../models').Registration;
  const Event = require('../models').Event;
  const Category = require('../models').Category;
  const { getNextSequenceValue } = require('../utils/counterUtils');
  // Assume req.body.registrants is an array of registrant objects (already parsed from Excel/CSV)
  const registrants = req.body.registrants;
  if (!Array.isArray(registrants) || registrants.length === 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No registrants provided for import.');
  }
  const currentCount = await Registration.countDocuments({
    event: sponsor.event,
    sponsoredBy: sponsor._id,
  });
  if (currentCount + registrants.length > sponsor.registrantAllotment) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Registrant allotment exceeded.');
  }
  // Fetch event for registrationId settings
  const event = await Event.findById(sponsor.event);
  if (!event) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Event not found');
  }
  const registrationPrefix = event.registrationSettings?.idPrefix || 'REG';
  const startNumber = event.registrationSettings?.startNumber || 1;
  const sequenceName = `${sponsor.event}_registration_id`;

  // Prepare registrant docs with registrationId auto-generation
  const docs = [];
  for (const reg of registrants) {
    // Validate required fields
    if (!reg.category || !reg.personalInfo) {
      continue; // skip invalid rows
    }
    // Check if category exists
    const category = await Category.findById(reg.category);
    if (!category) {
      continue; // skip invalid category
    }
    // Generate registrationId if not provided
    let registrationId = reg.registrationId;
    if (!registrationId) {
      let unique = false;
      let attempts = 0;
      while (!unique && attempts < 5) {
        const nextNumber = await getNextSequenceValue(sequenceName, startNumber);
        const formattedNumber = nextNumber.toString().padStart(4, '0');
        registrationId = `${registrationPrefix}-${formattedNumber}`;
        // Double-check uniqueness
        const existing = await Registration.findOne({ event: sponsor.event, registrationId });
        if (!existing) unique = true;
        else attempts++;
      }
      if (!unique) {
        throw new ApiError(httpStatus.CONFLICT, 'Failed to generate unique registration ID. Please try again.');
      }
    }
    docs.push({
      ...reg,
      registrationId,
      event: sponsor.event,
      sponsoredBy: sponsor._id,
      registrationType: 'sponsored',
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }
  if (docs.length === 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No valid registrants to import.');
  }
  console.log('[SponsorPortal] Bulk Import req.body:', req.body);
  console.log('[SponsorPortal] Bulk Import sponsor.event:', sponsor.event);
  const created = await Registration.insertMany(docs);
  res.status(201).json({ success: true, count: created.length, data: created });
});

// @desc    Export sponsored registrants as Excel (admin format)
// @route   GET /api/sponsor-portal-auth/me/registrants/export
// @access  Private (Sponsor)
const exportSponsorPortalRegistrants = asyncHandler(async (req, res) => {
  const sponsor = await require('../models').EventSponsor.findById(req.user.id);
  if (!sponsor) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Sponsor profile not found.');
  }
  const Registration = require('../models').Registration;
  const Category = require('../models').Category;
  const Event = require('../models').Event;
  const CustomField = require('../models').CustomField;

  // Fetch all categories for this event
  const categories = await Category.find({ event: sponsor.event }).lean();
  const categoryMap = {};
  categories.forEach(cat => { categoryMap[cat._id.toString()] = cat.name; });

  // Fetch event for custom field labels
  const event = await Event.findById(sponsor.event).lean();
  let customFieldDefs = [];
  if (event?.registrationSettings?.customFields?.length) {
    customFieldDefs = event.registrationSettings.customFields;
  } else {
    // fallback: fetch from CustomField model
    customFieldDefs = await CustomField.find({ event: sponsor.event, formType: 'registration', isActive: true }).lean();
  }
  // Map: key = name, value = label
  const customFieldLabelMap = {};
  customFieldDefs.forEach(f => { customFieldLabelMap[f.name] = f.label || f.name; });

  const registrants = await Registration.find({
    event: sponsor.event,
    sponsoredBy: sponsor._id,
  }).lean();

  // Helper to flatten each registrant
  function flattenRegistrant(reg) {
    const pi = reg.personalInfo || {};
    const pro = reg.professionalInfo || {};
    const cf = reg.customFields || {};
    return {
      RegistrationID: reg.registrationId || '',
      FirstName: pi.firstName || '',
      LastName: pi.lastName || '',
      Email: pi.email || '',
      Phone: pi.phone || '',
      Organization: pi.organization || '',
      Designation: pi.designation || '',
      Country: pi.country || '',
      Address: pi.address || '',
      City: pi.city || '',
      State: pi.state || '',
      PostalCode: pi.postalCode || '',
      MCINumber: pro.mciNumber || '',
      Membership: pro.membership || '',
      Category: reg.category ? (categoryMap[reg.category.toString()] || reg.category.toString()) : '',
      Status: reg.status || '',
      CreatedAt: reg.createdAt ? new Date(reg.createdAt).toLocaleString() : '',
      ...Object.fromEntries(
        Object.entries(cf).map(([k, v]) => [customFieldLabelMap[k] || k, v])
      )
    };
  }

  const flat = registrants.map(flattenRegistrant);
  const json2xls = require('json2xls');
  const xls = json2xls(flat);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="sponsored_registrants_${sponsor.sponsorId}.xlsx"`);
  res.end(xls, 'binary');
});

// @desc    Get all categories for the sponsor's event
// @route   GET /api/sponsor-portal-auth/me/categories
// @access  Private (Sponsor)
const getSponsorCategories = asyncHandler(async (req, res) => {
  const sponsor = await require('../models').EventSponsor.findById(req.user.id);
  if (!sponsor) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Sponsor profile not found.');
  }
  const Event = require('../models').Event;
  const Category = require('../models').Category;
  const eventId = sponsor.event;
  // Check if event exists
  const event = await Event.findById(eventId);
  if (!event) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Event not found');
  }
  // Debug log for eventId comparison
  console.log('[SponsorCategories] req.user.eventId:', req.user.eventId, typeof req.user.eventId);
  console.log('[SponsorCategories] sponsor.event:', eventId, typeof eventId);
  // Only allow the sponsor to access their event's categories
  if (req.user.type !== 'sponsor' || req.user.eventId.toString() !== eventId.toString()) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Not authorized to access this event');
  }
  const categories = await Category.find({ event: eventId });
  res.status(200).json({ success: true, data: categories });
});

module.exports.getSponsorDashboard = getSponsorDashboard;
module.exports.getSponsorPortalRegistrants = getSponsorPortalRegistrants;
module.exports.addSponsorPortalRegistrant = addSponsorPortalRegistrant;
module.exports.editSponsorPortalRegistrant = editSponsorPortalRegistrant;
module.exports.deleteSponsorPortalRegistrant = deleteSponsorPortalRegistrant;
module.exports.bulkImportSponsorPortalRegistrants = bulkImportSponsorPortalRegistrants;
module.exports.exportSponsorPortalRegistrants = exportSponsorPortalRegistrants;
module.exports.getSponsorCategories = getSponsorCategories; 