const express = require('express');
const sponsorAuthController = require('../controllers/sponsorAuth.controller');
const validate = require('../middleware/validate'); // Assuming a validation middleware exists
const sponsorValidation = require('../validations/sponsor.validation'); // We'll create this next
const { protect } = require('../middleware/auth.middleware'); // Assuming protect middleware

const router = express.Router();

// Route for sponsor login, specific to an event
// POST /api/events/:eventId/sponsors/login (This is the common pattern in this app for event-specific resources)
// However, to make these routes self-contained under /sponsor-auth or similar:
// POST /api/sponsor-auth/login (if eventId is in body or if sponsorId is globally unique)
// Let's go with a dedicated path for sponsor auth, and eventId will be part of the URL for clarity and to match portal structure.

router.post(
  '/events/:eventId/login', 
  validate(sponsorValidation.sponsorLogin), // We need to create this validation schema
  sponsorAuthController.loginSponsor
);

// Route for logged-in sponsor to get their profile
router.get(
  '/me',
  protect, // Protect this route, it will use the sponsor's JWT
  sponsorAuthController.getSponsorProfile
);

// Route for logged-in sponsor to get their associated registrants
router.get(
  '/me/registrants',
  protect, // Protect this route, requires sponsor JWT
  sponsorAuthController.getSponsorRegistrants // The new controller function
);

// We might add other sponsor-auth related routes here later if needed (e.g., forgot-password, get-profile for sponsor)

module.exports = router;

/* 
Alternative route structure if we nest it directly under events:
If this file was event.routes.js and imported sponsorAuthController
router.post(
  '/:eventId/sponsors/login',
  validate(sponsorValidation.sponsorLogin),
  sponsorAuthController.loginSponsor
);
For now, keeping sponsor auth routes separate for clarity.
*/ 