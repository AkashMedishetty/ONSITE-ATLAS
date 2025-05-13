// const { createClient } = require('@supabase/supabase-js');
const { LandingPage, Event } = require('../models');
// const { ApiError } = require('../utils/ApiError'); // Remove this
const { createApiError } = require('../middleware/error'); // Import createApiError
const asyncHandler = require('../middleware/async');

/**
 * Get all landing pages for an event
 */
exports.getLandingPages = asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  
  const landingPages = await LandingPage.find({ event: eventId })
    .select('title slug isPublished publishedVersion createdAt updatedAt')
    .sort('-updatedAt');
  
  res.status(200).json({
    status: 'success',
    data: {
      landingPages
    }
  });
});

/**
 * Create a new landing page
 */
exports.createLandingPage = asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  
  // Check if event exists
  const event = await Event.findById(eventId);
  if (!event) {
    throw createApiError(404, 'Event not found'); // Use createApiError
  }
  
  // Create landing page
  const landingPage = await LandingPage.create({
    ...req.body,
    event: eventId,
    createdBy: req.user._id
  });
  
  res.status(201).json({
    status: 'success',
    data: {
      landingPage
    }
  });
});

/**
 * Get landing page by ID
 */
exports.getLandingPageById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const landingPage = await LandingPage.findById(id);
  
  if (!landingPage) {
    throw createApiError(404, 'Landing page not found'); // Use createApiError
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      landingPage
    }
  });
});

/**
 * Update landing page
 */
exports.updateLandingPage = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const landingPage = await LandingPage.findByIdAndUpdate(
    id,
    {
      ...req.body,
      updatedAt: Date.now()
    },
    {
      new: true,
      runValidators: true
    }
  );
  
  if (!landingPage) {
    throw createApiError(404, 'Landing page not found'); // Use createApiError
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      landingPage
    }
  });
});

/**
 * Delete landing page
 */
exports.deleteLandingPage = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const landingPage = await LandingPage.findByIdAndDelete(id);
  
  if (!landingPage) {
    throw createApiError(404, 'Landing page not found'); // Use createApiError
  }
  
  res.status(204).json({
    status: 'success',
    data: null
  });
});

/**
 * Publish landing page
 */
exports.publishLandingPage = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const landingPage = await LandingPage.findById(id);
  
  if (!landingPage) {
    throw createApiError(404, 'Landing page not found'); // Use createApiError
  }
  
  // Save current version and publish
  await landingPage.saveVersion();
  landingPage.isPublished = true;
  await landingPage.save();
  
  res.status(200).json({
    status: 'success',
    data: {
      landingPage
    }
  });
});

/**
 * Preview landing page
 */
exports.previewLandingPage = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const landingPage = await LandingPage.findById(id)
    .populate({
      path: 'event',
      select: 'name startDate endDate venue logo bannerImage'
    });
  
  if (!landingPage) {
    throw createApiError(404, 'Landing page not found'); // Use createApiError
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      landingPage
    }
  });
});

/**
 * Import HTML page
 */
exports.importHtmlPage = asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  const { title, slug, html, css, js } = req.body;
  
  // Check if event exists
  const event = await Event.findById(eventId);
  if (!event) {
    throw createApiError(404, 'Event not found'); // Use createApiError
  }
  
  // Create a landing page with custom HTML component
  const landingPage = await LandingPage.create({
    event: eventId,
    title,
    slug,
    components: [
      {
        type: 'html',
        order: 1,
        settings: {
          fullWidth: true
        },
        customHtml: html,
        customCss: css,
        customJs: js
      }
    ],
    createdBy: req.user._id
  });
  
  res.status(201).json({
    status: 'success',
    data: {
      landingPage
    }
  });
});

/**
 * Restore previous version
 */
exports.restoreVersion = asyncHandler(async (req, res) => {
  const { id, versionId } = req.params;
  
  const landingPage = await LandingPage.findById(id);
  
  if (!landingPage) {
    throw createApiError(404, 'Landing page not found'); // Use createApiError
  }
  
  const version = landingPage.versions.find(v => v._id.toString() === versionId);
  
  if (!version) {
    throw createApiError(404, 'Version not found'); // Use createApiError
  }
  
  // Restore components from version
  landingPage.components = [...version.components];
  landingPage.updatedAt = Date.now();
  
  await landingPage.save();
  
  res.status(200).json({
    status: 'success',
    data: {
      landingPage
    }
  });
}); 