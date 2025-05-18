const Abstract = require('../models/Abstract');
const Event = require('../models/Event');
const { ErrorResponse } = require('../middleware/error');
const asyncHandler = require('../middleware/async');
const logger = require('../config/logger');

/**
 * @desc    Get all abstracts for the current registrant
 * @route   GET /api/registrant-portal/abstracts
 * @access  Private (Registrant only)
 */
exports.getRegistrantAbstracts = asyncHandler(async (req, res, next) => {
  const { eventId } = req.query;
  const registrationId = req.registrant.id;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  logger.info(`Fetching abstracts for registrant ${registrationId}${eventId ? ` in event ${eventId}` : ''} (page: ${page}, limit: ${limit})`);

  try {
    const query = { registration: registrationId };
    if (eventId) {
      query.event = eventId;
    }

    // Execute count query and data query in parallel
    const [count, abstracts] = await Promise.all([
      Abstract.countDocuments(query),
      Abstract.find(query)
        .populate('category')
        .populate('event', 'name startDate endDate')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean() // Convert to plain JS object for better performance
    ]);

    logger.info(`Found ${count} total abstracts for registrant ${registrationId}, returning ${abstracts.length} items`);

    // Return paginated response
    return res.status(200).json({
      success: true,
      count: count,
      data: abstracts,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(count / limit),
        hasNextPage: page < Math.ceil(count / limit),
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    logger.error(`Error fetching registrant abstracts: ${error.message}`);
    return next(new ErrorResponse('Error fetching abstracts', 500));
  }
});

/**
 * @desc    Get a specific abstract by ID for the current registrant
 * @route   GET /api/registrant-portal/abstracts/:abstractId
 * @access  Private (Registrant only)
 */
exports.getRegistrantAbstractById = asyncHandler(async (req, res, next) => {
  logger.info("!!!!!!!!!!!!!!!!!!!!!!!!!!!! ENTERING getRegistrantAbstractById !!!!!!!!!!!!!!!!!!!!!!!!!!!!");
  const { abstractId } = req.params;
  // Accept eventId from either params or query
  let eventId = req.params.eventId || req.query.event || req.query.eventId;
  const registrationId = req.registrant.id;

  if (!eventId) {
    logger.error("[REG_ABSTRACT_CTRLR] CRITICAL: eventId is missing from req.params or req.query in getRegistrantAbstractById.");
    return next(new ErrorResponse('Internal server error: Event ID missing.', 500));
  }

  logger.info(`[REG_ABSTRACT_CTRLR] Attempting to fetch abstract ${abstractId} for event ${eventId}, registrant ${registrationId}`);

  try {
    const abstract = await Abstract.findOne({
      _id: abstractId,
      event: eventId,
      registration: registrationId
    })
      .populate('event', 'name startDate endDate abstractSettings')
      .populate('category', 'name')
      .lean();

    if (!abstract) {
      logger.warn(`[REG_ABSTRACT_CTRLR] Abstract ${abstractId} not found for event ${eventId}, registrant ${registrationId}`);
      return next(new ErrorResponse('Abstract not found', 404));
    }

    // Always include the category ObjectId as a string for frontend matching
    let categoryIdString = null;
    if (abstract.category && typeof abstract.category === 'object' && abstract.category._id) {
      categoryIdString = String(abstract.category._id);
    } else if (abstract.category && abstract.category.$oid) {
      categoryIdString = String(abstract.category.$oid);
    } else if (abstract.category && typeof abstract.category === 'string') {
      categoryIdString = abstract.category;
    } else if (abstract.category) {
      categoryIdString = String(abstract.category);
    }

    let categoryName = null;
    let subTopicName = null;

    // Robustly match category by _id or $oid
    if (
      abstract.event &&
      abstract.event.abstractSettings &&
      Array.isArray(abstract.event.abstractSettings.categories) &&
      categoryIdString
    ) {
      const eventCategories = abstract.event.abstractSettings.categories;
      const eventCategoryIds = eventCategories.map(cat => String(cat._id && cat._id.$oid ? cat._id.$oid : cat._id));
      logger.info('[getRegistrantAbstractById] Comparing abstract.category:', categoryIdString, 'with event categories:', eventCategoryIds);
      const foundCategory = eventCategories.find(cat => String(cat._id && cat._id.$oid ? cat._id.$oid : cat._id) === categoryIdString);
      if (foundCategory) {
        categoryName = foundCategory.name;
        // Try to resolve subTopic name if present
        if (abstract.subTopic && foundCategory.subTopics && Array.isArray(foundCategory.subTopics)) {
          const foundSubTopic = foundCategory.subTopics.find(st => String(st._id && st._id.$oid ? st._id.$oid : st._id) === String(abstract.subTopic && abstract.subTopic.$oid ? abstract.subTopic.$oid : abstract.subTopic));
          if (foundSubTopic) {
            subTopicName = foundSubTopic.name;
          }
        }
      }
    }

    // Fallback: Try to get category name from populated category
    if (!categoryName && abstract.category && abstract.category.name) {
      categoryName = abstract.category.name;
    }

    // Always include the categoryIdString for frontend matching
    const abstractToSend = {
      ...abstract,
      category: categoryIdString,
      categoryName,
      subTopicName
    };

    logger.info(`[REG_ABSTRACT_CTRLR] FINAL Abstract to send - categoryName: ${abstractToSend.categoryName}, subTopicName: ${abstractToSend.subTopicName}`);
    res.status(200).json({
      success: true,
      data: abstractToSend
    });
  } catch (error) {
    logger.error(`!!!!!!!!!!!!!!!!!!!!!!!!!!!! ERROR INSIDE getRegistrantAbstractById for abstract ${abstractId} !!!!!!!!!!!!!!!!!!!!!!!!!!!!`);
    logger.error(`[REG_ABSTRACT_CTRLR] Error details: ${error.message}`);
    logger.error(`[REG_ABSTRACT_CTRLR] Error stack: ${error.stack}`);
    return next(new ErrorResponse('Error processing abstract details', 500, error.stack));
  }
});

/**
 * @desc    Create a new abstract for the current registrant
 * @route   POST /api/registrant-portal/abstracts
 * @access  Private (Registrant only)
 */
exports.createRegistrantAbstract = asyncHandler(async (req, res, next) => {
  const registrationId = req.registrant.id;
  
  // Add the registration ID to the request body
  const abstractData = {
    ...req.body,
    registration: registrationId
  };

  logger.info(`Creating new abstract for registrant ${registrationId}`);

  try {
    // Validate required fields
    if (!abstractData.title || !abstractData.authors || !abstractData.content || !abstractData.event) {
      return next(new ErrorResponse('Missing required fields (title, authors, content, event)', 400));
    }

    // Create the abstract
    const abstract = await Abstract.create(abstractData);

    logger.info(`Created abstract ${abstract._id} for registrant ${registrationId}`);

    res.status(201).json({
      success: true,
      data: abstract
    });
  } catch (error) {
    logger.error(`Error creating registrant abstract: ${error.message}`);
    return next(new ErrorResponse('Error creating abstract', 500));
  }
});

/**
 * @desc    Update an abstract for the current registrant
 * @route   PUT /api/registrant-portal/abstracts/:abstractId
 * @access  Private (Registrant only)
 */
exports.updateRegistrantAbstract = asyncHandler(async (req, res, next) => {
  const { abstractId } = req.params;
  const registrationId = req.registrant.id;
  const updateData = { ...req.body };

  // Don't allow changing registration or status
  delete updateData.registration;
  delete updateData.status;

  logger.info(`Updating abstract ${abstractId} for registrant ${registrationId}`);

  try {
    // First check if the abstract exists and belongs to this registrant
    const abstract = await Abstract.findOne({
      _id: abstractId,
      registration: registrationId
    });

    if (!abstract) {
      logger.warn(`Abstract ${abstractId} not found for registrant ${registrationId}`);
      return next(new ErrorResponse('Abstract not found or you do not have permission to update it', 404));
    }

    // Don't allow updating if the abstract has been approved or rejected
    if (abstract.status === 'accepted' || abstract.status === 'rejected') {
      logger.warn(`Cannot update abstract ${abstractId} with status ${abstract.status}`);
      return next(new ErrorResponse(`Cannot update abstract with status: ${abstract.status}`, 400));
    }

    // Update the abstract
    const updatedAbstract = await Abstract.findByIdAndUpdate(
      abstractId,
      updateData,
      { new: true, runValidators: true }
    );

    logger.info(`Updated abstract ${abstractId} for registrant ${registrationId}`);

    res.status(200).json({
      success: true,
      data: updatedAbstract
    });
  } catch (error) {
    logger.error(`Error updating registrant abstract: ${error.message}`);
    return next(new ErrorResponse('Error updating abstract', 500));
  }
});

/**
 * @desc    Delete an abstract for the current registrant
 * @route   DELETE /api/registrant-portal/abstracts/:abstractId
 * @access  Private (Registrant only)
 */
exports.deleteRegistrantAbstract = asyncHandler(async (req, res, next) => {
  const { abstractId } = req.params;
  const registrationId = req.registrant.id;

  logger.info(`Attempting to delete abstract ${abstractId} for registrant ${registrationId}`);

  try {
    // First check if the abstract exists and belongs to this registrant
    const abstract = await Abstract.findOne({
      _id: abstractId,
      registration: registrationId
    });

    if (!abstract) {
      logger.warn(`Abstract ${abstractId} not found for registrant ${registrationId}`);
      return next(new ErrorResponse('Abstract not found or you do not have permission to delete it', 404));
    }

    // Don't allow deleting if the abstract has been approved or rejected
    if (abstract.status === 'accepted' || abstract.status === 'rejected') {
      logger.warn(`Cannot delete abstract ${abstractId} with status ${abstract.status}`);
      return next(new ErrorResponse(`Cannot delete abstract with status: ${abstract.status}`, 400));
    }

    // Delete the abstract
    await Abstract.findByIdAndDelete(abstractId);

    logger.info(`Deleted abstract ${abstractId} for registrant ${registrationId}`);

    res.status(200).json({
      success: true,
      message: 'Abstract deleted successfully'
    });
  } catch (error) {
    logger.error(`Error deleting registrant abstract: ${error.message}`);
    return next(new ErrorResponse('Error deleting abstract', 500));
  }
});

/**
 * @desc    Download an abstract file
 * @route   GET /api/registrant-portal/abstracts/:abstractId/download
 * @access  Private (Registrant only)
 */
exports.downloadAbstract = asyncHandler(async (req, res, next) => {
  const { abstractId } = req.params;
  const registrationId = req.registrant.id;

  logger.info(`Downloading abstract ${abstractId} file for registrant ${registrationId}`);

  try {
    // First check if the abstract exists and belongs to this registrant
    const abstract = await Abstract.findOne({
      _id: abstractId,
      registration: registrationId
    });

    if (!abstract) {
      logger.warn(`Abstract ${abstractId} not found for registrant ${registrationId}`);
      return next(new ErrorResponse('Abstract not found or you do not have permission to download it', 404));
    }

    // Check if the abstract has a file
    if (!abstract.fileUrl) {
      logger.warn(`Abstract ${abstractId} does not have an associated file`);
      return next(new ErrorResponse('No file associated with this abstract', 404));
    }

    // For now, this is a placeholder. In a real scenario, you would stream the file from S3 or a local path.
    res.status(200).json({ 
      success: true, 
      message: 'Download functionality not yet implemented.', 
      fileUrl: abstract.fileUrl || null 
    });
  } catch (error) {
    logger.error(`Error downloading abstract file: ${error.message}`);
    return next(new ErrorResponse('Error downloading abstract file', 500));
  }
}); 