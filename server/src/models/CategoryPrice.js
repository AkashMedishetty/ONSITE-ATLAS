const mongoose = require('mongoose');

const categoryPriceSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  pricingTier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PricingTier',
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    required: true,
    default: 'USD'
  },
  description: String,
  isActive: {
    type: Boolean,
    default: true
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

// Ensure price is non-negative
categoryPriceSchema.path('price').validate(function(value) {
  return value >= 0;
}, 'Price cannot be negative');

// Middleware to update timestamps on save
categoryPriceSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Ensure uniqueness of category + pricingTier combination for an event
categoryPriceSchema.index(
  { event: 1, category: 1, pricingTier: 1 },
  { unique: true }
);

// Static method to find current price for a category
categoryPriceSchema.statics.getCurrentPriceForCategory = async function(eventId, categoryId) {
  const PricingTier = mongoose.model('PricingTier');
  
  // Find the current active pricing tier for the event
  const currentTier = await PricingTier.getCurrentTier(eventId);
  
  if (!currentTier) {
    return null;
  }
  
  // Find the price for this category in the current tier
  return this.findOne({
    event: eventId,
    category: categoryId,
    pricingTier: currentTier._id,
    isActive: true
  });
};

const CategoryPrice = mongoose.model('CategoryPrice', categoryPriceSchema);

module.exports = CategoryPrice; 