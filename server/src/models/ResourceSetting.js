const mongoose = require('mongoose');

const resourceSettingSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
    index: true
  },
  type: {
    type: String,
    required: true,
    enum: ['food', 'kitBag', 'certificate', 'certificatePrinting'],
    index: true
  },
  settings: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  isEnabled: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Unique compound index on event and type
resourceSettingSchema.index({ event: 1, type: 1 }, { unique: true });

const ResourceSetting = mongoose.model('ResourceSetting', resourceSettingSchema);

module.exports = ResourceSetting; 