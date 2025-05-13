const Joi = require('joi');

// Login validation (Corrected for registrationId, mobileNumber, eventId)
exports.login = Joi.object({
  registrationId: Joi.string().required().messages({
    'string.base': 'Registration ID must be a string',
    'any.required': 'Registration ID is required'
  }),
  mobileNumber: Joi.string().required().messages({
    'string.base': 'Mobile number must be a string',
    'any.required': 'Mobile number is required'
  }),
  eventId: Joi.string().required().messages({ // Add eventId validation
    'string.base': 'Event ID must be a string',
    'any.required': 'Event context is missing. Please log in via the correct event portal.'
  })
});

// Register validation
exports.register = Joi.object({
  registrationId: Joi.string().required().messages({
    'any.required': 'Registration ID is required'
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Password must be at least 6 characters',
    'any.required': 'Password is required'
  })
});

// Forgot password validation
exports.forgotPassword = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  })
});

// Reset password validation
exports.resetPassword = Joi.object({
  token: Joi.string().required().messages({
    'any.required': 'Token is required'
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Password must be at least 6 characters',
    'any.required': 'Password is required'
  })
});

// Verify account validation
exports.verify = Joi.object({
  token: Joi.string().required().messages({
    'any.required': 'Token is required'
  })
});

// Update profile validation
exports.updateProfile = Joi.object({
  firstName: Joi.string().messages({
    'string.base': 'First name must be a string'
  }),
  lastName: Joi.string().messages({
    'string.base': 'Last name must be a string'
  }),
  phone: Joi.string().messages({
    'string.base': 'Phone must be a string'
  }),
  organization: Joi.string().messages({
    'string.base': 'Organization must be a string'
  }),
  jobTitle: Joi.string().messages({
    'string.base': 'Job title must be a string'
  }),
  customFields: Joi.object().pattern(
    Joi.string(),
    Joi.alternatives().try(
      Joi.string(),
      Joi.number(),
      Joi.boolean(),
      Joi.array().items(Joi.string())
    )
  ).messages({
    'object.base': 'Custom fields must be an object'
  })
});

// Submit abstract validation
exports.submitAbstract = Joi.object({
  title: Joi.string().required().messages({
    'any.required': 'Abstract title is required'
  }),
  content: Joi.string().required().messages({
    'any.required': 'Abstract content is required'
  }),
  category: Joi.string().messages({
    'string.base': 'Category must be a string'
  }),
  authors: Joi.array().items(Joi.string()).messages({
    'array.base': 'Authors must be an array'
  }),
  keywords: Joi.array().items(Joi.string()).messages({
    'array.base': 'Keywords must be an array'
  }),
  additionalAuthors: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      email: Joi.string().email(),
      organization: Joi.string(),
      isPrimaryContact: Joi.boolean()
    })
  ).messages({
    'array.base': 'Additional authors must be an array'
  }),
  customFields: Joi.object().pattern(
    Joi.string(),
    Joi.alternatives().try(
      Joi.string(),
      Joi.number(),
      Joi.boolean(),
      Joi.array().items(Joi.string())
    )
  ).messages({
    'object.base': 'Custom fields must be an object'
  })
});

// Update abstract validation
exports.updateAbstract = Joi.object({
  title: Joi.string().messages({
    'string.base': 'Title must be a string'
  }),
  content: Joi.string().messages({
    'string.base': 'Content must be a string'
  }),
  category: Joi.string().messages({
    'string.base': 'Category must be a string'
  }),
  authors: Joi.array().items(Joi.string()).messages({
    'array.base': 'Authors must be an array'
  }),
  keywords: Joi.array().items(Joi.string()).messages({
    'array.base': 'Keywords must be an array'
  }),
  additionalAuthors: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      email: Joi.string().email(),
      organization: Joi.string(),
      isPrimaryContact: Joi.boolean()
    })
  ).messages({
    'array.base': 'Additional authors must be an array'
  }),
  customFields: Joi.object().pattern(
    Joi.string(),
    Joi.alternatives().try(
      Joi.string(),
      Joi.number(),
      Joi.boolean(),
      Joi.array().items(Joi.string())
    )
  ).messages({
    'object.base': 'Custom fields must be an object'
  })
}); 