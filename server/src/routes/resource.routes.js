const express = require('express');
const router = express.Router({ mergeParams: true }); // Enable mergeParams to access :id from parent router
const { protect } = require('../middleware/auth.middleware');
const {
  getResources,
  createResource,
  getResourceById, // Assuming these exist
  updateResource,    // Assuming these exist
  deleteResource,    // Assuming these exist
  getResourceStats
} = require('../controllers/resource.controller');

// Protect all routes defined here
router.use(protect);

// Routes relative to /api/events/:id/resources
router.route('/')
  .get(getResources)    // GET /api/events/:id/resources
  .post(createResource);   // POST /api/events/:id/resources

// Routes for specific resource usage records
// Assuming resource usage records have their own _id
router.route('/:resourceId') 
  // .get(getResourceById) // GET /api/events/:id/resources/:resourceId
  // .put(updateResource)    // PUT /api/events/:id/resources/:resourceId
  // .delete(deleteResource) // DELETE /api/events/:id/resources/:resourceId
  ;

// Statistics route for a specific resource type/option within this event
router.route('/stats')
  .get(getResourceStats); // GET /api/events/:id/resources/stats?type=...&optionId=...
  
// Note: GET /:id/resources/statistics is handled directly in events.routes.js
// Note: GET/PUT /resources/settings are handled globally (require eventId in query)

module.exports = router; 