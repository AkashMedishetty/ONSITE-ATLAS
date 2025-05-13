const mongoose = require('mongoose');

const analyticsDataCacheSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  dataType: {
    type: String,
    enum: ['registration', 'financial', 'workshop', 'abstract', 'sponsorship'],
    required: true
  },
  data: {
    type: Object,
    required: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Add a compound index to ensure uniqueness for event/dataType combination
analyticsDataCacheSchema.index({ event: 1, dataType: 1 }, { unique: true });

const AnalyticsDataCache = mongoose.model('AnalyticsDataCache', analyticsDataCacheSchema);

module.exports = AnalyticsDataCache; 