const { User, Abstract } = require('../models');
const { createApiError } = require('../middleware/error');
const logger = require('../utils/logger');

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

module.exports = {
  getUsers,
  createUser,
  getUserById,
  updateUser,
  deleteUser,
  getAssignedAbstractsForReviewer,
  getUsersForEvent
}; 