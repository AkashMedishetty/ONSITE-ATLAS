const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const registrationResourceController = require('../controllers/registrationResource.controller');
const { getResourceUsage, voidResourceUsage } = require('../controllers/resource.controller');

// Get resources for a specific registration
router.get('/:eventId/registrations/:registrationId/resources', 
  protect, 
  registrationResourceController.getRegistrationResources
);

// Update a resource usage status
router.patch('/:eventId/registrations/:registrationId/resources/:resourceId', 
  protect, 
  registrationResourceController.updateResourceUsage
);

// Send certificate to a specific registrant
router.post('/:eventId/registrations/:registrationId/send-certificate', 
  protect, 
  registrationResourceController.sendCertificate
);

// Get resource usage statistics for a registration
router.get('/:eventId/registrations/:registrationId/resource-stats', 
  protect, 
  registrationResourceController.getResourceStats
);

// Placeholder routes for registration resources
router.route('/')
  .get((req, res) => {
    res.status(200).json({
      success: true,
      message: 'Get registration resources route under development',
      data: []
    });
  })
  .post((req, res) => {
    res.status(201).json({
      success: true,
      message: 'Create registration resource route under development',
      data: {}
    });
  });

router.route('/:id')
  .get((req, res) => {
    res.status(200).json({
      success: true,
      message: 'Get registration resource by ID route under development',
      data: { id: req.params.id }
    });
  })
  .put((req, res) => {
    res.status(200).json({
      success: true,
      message: 'Update registration resource route under development',
      data: { id: req.params.id }
    });
  })
  .delete((req, res) => {
    res.status(200).json({
      success: true,
      message: 'Delete registration resource route under development',
      data: { id: req.params.id }
    });
  });

// Route to get all resource usage for a specific registration
// Correct Path: /api/events/:eventId/registrations/:registrationId/resources
// Relative Path: /
router.route('/')
    .get(protect, getResourceUsage);

// Route to void a specific resource usage record
// Correct Path: /api/events/:eventId/registrations/:registrationId/resources/:resourceUsageId/void
router.route('/:eventId/registrations/:registrationId/resources/:resourceUsageId/void')
    .put(protect, voidResourceUsage);

module.exports = router; 