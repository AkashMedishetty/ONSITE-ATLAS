const Joi = require('joi');
const { objectId } = require('./custom.validation');

const create = {
  body: Joi.object().keys({
    event: Joi.string().custom(objectId).required(),
    formType: Joi.string().valid('registration', 'abstract', 'workshop', 'category', 'travel').required(),
    name: Joi.string().required(),
    label: Joi.string().required(),
    type: Joi.string().valid('text', 'textarea', 'number', 'email', 'select', 'checkbox', 'radio', 'date', 'file').required(),
    options: Joi.when('type', {
      is: Joi.string().valid('select', 'checkbox', 'radio'),
      then: Joi.array().items(Joi.string()).min(1).required(),
      otherwise: Joi.array().items(Joi.string()).optional()
    }),
    placeholder: Joi.string().optional(),
    defaultValue: Joi.any().optional(),
    isRequired: Joi.boolean().default(false),
    validations: Joi.object({
      minLength: Joi.number().optional(),
      maxLength: Joi.number().optional(),
      pattern: Joi.string().optional(),
      min: Joi.number().optional(),
      max: Joi.number().optional(),
      fileTypes: Joi.array().items(Joi.string()).optional(),
      maxFileSize: Joi.number().optional()
    }).optional(),
    visibleTo: Joi.string().valid('all', 'admin', 'specific-categories').default('all'),
    categories: Joi.when('visibleTo', {
      is: 'specific-categories',
      then: Joi.array().items(Joi.string().custom(objectId)).min(1).required(),
      otherwise: Joi.array().items(Joi.string().custom(objectId)).optional()
    }),
    conditionalLogic: Joi.object({
      isConditional: Joi.boolean().default(false),
      dependsOn: Joi.when('isConditional', {
        is: true,
        then: Joi.string().required(),
        otherwise: Joi.string().optional()
      }),
      condition: Joi.when('isConditional', {
        is: true,
        then: Joi.string().valid('equals', 'not-equals', 'contains', 'not-contains', 'greater-than', 'less-than').required(),
        otherwise: Joi.string().optional()
      }),
      value: Joi.when('isConditional', {
        is: true,
        then: Joi.any().required(),
        otherwise: Joi.any().optional()
      })
    }).optional(),
    order: Joi.number().default(0),
    isActive: Joi.boolean().default(true)
  })
};

const update = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId).required()
  }),
  body: Joi.object().keys({
    formType: Joi.string().valid('registration', 'abstract', 'workshop', 'category', 'travel').optional(),
    name: Joi.string().optional(),
    label: Joi.string().optional(),
    type: Joi.string().valid('text', 'textarea', 'number', 'email', 'select', 'checkbox', 'radio', 'date', 'file').optional(),
    options: Joi.array().items(Joi.string()).optional(),
    placeholder: Joi.string().optional(),
    defaultValue: Joi.any().optional(),
    isRequired: Joi.boolean().optional(),
    validations: Joi.object({
      minLength: Joi.number().optional(),
      maxLength: Joi.number().optional(),
      pattern: Joi.string().optional(),
      min: Joi.number().optional(),
      max: Joi.number().optional(),
      fileTypes: Joi.array().items(Joi.string()).optional(),
      maxFileSize: Joi.number().optional()
    }).optional(),
    visibleTo: Joi.string().valid('all', 'admin', 'specific-categories').optional(),
    categories: Joi.array().items(Joi.string().custom(objectId)).optional(),
    conditionalLogic: Joi.object({
      isConditional: Joi.boolean().optional(),
      dependsOn: Joi.string().optional(),
      condition: Joi.string().valid('equals', 'not-equals', 'contains', 'not-contains', 'greater-than', 'less-than').optional(),
      value: Joi.any().optional()
    }).optional(),
    order: Joi.number().optional(),
    isActive: Joi.boolean().optional()
  })
    .min(1) // At least one field must be updated
};

const getById = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId).required()
  })
};

const deleteCustomField = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId).required()
  })
};

const getByEvent = {
  params: Joi.object().keys({
    eventId: Joi.string().custom(objectId).required()
  }),
  query: Joi.object().keys({
    formType: Joi.string().valid('registration', 'abstract', 'workshop', 'category', 'travel').optional(),
    isActive: Joi.boolean().optional()
  }).optional()
};

module.exports = {
  create,
  update,
  getById,
  deleteCustomField,
  getByEvent
}; 