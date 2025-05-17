const express = require('express');
const {
  createAnnouncement,
  getAnnouncementsByEvent,
  getAnnouncementById,
  updateAnnouncement,
  deleteAnnouncement,
} = require('../controllers/announcementController');

const router = express.Router({ mergeParams: true }); // mergeParams allows us to access :eventId from parent router

// Import actual authentication and authorization middleware
const { protect, restrict } = require('../middleware/auth.middleware'); // Changed authorize to restrict

/**
 * @swagger
 * /events/{eventId}/announcements:
 *   post:
 *     summary: Create a new announcement for an event.
 *     description: Requires authentication and admin/staff role for the event.
 *     tags: [Announcements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/eventIdParam'
 *     requestBody:
 *       $ref: '#/components/requestBodies/AnnouncementBody' 
 *     responses:
 *       '201':
 *         $ref: '#/components/responses/AnnouncementResponse'
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '403':
 *         $ref: '#/components/responses/Forbidden'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 */
router
  .route('/')
  .post(protect, restrict('admin', 'event_staff'), createAnnouncement) // Changed authorize to restrict
  /**
   * @swagger
   * /events/{eventId}/announcements:
   *   get:
   *     summary: Get all announcements for a specific event.
   *     description: Accessible by authenticated users (admins, staff, and registrants of the event). Filters can be applied.
   *     tags: [Announcements]
   *     security:
   *       - bearerAuth: [] 
   *     parameters:
   *       - $ref: '#/components/parameters/eventIdParam'
   *       - $ref: '#/components/parameters/isActiveQueryParam'
   *       - $ref: '#/components/parameters/limitQueryParam'
   *       - $ref: '#/components/parameters/pageQueryParam'
   *     responses:
   *       '200':
   *         $ref: '#/components/responses/AnnouncementsListResponse'
   *       '401':
   *         $ref: '#/components/responses/Unauthorized'
   *       '404':
   *         $ref: '#/components/responses/NotFound'
   */
  .get(protect, getAnnouncementsByEvent); // Registrants should also be able to see announcements

// Routes for specific announcements
/**
 * @swagger
 * /events/{eventId}/announcements/{announcementId}:
 *   get:
 *     summary: Get a specific announcement by ID for an event.
 *     description: Accessible by authenticated users.
 *     tags: [Announcements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/eventIdParam'
 *       - $ref: '#/components/parameters/announcementIdParam'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/AnnouncementResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   put:
 *     summary: Update a specific announcement.
 *     description: Requires authentication and admin/staff role.
 *     tags: [Announcements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/eventIdParam'
 *       - $ref: '#/components/parameters/announcementIdParam'
 *     requestBody:
 *       $ref: '#/components/requestBodies/AnnouncementBody' 
 *     responses:
 *       200:
 *         $ref: '#/components/responses/AnnouncementResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   delete:
 *     summary: Delete a specific announcement.
 *     description: Requires authentication and admin/staff role.
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
 *                   example: true
 *                 data:
 *                   type: object
 *                   example: {}
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router
  .route('/:announcementId')
  .get(protect, getAnnouncementById)
  .put(protect, restrict('admin', 'event_staff'), updateAnnouncement) // Changed authorize to restrict
  .delete(protect, restrict('admin', 'event_staff'), deleteAnnouncement); // Changed authorize to restrict

module.exports = router;

// --- Swagger Components (can be moved to a central swaggerDef.js or similar) ---
/**
 * @swagger
 * components:
 *   parameters:
 *     eventIdParam:
 *       name: eventId
 *       in: path
 *       required: true
 *       description: ID of the event.
 *       schema:
 *         type: string
 *     announcementIdParam:
 *       name: announcementId
 *       in: path
 *       required: true
 *       description: ID of the announcement.
 *       schema:
 *         type: string
 *     isActiveQueryParam:
 *       name: isActive
 *       in: query
 *       description: Filter by active status.
 *       schema:
 *         type: boolean
 *     limitQueryParam:
 *       name: limit
 *       in: query
 *       description: Maximum number of items to return.
 *       schema:
 *         type: integer
 *         default: 10
 *     pageQueryParam:
 *       name: page
 *       in: query
 *       description: Page number for pagination.
 *       schema:
 *         type: integer
 *         default: 1
 *
 *   requestBodies:
 *     AnnouncementBody:
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
 *                 example: "New Keynote Speaker Added"
 *               content:
 *                 type: string
 *                 example: "We are thrilled to announce that Dr. Jane Doe will be a keynote speaker!"
 *               deadline:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-08-01T00:00:00Z"
 *               isActive:
 *                 type: boolean
 *                 default: true
 *                 example: true
 *
 *   responses:
 *     AnnouncementResponse:
 *       description: Successfully created or retrieved an announcement.
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               success:
 *                 type: boolean
 *               data:
 *                 $ref: '#/components/schemas/Announcement'
 *     AnnouncementsListResponse:
 *       description: A list of announcements.
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               success:
 *                 type: boolean
 *               count:
 *                 type: integer
 *               total:
 *                 type: integer
 *               pagination: 
 *                 type: object # Define further if using
 *               data:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/Announcement'
 *     BadRequest:
 *       description: Invalid request payload or parameters.
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ErrorResponse' 
 *     Unauthorized:
 *       description: Authentication failed or not provided.
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ErrorResponse'
 *     Forbidden:
 *       description: User does not have permission to perform this action.
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ErrorResponse'
 *     NotFound:
 *       description: Resource not found.
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ErrorResponse'
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           example: "Error message detailing the issue."
 */ 