const mongoose = require('mongoose');

const objectId = (value, helpers) => {
  if (!value) {
    return value;
  }
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.error('any.invalid');
  }
  return value;
};

const password = (value, helpers) => {
  if (!value.match(/\d/) || !value.match(/[a-zA-Z]/)) {
    return helpers.error('password.format');
  }
  return value;
};

const validateEmail = (value, helpers) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value)) {
    return helpers.error('email.format');
  }
  return value;
};

const validatePhoneNumber = (value, helpers) => {
  // Basic phone validation - could be enhanced based on requirements
  const phoneRegex = /^\+?[\d\s()-]{8,}$/;
  if (!phoneRegex.test(value)) {
    return helpers.error('phone.format');
  }
  return value;
};

const validateDate = (value, helpers) => {
  // Check if it's a valid date
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    return helpers.error('date.format');
  }
  return value;
};

module.exports = {
  objectId,
  password,
  validateEmail,
  validatePhoneNumber,
  validateDate,
}; 