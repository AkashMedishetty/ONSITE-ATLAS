const Joi = require('joi');
const mongoose = require('mongoose');

/**
 * Custom validation helpers for Joi schemas
 */

// MongoDB ObjectId validation
const objectId = (value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.error('any.invalid');
  }
  return value;
};

// Date validation that ensures date is in ISO format
const isoDate = (value, helpers) => {
  try {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return helpers.error('date.invalid');
    }
    return value;
  } catch (error) {
    return helpers.error('date.invalid');
  }
};

// Email validation with TLD check
const email = (value, helpers) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value)) {
    return helpers.error('string.email');
  }
  return value;
};

// Phone number validation
const phoneNumber = (value, helpers) => {
  const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
  if (!phoneRegex.test(value)) {
    return helpers.error('string.phone');
  }
  return value;
};

// URL validation
const url = (value, helpers) => {
  try {
    new URL(value);
    return value;
  } catch (error) {
    return helpers.error('string.uri');
  }
};

// Word count validation
const wordCount = (maxWords) => (value, helpers) => {
  if (!value) return value;
  
  const count = value.trim().split(/\s+/).length;
  if (count > maxWords) {
    return helpers.error('string.maxWords', { maxWords, count });
  }
  return value;
};

// Custom Joi messages
const customMessages = {
  'any.required': '{{#label}} is required',
  'string.empty': '{{#label}} cannot be empty',
  'string.min': '{{#label}} must be at least {{#limit}} characters',
  'string.max': '{{#label}} must be at most {{#limit}} characters',
  'number.base': '{{#label}} must be a number',
  'number.min': '{{#label}} must be at least {{#limit}}',
  'number.max': '{{#label}} must be at most {{#limit}}',
  'date.base': '{{#label}} must be a valid date',
  'date.min': '{{#label}} must be later than {{#limit}}',
  'date.max': '{{#label}} must be earlier than {{#limit}}',
  'array.min': '{{#label}} must contain at least {{#limit}} items',
  'array.max': '{{#label}} must contain at most {{#limit}} items',
  'object.base': '{{#label}} must be an object',
  'any.invalid': '{{#label}} is not valid',
  'string.email': '{{#label}} must be a valid email address',
  'string.uri': '{{#label}} must be a valid URL',
  'string.phone': '{{#label}} must be a valid phone number',
  'string.maxWords': '{{#label}} exceeds maximum word count of {{#maxWords}} (current: {{#count}})'
};

// Export custom validators and messages
module.exports = {
  objectId,
  isoDate,
  email,
  phoneNumber,
  url,
  wordCount,
  customMessages
}; 