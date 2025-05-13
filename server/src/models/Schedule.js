const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Session Schema (for individual sessions within a day)
const SessionSchema = new Schema({
  id: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  time: {
    type: String,
    required: true
  },
  location: {
    type: String
  },
  type: {
    type: String,
    enum: ['registration', 'plenary', 'keynote', 'session', 'break', 'workshop', 'poster', 'panel', 'social', 'roundtable', 'ceremony'],
    default: 'session'
  },
  speakers: [{
    type: String
  }],
  chair: {
    type: String
  },
  panelists: [{
    type: String
  }],
  facilitator: {
    type: String
  },
  isHighlighted: {
    type: Boolean,
    default: false
  }
});

// Day Schema (for each day of the event)
const DaySchema = new Schema({
  id: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  sessions: [SessionSchema]
});

// Main Schedule Schema
const ScheduleSchema = new Schema({
  eventId: {
    type: Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  eventName: {
    type: String,
    required: true
  },
  days: [DaySchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Auto-update the updatedAt field before saving
ScheduleSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Schedule', ScheduleSchema); 
