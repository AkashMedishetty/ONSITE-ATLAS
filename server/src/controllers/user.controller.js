const { User, Abstract } = require('../models');
const { createApiError } = require('../middleware/error');
const logger = require('../utils/logger');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

/**
 * Get all users
 * @route GET /api/users
 * @access Private/Admin
 */
const getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password -refreshToken');

    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
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

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(createApiError(400, 'User already exists with this email'));
    }

    // Create new user
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'staff'
    });

    // If eventId is provided and role is one of the specified, associate user with the event
    if (eventId) {
      console.log('UserCreate Controller: eventId present:', eventId, 'User role:', user.role);
      const rolesToAssociate = ['reviewer', 'staff', 'manager'];
      if (rolesToAssociate.includes(user.role)) {
        // Ensure managedEvents is an array and add the eventId if not already present
        // (User.create would have returned the created user, so we can modify it and save)
        if (!user.managedEvents) {
          user.managedEvents = [];
        }
        if (!user.managedEvents.includes(eventId)) {
          user.managedEvents.push(eventId);
          await user.save(); // Save the user with the updated managedEvents
          logger.info(`User ${user.email} associated with event ${eventId}`);
        }
      }
    }

    // Remove password from response
    const userResponse = user.toObject(); // Convert to plain object if it's a Mongoose doc
    delete userResponse.password;

    logger.info(`New user created: ${user.email}`);

    res.status(201).json({
      success: true,
      data: userResponse // Send the modified user object without password
    });
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
    .select('title abstractNumber status submissionDate event reviewDetails.reviews category') // Add category to selected fields
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
    const reviewerId = req.user._id; // Assuming req.user is populated by 'protect' middleware
    const { eventId } = req.params;

    if (!eventId) {
      return next(createApiError(400, 'Event ID is required'));
    }

    const abstracts = await Abstract.find({
      event: eventId,
      'reviewDetails.assignedTo': reviewerId
    })
    .populate('event', 'name')
    .populate('category', 'name')
    .populate('authors.user', 'name affiliation') // If authors are stored as references
    .select('title submissionDate event category authors reviewDetails.reviews')
    .lean();

    if (!abstracts || abstracts.length === 0) {
      // Send an empty CSV if no abstracts are found for this reviewer and event
      const emptyCsvHeaders = ['Title', 'Author(s)', 'Submission Date', 'Your Review Status', 'Category'];
      const emptyCsvString = generateCsvFromArray(emptyCsvHeaders, []);
      const emptyFileName = `no_abstract_details_${reviewerId}_${eventId}_${Date.now()}.csv`;
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${emptyFileName}"`);
      return res.status(200).end(emptyCsvString);
    }

    const csvHeaders = ['Title', 'Author(s)', 'Submission Date', 'Your Review Status', 'Category', 'Event Name'];
    const csvData = abstracts.map(abs => {
      const myReview = abs.reviewDetails && abs.reviewDetails.reviews
        ? abs.reviewDetails.reviews.find(review => review.reviewer && String(review.reviewer) === String(reviewerId))
        : null;
      const myReviewStatus = myReview ? (myReview.isComplete ? myReview.decision : 'Pending Review') : 'Not Reviewed';
      
      let authorNames = 'N/A';
      // Ensure abs.authors is an array and has elements before mapping
      if (abs.authors && Array.isArray(abs.authors) && abs.authors.length > 0) {
        authorNames = abs.authors.map(author => {
            // Check if author itself is an object before trying to access properties
            if (author && typeof author === 'object') {
                if (author.user && typeof author.user === 'object' && author.user.name) {
                    return author.user.name;
                }
                // Fallback if author.user is not populated or name is directly on author object
                if (typeof author.name === 'string') {
                    return author.name;
                }
            }
            return ''; // Return empty string if author structure is not as expected
        }).filter(name => name).join('; ');
        
        // If after mapping and filtering, authorNames is empty, set back to 'N/A'
        if (!authorNames) {
            authorNames = 'N/A';
        }
      }

      return {
        'Title': abs.title || 'N/A',
        'Author(s)': authorNames,
        'Submission Date': abs.submissionDate ? new Date(abs.submissionDate).toLocaleDateString() : 'N/A',
        'Your Review Status': myReviewStatus,
        'Category': abs.category?.name || 'N/A',
        'Event Name': abs.event?.name || 'N/A'
      };
    });

    const csvString = generateCsvFromArray(csvHeaders, csvData);
    const fileName = `abstract_details_${reviewerId}_${eventId}_${Date.now()}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.status(200).end(csvString);

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
        } else {
          logger.warn(`File not found for abstract ${abstract._id}: ${filePath}. Path from DB: ${abstract.fileUrl}. Skipping.`);
        }
      }
    }
    
    if (filesAdded === 0) {
        archive.abort(); // Abort if no files were actually added to prevent empty zip
        fs.unlink(zipFilePath, () => {}); // Clean up empty zip file
        if (!headersSent) {
            headersSent = true;
            return next(createApiError(404, 'No valid files could be found to include in the ZIP archive.'));
        }
        return; // Stop further processing
    }

    await archive.finalize();

  } catch (error) {
    logger.error(`Error downloading abstract files for reviewer ${req.user?._id}, event ${req.params.eventId}: ${error.message}`);
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