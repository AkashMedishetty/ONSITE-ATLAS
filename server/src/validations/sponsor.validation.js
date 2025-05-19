const Joi = require('joi');
const { objectId } = require('./custom.validation'); // Assuming custom objectId validator exists

const sponsorLogin = {
  params: Joi.object().keys({
    eventId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object().keys({
    sponsorId: Joi.string().required(),
    password: Joi.string().required().min(10), // contactPhone used as password
  }),
};

const createOrUpdateSponsorBodyBase = {
    companyName: Joi.string(),
    authorizedPerson: Joi.string(),
    email: Joi.string().email(), // Changed from contactEmail
    displayPhoneNumber: Joi.string().trim().allow(null, '').pattern(/^[0-9]{10}$/).messages({
      'string.pattern.base': 'Display phone number must be exactly 10 digits if provided.',
    }),
    contactPhone: Joi.string().min(10), // This is the login password, will be hashed
    sponsoringAmount: Joi.number().min(0).allow(null, ''),
    registrantAllotment: Joi.number().integer().min(0),
    description: Joi.string().allow(null, ''),
    status: Joi.string().valid('Active', 'Inactive'), // Updated status options
};

const createSponsor = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object().keys({
    ...createOrUpdateSponsorBodyBase,
    companyName: createOrUpdateSponsorBodyBase.companyName.required(),
    authorizedPerson: createOrUpdateSponsorBodyBase.authorizedPerson.required(),
    email: createOrUpdateSponsorBodyBase.email.required(),
    contactPhone: createOrUpdateSponsorBodyBase.contactPhone.required(),
    registrantAllotment: createOrUpdateSponsorBodyBase.registrantAllotment.default(0),
    status: createOrUpdateSponsorBodyBase.status.default('Active'), // Default to Active for new sponsors
  }),
};

const getSponsor = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId).required(),
    sponsorDbId: Joi.string().custom(objectId).required(), // Validate MongoDB ObjectId
  }),
};

const updateSponsor = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId).required(),
    sponsorDbId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object().keys({
     ...createOrUpdateSponsorBodyBase,
  }).min(1), // Ensure at least one field is being updated
};

const deleteSponsor = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId).required(),
    sponsorDbId: Joi.string().custom(objectId).required(),
  }),
};

module.exports = {
  sponsorLogin,
  createSponsor,
  getSponsor,
  updateSponsor,
  deleteSponsor,
}; 