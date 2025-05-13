const mongoose = require('mongoose');

const pricingTierSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  name: {
    type: String,
    required: true,
    enum: ['early-bird', 'normal', 'onsite']
  },
  displayName: {
    type: String,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: false
  },
  order: {
    type: Number,
    default: 0
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

// Middleware to update timestamps on save
pricingTierSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Method to check if a tier is currently active based on the current date
pricingTierSchema.methods.isCurrentlyActive = function() {
  const now = new Date();
  return now >= this.startDate && now <= this.endDate;
};

// Static method to find the current active tier for an event
pricingTierSchema.statics.getCurrentTier = async function(eventId) {
  const now = new Date();
  return this.findOne({
    event: eventId,
    startDate: { $lte: now },
    endDate: { $gte: now },
    isActive: true
  }).sort({ order: 1 });
};

// Make sure only one tier is marked as active at a time for specific dates
pricingTierSchema.pre('save', async function(next) {
  if (this.isActive && this.isModified('isActive')) {
    // Find overlapping tiers
    const overlappingTiers = await this.constructor.find({
      _id: { $ne: this._id },
      event: this.event,
      isActive: true,
      $or: [
        // Other tier starts during this tier
        { startDate: { $lte: this.endDate, $gte: this.startDate } },
        // Other tier ends during this tier
        { endDate: { $lte: this.endDate, $gte: this.startDate } },
        // Other tier completely contains this tier
        { startDate: { $lte: this.startDate }, endDate: { $gte: this.endDate } }
      ]
    });

    if (overlappingTiers.length > 0) {
      throw new Error('Date ranges of active pricing tiers cannot overlap');
    }
  }
  next();
});

const PricingTier = mongoose.model('PricingTier', pricingTierSchema);

module.exports = PricingTier; 