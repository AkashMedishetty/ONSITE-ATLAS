const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  color: {
    type: String,
    default: '#3B82F6' // Default blue color
  },
  badgeTemplate: {
    type: String
  },
  permissions: {
    meals: {
      type: Boolean,
      default: true
    },
    kitItems: {
      type: Boolean,
      default: true
    },
    certificates: {
      type: Boolean,
      default: true
    },
    abstractSubmission: {
      type: Boolean,
      default: false
    }
  },
  mealEntitlements: [{
    mealId: {
      type: mongoose.Schema.Types.ObjectId
    },
    entitled: {
      type: Boolean,
      default: true
    }
  }],
  kitItemEntitlements: [{
    itemId: {
      type: mongoose.Schema.Types.ObjectId
    },
    entitled: {
      type: Boolean,
      default: true
    }
  }],
  certificateEntitlements: [{
    certificateId: {
      type: mongoose.Schema.Types.ObjectId
    },
    entitled: {
      type: Boolean,
      default: true
    }
  }],
  // Extended fields for workshops, abstracts, and portal features
  workshopPermissions: {
    canRegister: {
      type: Boolean,
      default: false
    },
    workshopIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workshop'
    }]
  },
  abstractPermissions: {
    canSubmit: {
      type: Boolean,
      default: false
    },
    allowedTypes: [String],
    maxSubmissions: Number
  },
  additionalDataFields: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CustomField'
  }],
  portalFeatures: {
    canViewAgenda: {
      type: Boolean,
      default: true
    },
    canDownloadMaterials: {
      type: Boolean,
      default: true
    },
    canViewCertificates: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true
});

// Virtual for registration count in this category
categorySchema.virtual('registrationCount', {
  ref: 'Registration',
  localField: '_id',
  foreignField: 'category',
  count: true
});

const Category = mongoose.model('Category', categorySchema);

module.exports = Category; 