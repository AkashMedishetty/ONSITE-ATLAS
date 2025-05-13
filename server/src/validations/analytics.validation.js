const Joi = require('joi');
const { objectId } = require('./custom.validation');

const getRegistrationAnalytics = {
  params: Joi.object().keys({
    eventId: Joi.string().required().custom(objectId),
  }),
  query: Joi.object().keys({
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().optional(),
    range: Joi.string().valid('day', 'week', 'month', 'year', 'custom').optional(),
    category: Joi.string().optional(),
    status: Joi.string().valid('complete', 'pending', 'cancelled').optional(),
  }),
};

const getFinancialAnalytics = {
  params: Joi.object().keys({
    eventId: Joi.string().required().custom(objectId),
  }),
  query: Joi.object().keys({
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().optional(),
    range: Joi.string().valid('day', 'week', 'month', 'year', 'custom').optional(),
    paymentMethod: Joi.string().optional(),
    status: Joi.string().valid('paid', 'pending', 'refunded').optional(),
  }),
};

const getWorkshopAnalytics = {
  params: Joi.object().keys({
    eventId: Joi.string().required().custom(objectId),
  }),
  query: Joi.object().keys({
    workshopId: Joi.string().custom(objectId).optional(),
  }),
};

const getAbstractAnalytics = {
  params: Joi.object().keys({
    eventId: Joi.string().required().custom(objectId),
  }),
  query: Joi.object().keys({
    status: Joi.string().valid('submitted', 'underReview', 'accepted', 'rejected').optional(),
    category: Joi.string().optional(),
  }),
};

const getSponsorAnalytics = {
  params: Joi.object().keys({
    eventId: Joi.string().required().custom(objectId),
  }),
  query: Joi.object().keys({
    tier: Joi.string().optional(),
    status: Joi.string().valid('active', 'pending', 'expired').optional(),
  }),
};

const exportAnalyticsData = {
  params: Joi.object().keys({
    eventId: Joi.string().required().custom(objectId),
    type: Joi.string().required().valid('registration', 'financial', 'workshop', 'abstract', 'sponsor'),
  }),
  query: Joi.object().keys({
    format: Joi.string().valid('csv', 'excel').default('excel'),
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().optional(),
    category: Joi.string().optional(),
    status: Joi.string().optional(),
  }),
};

module.exports = {
  getRegistrationAnalytics,
  getFinancialAnalytics,
  getWorkshopAnalytics,
  getAbstractAnalytics,
  getSponsorAnalytics,
  exportAnalyticsData,
}; 