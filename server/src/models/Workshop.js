const mongoose = require('mongoose');

const workshopSchema = new mongoose.Schema({
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
  startDateTime: {
    type: Date,
    required: true
  },
  endDateTime: {
    type: Date,
    required: true
  },
  venue: {
    type: String,
    trim: true
  },
  capacity: {
    type: Number,
    required: true,
    min: [1, 'Capacity must be at least 1']
  },
  registrations: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Registration'
  }],
  availableFor: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  price: {
    type: Number,
    required: true,
    min: [0, 'Price cannot be negative']
  },
  currency: {
    type: String,
    required: true,
    default: 'USD'
  },
  allowIndependentRegistration: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  instructor: {
    name: String,
    bio: String,
    photo: String
  },
  materials: [{
    name: String,
    fileUrl: String,
    isPublic: {
      type: Boolean,
      default: false
    }
  }],
  attendees: [{
    registration: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Registration'
    },
    checkedIn: {
      type: Boolean,
      default: false
    },
    checkinTime: Date,
    checkedInBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
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

// Update timestamps on save
workshopSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Validate that endDateTime is after startDateTime
workshopSchema.path('endDateTime').validate(function(value) {
  return this.startDateTime < value;
}, 'End date must be after start date');

// Method to check if workshop is at capacity
workshopSchema.methods.isAtCapacity = function() {
  return this.registrations.length >= this.capacity;
};

// Method to check if a category is eligible for this workshop
workshopSchema.methods.isAvailableForCategory = function(categoryId) {
  // If no categories specified, available to all
  if (!this.availableFor || this.availableFor.length === 0) {
    return true;
  }
  
  return this.availableFor.some(catId => 
    catId.toString() === categoryId.toString()
  );
};

// Method to get number of available spots
workshopSchema.methods.getAvailableSpots = function() {
  return Math.max(0, this.capacity - this.registrations.length);
};

// Method to check in an attendee
workshopSchema.methods.checkInAttendee = async function(registrationId, userId) {
  const attendee = this.attendees.find(
    a => a.registration.toString() === registrationId.toString()
  );
  
  if (!attendee) {
    throw new Error('Attendee not registered for this workshop');
  }
  
  if (attendee.checkedIn) {
    throw new Error('Attendee already checked in');
  }
  
  attendee.checkedIn = true;
  attendee.checkinTime = new Date();
  attendee.checkedInBy = userId;
  
  return this.save();
};

const Workshop = mongoose.model('Workshop', workshopSchema);

module.exports = Workshop; 