const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
  certificateId: {
    type: String,
    required: true,
    unique: true
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  registration: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Registration'
  },
  recipientName: {
    type: String,
    required: true
  },
  issueDate: {
    type: Date,
    default: Date.now
  },
  eventName: {
    type: String,
    required: true
  },
  verified: [{
    date: {
      type: Date,
      default: Date.now
    },
    ipAddress: String
  }]
}, { timestamps: true });

// Create text index for searching
certificateSchema.index({ 
  certificateId: 'text', 
  recipientName: 'text',
  eventName: 'text'
});

const Certificate = mongoose.model('Certificate', certificateSchema);

module.exports = Certificate; 