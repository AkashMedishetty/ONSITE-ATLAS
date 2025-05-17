const Announcement = require('../models/Announcement');
const Event = require('../models/Event'); // To check if event exists
const asyncHandler = require('../middleware/async');
const { ApiError } = require('../utils/ApiError');
const logger = require('../config/logger');

/**
 * @swagger
 * tags:
 *   name: Announcements
 *   description: Announcement management for events
 */

/**
 * @swagger
 * /events/{eventId}/announcements:
 *   post:
 *     summary: Create a new announcement for an event
 *     tags: [Announcements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the event to associate the announcement with.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 200
 *               content:
 *                 type: string
 *               deadline:
 *                 type: string
 *                 format: date-time
 *               isActive:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Announcement created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Announcement'
 *       400:
 *         description: Bad request (e.g., validation error, event not found).
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Event not found.
 */
exports.createAnnouncement = asyncHandler(async (req, res, next) => {
  const { eventId } = req.params;
  const { title, content, deadline, isActive } = req.body;
  const postedBy = req.user.id; // Assuming req.user.id is populated by auth middleware

  // Check if the event exists
  const event = await Event.findById(eventId);
  if (!event) {
    return next(new ApiError(`Event not found with id of ${eventId}`, 404));
  }

  const announcement = await Announcement.create({
    eventId,
    title,
    content,
    deadline,
    isActive,
    postedBy,
  });

  logger.info(`Announcement created: ${announcement._id} for event ${eventId} by user ${postedBy}`);
  res.status(201).json({
    success: true,
    data: announcement,
  });
});

/**
 * @swagger
 * /events/{eventId}/announcements:
 *   get:
 *     summary: Get all announcements for a specific event
 *     tags: [Announcements]
 *     security:
 *       - bearerAuth: [] # Or public if registrants can see them without login, adjust as needed
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the event.
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status (true or false).
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Maximum number of announcements to return.
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination.
 *     responses:
 *       200:
 *         description: A list of announcements.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 pagination:
 *                   type: object # Add pagination details if implementing
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Announcement'
 *       404:
 *         description: Event not found.
 */
exports.getAnnouncementsByEvent = asyncHandler(async (req, res, next) => {
  const { eventId } = req.params;
  let query = { eventId };

  // Check if the event exists
  const event = await Event.findById(eventId);
  if (!event) {
    return next(new ApiError(`Event not found with id of ${eventId}`, 404));
  }

  // Filtering by isActive status if provided in query
  if (req.query.isActive !== undefined) {
    query.isActive = req.query.isActive === 'true';
  }

  // Basic pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = await Announcement.countDocuments(query);

  const announcements = await Announcement.find(query)
    .populate('postedBy', 'name email') // Populate user details
    .sort({ createdAt: -1 }) // Show newest first
    .skip(startIndex)
    .limit(limit);

  // Pagination result
  const pagination = {};
  if (endIndex < total) {
    pagination.next = {
      page: page + 1,
      limit,
    };
  }
  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit,
    };
  }

  res.status(200).json({
    success: true,
    count: announcements.length,
    total,
    pagination,
    data: announcements,
  });
});

/**
 * @swagger
 * /events/{eventId}/announcements/{announcementId}:
 *   get:
 *     summary: Get a specific announcement by ID for an event.
 *     tags: [Announcements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/eventIdParam'
 *       - $ref: '#/components/parameters/announcementIdParam'
 *     responses:
 *       200:
 *         description: Successfully retrieved announcement.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/AnnouncementResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Event or Announcement not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/NotFound'
 */
exports.getAnnouncementById = asyncHandler(async (req, res, next) => {
  const { eventId, announcementId } = req.params;

  const announcement = await Announcement.findOne({ _id: announcementId, eventId: eventId }).populate('postedBy', 'name email');

  if (!announcement) {
    return next(new ApiError(`Announcement not found with id ${announcementId} for event ${eventId}`, 404));
  }

  res.status(200).json({
    success: true,
    data: announcement,
  });
});

/**
 * @swagger
 * /events/{eventId}/announcements/{announcementId}:
 *   put:
 *     summary: Update a specific announcement.
 *     tags: [Announcements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/eventIdParam'
 *       - $ref: '#/components/parameters/announcementIdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 200
 *               content:
 *                 type: string
 *               deadline:
 *                 type: string
 *                 format: date-time
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Announcement updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/AnnouncementResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: Event or Announcement not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/NotFound'
 */
exports.updateAnnouncement = asyncHandler(async (req, res, next) => {
  const { eventId, announcementId } = req.params;
  const { title, content, deadline, isActive } = req.body;

  let announcement = await Announcement.findOne({ _id: announcementId, eventId: eventId });

  if (!announcement) {
    return next(new ApiError(`Announcement not found with id ${announcementId} for event ${eventId}`, 404));
  }

  // Fields to update
  if (title !== undefined) announcement.title = title;
  if (content !== undefined) announcement.content = content;
  if (deadline !== undefined) announcement.deadline = deadline; // Allow null to clear deadline
  if (isActive !== undefined) announcement.isActive = isActive;
  
  // Optionally: Check if the user updating is the one who posted or has sufficient perms,
  // For now, role-based auth on route handles this.

  announcement = await announcement.save();

  logger.info(`Announcement updated: ${announcement._id} for event ${eventId} by user ${req.user.id}`);
  res.status(200).json({
    success: true,
    data: announcement,
  });
});

/**
 * @swagger
 * /events/{eventId}/announcements/{announcementId}:
 *   delete:
 *     summary: Delete a specific announcement.
 *     tags: [Announcements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/eventIdParam'
 *       - $ref: '#/components/parameters/announcementIdParam'
 *     responses:
 *       200:
 *         description: Announcement deleted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object # Empty object
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: Event or Announcement not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/NotFound'
 */
exports.deleteAnnouncement = asyncHandler(async (req, res, next) => {
  const { eventId, announcementId } = req.params;

  const announcement = await Announcement.findOne({ _id: announcementId, eventId: eventId });

  if (!announcement) {
    return next(new ApiError(`Announcement not found with id ${announcementId} for event ${eventId}`, 404));
  }

  // Optionally: Check if the user deleting is the one who posted or has sufficient perms.
  // For now, role-based auth on route handles this.

  await announcement.deleteOne(); // Changed from remove() for Mongoose v6+

  logger.info(`Announcement deleted: ${announcementId} for event ${eventId} by user ${req.user.id}`);
  res.status(200).json({
    success: true,
    data: {}, // Standard practice to return empty object for successful delete
  });
}); 