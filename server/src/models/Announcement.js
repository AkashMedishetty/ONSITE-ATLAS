const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     Announcement:
 *       type: object
 *       required:
 *         - eventId
 *         - title
 *         - content
 *         - postedBy
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated id of the announcement
 *         eventId:
 *           type: string
 *           description: The ID of the event this announcement belongs to.
 *         title:
 *           type: string
 *           description: The title of the announcement.
 *         content:
 *           type: string
 *           description: The main content/body of the announcement.
 *         deadline:
 *           type: string
 *           format: date-time
 *           description: Optional deadline or expiry date for the announcement.
 *         isActive:
 *           type: boolean
 *           default: true
 *           description: Whether the announcement is currently active and visible to registrants.
 *         postedBy:
 *           type: string
 *           description: The ID of the admin/staff user who posted the announcement.
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date and time the announcement was created.
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The date and time the announcement was last updated.
 *       example:
 *         _id: 60d0fe4f5311236168a109ca
 *         eventId: 60d0fe4f5311236168a109cb
 *         title: "Abstract Submission Deadline Extended!"
 *         content: "The deadline for abstract submissions has been extended by one week. The new deadline is July 15th."
 *         deadline: "2024-07-15T23:59:59.000Z"
 *         isActive: true
 *         postedBy: "60d0fe4f5311236168a109cc"
 *         createdAt: "2024-07-01T10:00:00.000Z"
 *         updatedAt: "2024-07-01T10:00:00.000Z"
 */
const announcementSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event ID is required for an announcement.'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Announcement title is required.'],
      trim: true,
      maxlength: [200, 'Announcement title cannot be more than 200 characters.'],
    },
    content: {
      type: String,
      required: [true, 'Announcement content is required.'],
    },
    deadline: {
      type: Date,
      default: null, 
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Assuming your admin/staff user model is named 'User'
      required: [true, 'The user who posted the announcement is required.'],
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Index for querying active announcements by event, sorted by creation date
announcementSchema.index({ eventId: 1, isActive: 1, createdAt: -1 });

const Announcement = mongoose.model('Announcement', announcementSchema);

module.exports = Announcement; 