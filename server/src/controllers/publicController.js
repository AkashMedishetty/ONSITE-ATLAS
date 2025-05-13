const { LandingPage, Event } = require('../models');
const asyncHandler = require('../middleware/async');
const { ApiError } = require('../utils/ApiError');

/**
 * Render landing page
 */
exports.renderLandingPage = asyncHandler(async (req, res, next) => {
  const { eventSlug } = req.params;
  
  // Find the event by slug
  const event = await Event.findOne({ slug: eventSlug });
  
  if (!event) {
    return next(new ApiError('Event not found', 404));
  }
  
  // Find published landing page for the event
  const landingPage = await LandingPage.findOne({
    event: event._id,
    isPublished: true
  }).populate({
    path: 'event',
    select: 'name startDate endDate venue logo bannerImage'
  });
  
  if (!landingPage) {
    return next(new ApiError('Landing page not found', 404));
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      landingPage
    }
  });
});

/**
 * Handle short URL
 */
exports.handleShortUrl = asyncHandler(async (req, res, next) => {
  const { shortCode } = req.params;
  
  // In a real implementation, you would look up the short code in a database
  // For now, we'll assume it maps to an event ID
  const event = await Event.findOne({ shortCode });
  
  if (!event) {
    return next(new ApiError('Invalid short code', 404));
  }
  
  // Find published landing page for the event
  const landingPage = await LandingPage.findOne({
    event: event._id,
    isPublished: true
  });
  
  if (!landingPage) {
    // If no landing page exists, redirect to registration page
    return res.status(200).json({
      status: 'success',
      data: {
        redirectUrl: `/events/${event._id}/register`
      }
    });
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      redirectUrl: `/event/${event.slug}`
    }
  });
});

// Get all public events
exports.getAllPublicEvents = asyncHandler(async (req, res, next) => {
    const events = await Event.find({ isPublic: true, status: 'published' }).sort({ startDate: 1 });

    res.status(200).json({
        status: 'success',
        results: events.length,
        data: {
            events
        }
    });
});

// Get a single public event by slug or ID
exports.getPublicEvent = asyncHandler(async (req, res, next) => {
    const event = await Event.findOne({
        $or: [{ slug: req.params.slugOrId }, { _id: req.params.slugOrId }],
        isPublic: true,
        status: 'published'
    });

    if (!event) {
        return next(new ApiError('No event found with that identifier or it is not public', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            event
        }
    });
}); 