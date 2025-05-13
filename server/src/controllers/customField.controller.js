const { CustomField } = require('../models');
const { ApiError } = require('../utils/ApiError');
const httpStatus = require('http-status');
const mongoose = require('mongoose');

/**
 * Create a new custom field
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createCustomField = async (req, res) => {
  // Add the current user as the creator
  const customFieldData = {
    ...req.body,
    createdBy: req.user._id
  };
  
  const customField = await CustomField.create(customFieldData);
  res.status(httpStatus.CREATED).json(customField);
};

/**
 * Get a custom field by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getCustomFieldById = async (req, res) => {
  const customField = await CustomField.findById(req.params.id)
    .populate('categories', 'name')
    .populate('createdBy', 'name email');
  
  if (!customField) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Custom field not found');
  }
  
  res.status(httpStatus.OK).json(customField);
};

/**
 * Update a custom field
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateCustomField = async (req, res) => {
  const customField = await CustomField.findById(req.params.id);
  
  if (!customField) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Custom field not found');
  }
  
  // Ensure users cannot change the event association
  if (req.body.event) {
    delete req.body.event;
  }
  
  Object.assign(customField, req.body);
  await customField.save();
  
  res.status(httpStatus.OK).json(customField);
};

/**
 * Delete a custom field
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteCustomField = async (req, res) => {
  const customField = await CustomField.findById(req.params.id);
  
  if (!customField) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Custom field not found');
  }
  
  await customField.deleteOne();
  
  res.status(httpStatus.NO_CONTENT).send();
};

/**
 * Get custom fields by event
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getCustomFieldsByEvent = async (req, res) => {
  const { eventId } = req.params;
  const { formType, isActive } = req.query;
  
  const filter = { event: eventId };
  
  // Add optional filters if provided
  if (formType) {
    filter.formType = formType;
  }
  
  if (isActive !== undefined) {
    filter.isActive = isActive === 'true';
  }
  
  const customFields = await CustomField.find(filter)
    .sort({ order: 1 })
    .populate('categories', 'name');
  
  res.status(httpStatus.OK).json(customFields);
};

module.exports = {
  createCustomField,
  getCustomFieldById,
  updateCustomField,
  deleteCustomField,
  getCustomFieldsByEvent
}; 