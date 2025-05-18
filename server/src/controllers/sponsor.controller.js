const mongoose = require('mongoose');
const httpStatus = require('http-status');
const { Event, EventSponsor } = require('../models');
const asyncHandler = require('../middleware/async');
const pick = require('../utils/pick');
const { ApiError } = require('../utils/ApiError');
const { generateSponsorId } = require('../utils/sponsorIdGenerator');
const logger = require('../config/logger');

// @desc    Create a new sponsor for an event
// @route   POST /api/events/:eventId/sponsors
// @access  Private (Admin, Manager)
const createEventSponsor = asyncHandler(async (req, res) => {
  const { id: eventId } = req.params;
  const { companyName, authorizedPerson, email, contactPhone, displayPhoneNumber, sponsoringAmount, registrantAllotment, description, status } = req.body;

  logger.debug(`[createEventSponsor] Attempting to create sponsor for event ID: ${eventId}`);

  const event = await Event.findById(eventId);
  if (!event) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Event not found');
  }

  let newSponsorId;
  try {
    newSponsorId = await generateSponsorId(eventId);
  } catch (error) {
    logger.error('Error generating sponsor ID:', error);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error.message || 'Failed to generate sponsor ID');
  }

  const sponsorPayload = {
    sponsorId: newSponsorId,
    event: eventId,
    companyName,
    authorizedPerson,
    email,
    contactPhone, // This will be hashed by the pre-save hook
    displayPhoneNumber: displayPhoneNumber || null, // Save null if empty or not provided
    sponsoringAmount,
    registrantAllotment: registrantAllotment || 0,
    description,
    status: status || 'Active',
  };
  
  const newSponsor = await EventSponsor.create(sponsorPayload);
  logger.info(`Sponsor created: ${newSponsor.sponsorId} for event ${eventId}`);
  res.status(httpStatus.CREATED).send(newSponsor);
});

// @desc    Get all sponsors for an event
// @route   GET /api/events/:eventId/sponsors
// @access  Private (Admin, Manager, Staff)
const getEventSponsors = asyncHandler(async (req, res) => {
  const { id: eventId } = req.params;
  const filter = pick(req.query, ['status', 'companyName', 'email']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);

  filter.event = eventId;

  if (filter.companyName) {
    filter.companyName = { $regex: filter.companyName, $options: 'i' };
  }
  if (filter.email) {
    filter.email = { $regex: filter.email, $options: 'i' };
  }
  
  const sponsors = await EventSponsor.find(filter)
    .sort(options.sortBy ? { [options.sortBy]: options.sortOrder || 'asc' } : { createdAt: -1 })
    .skip(((options.page || 1) - 1) * (options.limit || 10))
    .limit(options.limit || 10);

  const totalResults = await EventSponsor.countDocuments(filter);

  res.send({
    results: sponsors,
    page: options.page || 1,
    limit: options.limit || 10,
    totalPages: Math.ceil(totalResults / (options.limit || 10)),
    totalResults,
  });
});

// @desc    Get a single sponsor by its MongoDB _id
// @route   GET /api/events/:eventId/sponsors/:sponsorDbId
// @access  Private (Admin, Manager, Staff)
const getEventSponsorById = asyncHandler(async (req, res) => {
  const { id: eventId, sponsorDbId } = req.params;
  
  const sponsor = await EventSponsor.findOne({ _id: sponsorDbId, event: eventId });
  if (!sponsor) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Sponsor not found');
  }
  res.send(sponsor);
});

// @desc    Update a sponsor
// @route   PUT /api/events/:eventId/sponsors/:sponsorDbId
// @access  Private (Admin, Manager)
const updateEventSponsor = asyncHandler(async (req, res) => {
  const { id: eventId, sponsorDbId } = req.params;
  const { companyName, authorizedPerson, email, contactPhone, displayPhoneNumber, sponsoringAmount, registrantAllotment, description, status } = req.body;

  const sponsor = await EventSponsor.findOne({ _id: sponsorDbId, event: eventId });

  if (!sponsor) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Sponsor not found');
  }

  // Update fields from request body
  if (companyName !== undefined) sponsor.companyName = companyName;
  if (authorizedPerson !== undefined) sponsor.authorizedPerson = authorizedPerson;
  if (email !== undefined) sponsor.email = email;
  if (displayPhoneNumber !== undefined) sponsor.displayPhoneNumber = displayPhoneNumber; // Allow setting to null/empty
  if (sponsoringAmount !== undefined) sponsor.sponsoringAmount = sponsoringAmount;
  if (registrantAllotment !== undefined) sponsor.registrantAllotment = registrantAllotment;
  if (description !== undefined) sponsor.description = description; // Allow setting to null/empty
  if (status !== undefined) sponsor.status = status;

  // Only update contactPhone (password) if a new one is provided
  if (contactPhone) {
    sponsor.contactPhone = contactPhone; // The pre-save hook will hash it
  }

  await sponsor.save();
  
  logger.info(`Sponsor updated: ${sponsor.sponsorId}`);
  res.send(sponsor);
});

// @desc    Delete a sponsor
// @route   DELETE /api/events/:eventId/sponsors/:sponsorDbId
// @access  Private (Admin, Manager)
const deleteEventSponsor = asyncHandler(async (req, res) => {
  const { id: eventId, sponsorDbId } = req.params;
  
  const sponsor = await EventSponsor.findOne({ _id: sponsorDbId, event: eventId });

  if (!sponsor) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Sponsor not found for deletion');
  }

  await sponsor.deleteOne();
  logger.info(`Sponsor deleted: ${sponsor.sponsorId}`);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createEventSponsor,
  getEventSponsors,
  getEventSponsorById,
  updateEventSponsor,
  deleteEventSponsor,
}; 