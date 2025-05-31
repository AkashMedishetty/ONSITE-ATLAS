const { User, Abstract } = require('../models');
const { createApiError } = require('../middleware/error');
const logger = require('../utils/logger');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const mongoose = require('mongoose');
const { generateAbstractsExcel } = require('../utils/excelHelper');

/**
 * Get all users
 * @route GET /api/users
 * @access Private/Admin
 */
const getUsers = async (req, res, next) => {
  try {
    // Accept eventId from query or params
    const eventId = req.query.eventId || req.params.eventId;
    if (!eventId) {
      logger.warn('getUsers: No eventId provided');
      return next(createApiError(400, 'Event ID is required to list users.'));
    }
    // Convert eventId to ObjectId for query
    const eventObjectId = new mongoose.Types.ObjectId(eventId);
    logger.info(`[getUsers] Querying users for eventId: ${eventId}, as ObjectId: ${eventObjectId}`);
    // Find users whose eventRoles contains this eventId
    const users = await User.find({
      'eventRoles.eventId': eventObjectId
    }).select('-password -refreshToken');
    logger.info(`[getUsers] Found ${users.length} users for eventId: ${eventId}`);
    if (users.length === 0) {
      logger.info(`[getUsers] Users array: ${JSON.stringify(users, null, 2)}`);
    }
    // Ensure _id is always a string
    const usersWithId = users.map(u => ({ ...u.toObject(), _id: u._id ? u._id.toString() : undefined }));
    res.status(200).json({
      success: true,
      count: users.length,
      data: usersWithId
    });
  } catch (error) {
    logger.error(`[getUsers] Error: ${error.message}`);
    next(error);
  }
};

/**
 * Create a new user
 * @route POST /api/users
 * @access Private/Admin
 */
const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role, eventId } = req.body;

    // Block admin creation from this endpoint
    if (role === 'admin') {
      return next(createApiError(403, 'Admin users cannot be created from this interface.'));
    }

    // For non-admin roles, check for existing user with this email and eventId
    let user = await User.findOne({ email });
    if (user) {
      // Check if event-role pair already exists
      const alreadyAssigned = user.eventRoles && user.eventRoles.some(er => er.eventId.toString() === eventId && er.role === role);
      if (alreadyAssigned) {
        return next(createApiError(400, 'User already exists with this email and event for this role'));
      }
      // Add new event-role pair
      user.eventRoles.push({ eventId, role });
      await user.save();
      const userResponse = user.toObject();
      delete userResponse.password;
      logger.info(`User ${user.email} assigned new event-role: ${eventId} - ${role}`);
      return res.status(201).json({ success: true, data: userResponse });
    } else {
      // Create new user with first event-role
      user = await User.create({
        name,
        email,
        password,
        eventRoles: [{ eventId, role }],
      });
      const userResponse = user.toObject();
      delete userResponse.password;
      logger.info(`New user created: ${user.email} for event ${eventId} as ${role}`);
      return res.status(201).json({ success: true, data: userResponse });
    }
  } catch (error) {
    logger.error('Error creating user:', error);
    next(error);
  }
};

/**
 * Get user by ID
 * @route GET /api/users/:id
 * @access Private/Admin
 */
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password -refreshToken');

    if (!user) {
      return next(createApiError(404, 'User not found'));
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user
 * @route PUT /api/users/:id
 * @access Private/Admin
 */
const updateUser = async (req, res, next) => {
  try {
    const { name, email, role, isActive } = req.body;

    // Check if updating email and it already exists
    if (email) {
      const existingUser = await User.findOne({ email, _id: { $ne: req.params.id } });
      if (existingUser) {
        return next(createApiError(400, 'Email already in use'));
      }
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, role, isActive },
      { new: true, runValidators: true }
    ).select('-password -refreshToken');

    if (!user) {
      return next(createApiError(404, 'User not found'));
    }

    logger.info(`User updated: ${user.email}`);

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete user
 * @route DELETE /api/users/:id
 * @access Private/Admin
 */
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return next(createApiError(404, 'User not found'));
    }

    logger.info(`User deleted: ${user.email}`);

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get abstracts assigned to the logged-in reviewer
 * @route GET /api/users/me/reviewer/assigned-abstracts
 * @access Private (Reviewer)
 */
const getAssignedAbstractsForReviewer = async (req, res, next) => {
  try {
    const reviewerId = req.user._id;

    if (!reviewerId) {
      return next(createApiError(401, 'User not authenticated'));
    }

    const abstracts = await Abstract.find({
      'reviewDetails.assignedTo': reviewerId
    })
    .populate('event', 'name slug') // Populate event name and slug for context
    .populate('category', 'name') // Populate category name for reviewer dashboard
    .lean();

    // Optionally, you might want to tailor the reviewDetails.reviews to only show this reviewer's review or summary
    const processedAbstracts = abstracts.map(abstract => {
      const myReview = abstract.reviewDetails && abstract.reviewDetails.reviews 
        ? abstract.reviewDetails.reviews.find(review => review.reviewer && review.reviewer.equals(reviewerId))
        : null;
      return {
        ...abstract,
        myReviewStatus: myReview ? (myReview.isComplete ? myReview.decision : 'pending') : 'not-reviewed'
        // Remove full reviewDetails.reviews if not needed or to simplify payload
        // reviewDetails: undefined 
      };
    });

    res.status(200).json({
      success: true,
      count: processedAbstracts.length,
      data: processedAbstracts
    });
  } catch (error) {
    logger.error(`Error fetching assigned abstracts for reviewer ${req.user ? req.user.email : 'Unknown'}: ${error.message}`);
    next(error);
  }
};

/**
 * Get users associated with a specific event.
 * @route GET /api/events/:eventId/users
 * @access Private (Admin or Event Manager)
 */
const getUsersForEvent = async (req, res, next) => {
  try {
    const { eventId } = req.params;

    if (!eventId) {
      return next(createApiError(400, 'Event ID is required'));
    }

    // Find users where their managedEvents array contains the eventId
    const users = await User.find({ managedEvents: eventId })
      .select('-password -refreshToken -__v'); // Exclude sensitive fields

    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    logger.error(`Error fetching users for event ${req.params.eventId}: ${error.message}`);
    next(error);
  }
};

// Helper function to generate CSV string (simplified)
const generateCsvFromArray = (headers, dataArray) => {
  let csvString = headers.join(',') + '\r\n';
  dataArray.forEach(row => {
    // Sanitize and quote each value
    const line = headers.map(header => {
      const value = row[header] === null || row[header] === undefined ? '' : String(row[header]);
      // Escape double quotes by doubling them, and wrap in double quotes if it contains comma, newline or double quote
      if (value.includes(',') || value.includes('\"') || value.includes('\n') || value.includes('\r')) {
        return `\"${value.replace(/\"/g, '\"\"')}\"`
      }
      return value;
    }).join(',');
    csvString += line + '\r\n';
  });
  return csvString;
};

// Implementation for exportReviewerAbstractDetails
const exportReviewerAbstractDetails = async (req, res, next) => {
  try {
    const reviewerId = req.user._id;
    const { eventId } = req.params;
    if (!eventId) {
      return next(createApiError(400, 'Event ID is required'));
    }
    // Find all abstracts assigned to this reviewer for the event
    const abstracts = await Abstract.find({
      event: eventId,
      'reviewDetails.assignedTo': reviewerId
    })
      .populate('event')
      .populate('category')
      .populate('registration')
      .lean();
    if (!abstracts || abstracts.length === 0) {
      // Return an empty Excel file with headers only
      const { buffer, fileName } = await generateAbstractsExcel([], { eventName: 'Event', categoryOrTopic: 'all', exportMode: 'single-row' });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      return res.end(buffer);
    }
    // For subtopic name resolution, also populate eventInfo
    const event = await require('../models/Event').findById(eventId).lean();
    const abstractsWithEventInfo = abstracts.map(abs => ({ ...abs, eventInfo: event }));
    const { buffer, fileName } = await generateAbstractsExcel(abstractsWithEventInfo, { eventName: event?.name || 'Event', categoryOrTopic: 'all', exportMode: 'single-row' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    return res.end(buffer);
  } catch (error) {
    logger.error(`Error exporting abstract details for reviewer ${req.user?._id}, event ${req.params.eventId}: ${error.message}`);
    next(error);
  }
};

// Implementation for downloadReviewerAbstractFiles
const downloadReviewerAbstractFiles = async (req, res, next) => {
  try {
    const reviewerId = req.user._id;
    const { eventId } = req.params;

    if (!eventId) {
      return next(createApiError(400, 'Event ID is required'));
    }

    const abstractsWithFiles = await Abstract.find({
      event: eventId,
      'reviewDetails.assignedTo': reviewerId,
      fileUrl: { $exists: true, $ne: null, $ne: '' },
      fileName: { $exists: true, $ne: null, $ne: '' }
    }).select('_id title fileUrl fileName event').lean(); // Select event for naming convention

    if (!abstractsWithFiles || abstractsWithFiles.length === 0) {
      return next(createApiError(404, 'No downloadable files found for your assigned abstracts in this event.'));
    }

    const eventNameSlug = abstractsWithFiles[0].event?.name?.replace(/\s+/g, '_').substring(0,20) || eventId;
    const zipFileName = `Reviewer_${reviewerId}_Event_${eventNameSlug}_Files_${Date.now()}.zip`;
    
    // Ensure temp directory exists
    const tempZipDir = path.join(__dirname, '..', '..', 'uploads', 'temp'); // Adjusted path relative to controller file
    if (!fs.existsSync(tempZipDir)) {
      fs.mkdirSync(tempZipDir, { recursive: true });
    }
    const zipFilePath = path.join(tempZipDir, zipFileName);

    const output = fs.createWriteStream(zipFilePath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    let headersSent = false;

    output.on('close', () => {
      if (headersSent) return;
      headersSent = true;
      logger.info(`ZIP archive created: ${zipFileName}, size: ${archive.pointer()} bytes`);
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${zipFileName}"`);
      res.status(200).download(zipFilePath, zipFileName, (err) => {
        if (err) {
          logger.error('Error sending ZIP file to client:', err);
          // Cannot send another response if headers were already sent by res.download
        }
        // Clean up the temp file
        fs.unlink(zipFilePath, unlinkErr => {
          if (unlinkErr) logger.error('Error deleting temp ZIP file:', unlinkErr);
        });
      });
    });

    archive.on('warning', (err) => {
      if (err.code === 'ENOENT') {
        logger.warn('Archiver warning (file not found during zipping):', err);
      } else {
        logger.error('Archiver warning:', err);
      }
    });

    archive.on('error', (err) => {
      logger.error('Archiver critical error:', err);
      fs.unlink(zipFilePath, () => {}); // Attempt to delete partial zip
      if (!headersSent) {
        headersSent = true;
        return next(createApiError(500, 'Error creating ZIP archive'));
      }
    });

    archive.pipe(output);
    let filesAdded = 0;
    for (const abstract of abstractsWithFiles) {
      if (abstract.fileUrl && abstract.fileName) {
        // Ensure abstract.fileUrl is treated as relative to the 'uploads' directory base
        const relativeFileUrl = abstract.fileUrl.startsWith('/') ? abstract.fileUrl.substring(1) : abstract.fileUrl;
        // Assuming process.cwd() is the /server directory if the script is run from there
        const filePath = path.join(process.cwd(), 'public', relativeFileUrl);
        
        if (fs.existsSync(filePath)) {
          // Sanitize file names for ZIP entry if necessary, though archiver might handle some of this.
          // Using a simple prefix for uniqueness within the zip for now.
          archive.file(filePath, { name: `${abstract._id}_${abstract.fileName}` });
          filesAdded++;
        }
      }
    }
    if (filesAdded === 0) {
      return next(createApiError(404, 'No files found to zip'));
    }
    archive.finalize();
  } catch (error) {
    logger.error(`Error downloading files for reviewer ${req.user?._id}, event ${req.params.eventId}: ${error.message}`);
    next(error);
  }
};

module.exports = {
  getUsers,
  createUser,
  getUserById,
  updateUser,
  deleteUser,
  getAssignedAbstractsForReviewer,
  getUsersForEvent,
  exportReviewerAbstractDetails,
  downloadReviewerAbstractFiles
};