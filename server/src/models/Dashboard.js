const mongoose = require('mongoose');

const dashboardSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  layout: [{
    widgetId: String,
    x: Number,
    y: Number,
    w: Number,
    h: Number,
    config: Object
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Add a compound index to ensure uniqueness for event/user combination
dashboardSchema.index({ event: 1, user: 1 }, { unique: true });

const Dashboard = mongoose.model('Dashboard', dashboardSchema);

module.exports = Dashboard; 