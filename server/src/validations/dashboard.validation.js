const Joi = require('joi');
const { objectId } = require('./custom.validation');

const getDashboard = {
  params: Joi.object().keys({
    eventId: Joi.string().required().custom(objectId)
  }),
  query: Joi.object().keys({
    role: Joi.string().optional()
  })
};

const updateDashboardLayout = {
  params: Joi.object().keys({
    eventId: Joi.string().required().custom(objectId)
  }),
  body: Joi.object().keys({
    layout: Joi.array().items(
      Joi.object().keys({
        i: Joi.string().required(),
        x: Joi.number().required(),
        y: Joi.number().required(),
        w: Joi.number().required(),
        h: Joi.number().required(),
        minW: Joi.number().optional(),
        maxW: Joi.number().optional(),
        minH: Joi.number().optional(),
        maxH: Joi.number().optional(),
        static: Joi.boolean().optional()
      })
    ).required()
  })
};

const getDashboardWidgets = {
  params: Joi.object().keys({
    eventId: Joi.string().required().custom(objectId)
  }),
  query: Joi.object().keys({
    role: Joi.string().optional(),
    category: Joi.string().optional()
  })
};

const getWidgetData = {
  params: Joi.object().keys({
    eventId: Joi.string().required().custom(objectId),
    widgetId: Joi.string().required()
  }),
  query: Joi.object().keys({
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().optional(),
    range: Joi.string().valid('day', 'week', 'month', 'year', 'custom').optional()
  })
};

module.exports = {
  getDashboard,
  updateDashboardLayout,
  getDashboardWidgets,
  getWidgetData
}; 