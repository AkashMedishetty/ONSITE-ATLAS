const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: String,
  type: {
    type: String,
    enum: ['registration', 'financial', 'workshop', 'abstract', 'sponsorship', 'custom'],
    required: true
  },
  config: {
    type: Object,
    required: true
  },
  isScheduled: {
    type: Boolean,
    default: false
  },
  scheduleConfig: {
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly']
    },
    recipients: [String],
    nextRunDate: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

const Report = mongoose.model('Report', reportSchema);

module.exports = Report; 