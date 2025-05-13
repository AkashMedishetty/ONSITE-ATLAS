const Joi = require('joi');
const { objectId } = require('./custom.validation');

const updateTab = {
  params: Joi.object().keys({
    eventId: Joi.string().custom(objectId).required(),
    tab: Joi.string().required()
  }),
  body: Joi.object().required().min(1)
};

const updatePermissions = {
  params: Joi.object().keys({
    userId: Joi.string().custom(objectId).required()
  }),
  body: Joi.object().keys({
    role: Joi.string().valid('admin', 'manager', 'staff').optional(),
    extendedPermissions: Joi.object({
      canManageLandingPages: Joi.boolean().optional(),
      canManagePayments: Joi.boolean().optional(),
      canManageSponsors: Joi.boolean().optional(),
      canManageWorkshops: Joi.boolean().optional(),
      canReviewAbstracts: Joi.boolean().optional(),
      canManageHotelTravel: Joi.boolean().optional()
    }).optional(),
    events: Joi.array().items(Joi.string().custom(objectId)).optional()
  }).min(1)
};

const createSponsorAdmin = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    sponsorOrganization: Joi.string().custom(objectId).required()
  })
};

module.exports = {
  updateTab,
  updatePermissions,
  createSponsorAdmin
}; 