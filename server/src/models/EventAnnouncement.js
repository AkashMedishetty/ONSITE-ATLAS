const mongoose = require('mongoose');

const eventAnnouncementSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  publishedAt: Date,
  categories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save hook to update updatedAt timestamp
eventAnnouncementSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Set publishedAt when an announcement is published
  if (this.isPublished && !this.publishedAt) {
    this.publishedAt = Date.now();
  }
  
  next();
});

// Create indexes
eventAnnouncementSchema.index({ event: 1, isPublished: 1 });
eventAnnouncementSchema.index({ event: 1, categories: 1 });

// Virtual for formatted published date
eventAnnouncementSchema.virtual('formattedPublishDate').get(function() {
  if (!this.publishedAt) return '';
  return new Date(this.publishedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

// Method to publish announcement
eventAnnouncementSchema.methods.publish = async function() {
  this.isPublished = true;
  this.publishedAt = Date.now();
  await this.save();
  return this;
};

// Method to unpublish announcement
eventAnnouncementSchema.methods.unpublish = async function() {
  this.isPublished = false;
  await this.save();
  return this;
};

// Static method to get published announcements for an event
eventAnnouncementSchema.statics.getPublishedForEvent = function(eventId, categoryIds = []) {
  const query = { 
    event: eventId, 
    isPublished: true 
  };
  
  if (categoryIds.length > 0) {
    query.categories = { $in: categoryIds };
  }
  
  return this.find(query)
    .sort({ publishedAt: -1 })
    .populate('createdBy', 'firstName lastName')
    .populate('categories', 'name color');
};

const EventAnnouncement = mongoose.model('EventAnnouncement', eventAnnouncementSchema);

module.exports = EventAnnouncement; 