const express = require('express');
const sponsorController = require('../controllers/sponsor.controller'); // We will create this controller
const { protect } = require('../middleware/auth.middleware'); // For protecting routes
const { restrict } = require('../middleware/auth.middleware'); // For role-based access
const validate = require('../middleware/validate');
const sponsorValidation = require('../validations/sponsor.validation'); // We already have createSponsor validation here

// IMPORTANT: This router will be mounted with a path like /api/events/:eventId/sponsors
// So, routes defined here will be relative to that.
const router = express.Router({ mergeParams: true }); // mergeParams allows access to :eventId from parent router

router
  .route('/')
  .post(
    protect, 
    restrict('admin', 'manager'), // Only admins or event managers can create sponsors
    validate(sponsorValidation.createSponsor), // Validation for request body
    sponsorController.createEventSponsor // Controller function to create a sponsor
  )
  .get(
    protect, 
    restrict('admin', 'manager', 'staff'), // Staff can also view sponsors
    sponsorController.getEventSponsors // Controller function to get all sponsors for the event
  );

router
  .route('/:sponsorDbId') // :sponsorDbId will be the MongoDB _id of the EventSponsor document
  .get(
    protect, 
    restrict('admin', 'manager', 'staff'),
    validate(sponsorValidation.getSponsor), // Need to add this validation
    sponsorController.getEventSponsorById // Controller function to get a single sponsor
  )
  .put(
    protect, 
    restrict('admin', 'manager'),
    validate(sponsorValidation.updateSponsor), // Need to add this validation
    sponsorController.updateEventSponsor // Controller function to update a sponsor
  )
  .delete(
    protect, 
    restrict('admin', 'manager'),
    validate(sponsorValidation.deleteSponsor), // Need to add this validation
    sponsorController.deleteEventSponsor // Controller function to delete a sponsor
  );

// We might also need a route to get a sponsor by its custom `sponsorId` (SPN-xxxx-NNN) if that's preferred for some lookups,
// but typically REST APIs use the database _id for single resource operations.
// router.get('/by-custom-id/:sponsorCustomId', protect, sponsorController.getEventSponsorByCustomId);

module.exports = router; 