const mongoose = require('mongoose');

const eventResourceSchema = new mongoose.Schema({
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
  description: {
    type: String,
    trim: true
  },
  fileUrl: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  isPublic: {
    type: Boolean,
    default: false
  },
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
eventResourceSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for efficient queries
eventResourceSchema.index({ event: 1, isPublic: 1 });
eventResourceSchema.index({ event: 1, categories: 1 });

// Virtual for formatted file size
eventResourceSchema.virtual('formattedFileSize').get(function() {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (this.fileSize === 0) return '0 Byte';
  const i = parseInt(Math.floor(Math.log(this.fileSize) / Math.log(1024)));
  return Math.round(this.fileSize / Math.pow(1024, i), 2) + ' ' + sizes[i];
});

// Static method to get public resources for an event
eventResourceSchema.statics.getPublicForEvent = function(eventId, categoryIds = []) {
  const query = { 
    event: eventId, 
    isPublic: true 
  };
  
  if (categoryIds.length > 0) {
    query.categories = { $in: categoryIds };
  }
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .populate('createdBy', 'firstName lastName')
    .populate('categories', 'name color');
};

// Static method to get resources for specific categories
eventResourceSchema.statics.getForCategories = function(eventId, categoryIds) {
  return this.find({
    event: eventId,
    categories: { $in: categoryIds }
  })
    .sort({ createdAt: -1 })
    .populate('createdBy', 'firstName lastName')
    .populate('categories', 'name color');
};

// Method to make resource public
eventResourceSchema.methods.makePublic = async function() {
  this.isPublic = true;
  await this.save();
  return this;
};

// Method to make resource private
eventResourceSchema.methods.makePrivate = async function() {
  this.isPublic = false;
  await this.save();
  return this;
};

const EventResource = mongoose.model('EventResource', eventResourceSchema);

module.exports = EventResource; 