const Joi = require('joi');
const { objectId } = require('./custom.validation');

const createReport = {
  params: Joi.object().keys({
    eventId: Joi.string().required().custom(objectId),
  }),
  body: Joi.object().keys({
    name: Joi.string().required(),
    description: Joi.string().optional(),
    type: Joi.string().required().valid('registration', 'financial', 'workshop', 'abstract', 'sponsor', 'custom'),
    config: Joi.object().keys({
      fields: Joi.array().items(Joi.string()).required(),
      filters: Joi.object().optional(),
      sorting: Joi.object().keys({
        field: Joi.string().required(),
        order: Joi.string().valid('asc', 'desc').required()
      }).optional(),
      groupBy: Joi.string().optional(),
      limit: Joi.number().integer().min(1).optional()
    }).required(),
    schedule: Joi.object().keys({
      frequency: Joi.string().valid('daily', 'weekly', 'monthly', 'quarterly').optional(),
      time: Joi.string().optional(),
      dayOfWeek: Joi.number().min(0).max(6).optional(),
      dayOfMonth: Joi.number().min(1).max(31).optional(),
      recipients: Joi.array().items(Joi.string().email()).optional()
    }).optional()
  }),
};

const getReportById = {
  params: Joi.object().keys({
    eventId: Joi.string().required().custom(objectId),
    reportId: Joi.string().required().custom(objectId),
  }),
};

const updateReport = {
  params: Joi.object().keys({
    eventId: Joi.string().required().custom(objectId),
    reportId: Joi.string().required().custom(objectId),
  }),
  body: Joi.object().keys({
    name: Joi.string().optional(),
    description: Joi.string().optional(),
    type: Joi.string().valid('registration', 'financial', 'workshop', 'abstract', 'sponsor', 'custom').optional(),
    config: Joi.object().keys({
      fields: Joi.array().items(Joi.string()).optional(),
      filters: Joi.object().optional(),
      sorting: Joi.object().keys({
        field: Joi.string().required(),
        order: Joi.string().valid('asc', 'desc').required()
      }).optional(),
      groupBy: Joi.string().optional(),
      limit: Joi.number().integer().min(1).optional()
    }).optional(),
    schedule: Joi.object().keys({
      frequency: Joi.string().valid('daily', 'weekly', 'monthly', 'quarterly').optional(),
      time: Joi.string().optional(),
      dayOfWeek: Joi.number().min(0).max(6).optional(),
      dayOfMonth: Joi.number().min(1).max(31).optional(),
      recipients: Joi.array().items(Joi.string().email()).optional()
    }).optional()
  }).min(1),
};

const deleteReport = {
  params: Joi.object().keys({
    eventId: Joi.string().required().custom(objectId),
    reportId: Joi.string().required().custom(objectId),
  }),
};

const getReports = {
  params: Joi.object().keys({
    eventId: Joi.string().required().custom(objectId),
  }),
  query: Joi.object().keys({
    type: Joi.string().valid('registration', 'financial', 'workshop', 'abstract', 'sponsor', 'custom').optional(),
    limit: Joi.number().integer().min(1).optional(),
    page: Joi.number().integer().min(1).optional(),
    sortBy: Joi.string().optional(),
    sortOrder: Joi.string().valid('asc', 'desc').optional(),
  }),
};

const generateReport = {
  params: Joi.object().keys({
    eventId: Joi.string().required().custom(objectId),
    reportId: Joi.string().required().custom(objectId),
  }),
  query: Joi.object().keys({
    format: Joi.string().valid('csv', 'excel', 'pdf').default('excel'),
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().optional(),
  }),
};

const scheduleReport = {
  params: Joi.object().keys({
    eventId: Joi.string().required().custom(objectId),
    reportId: Joi.string().required().custom(objectId),
  }),
  body: Joi.object().keys({
    frequency: Joi.string().valid('daily', 'weekly', 'monthly').required(),
    recipients: Joi.array().items(Joi.string().email()).required(),
    startDate: Joi.date().iso().optional(),
  }),
};

const exportReport = {
  params: Joi.object().keys({
    eventId: Joi.string().required().custom(objectId),
    reportId: Joi.string().required().custom(objectId),
  }),
  query: Joi.object().keys({
    format: Joi.string().valid('csv', 'excel', 'pdf').default('excel'),
  }),
};

module.exports = {
  createReport,
  getReportById,
  updateReport,
  deleteReport,
  getReports,
  generateReport,
  scheduleReport,
  exportReport,
}; 