const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
  registrationId: {
    type: String,
    required: true,
    trim: true
  },
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
  personalInfo: {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true
    },
    phone: {
      type: String,
      trim: true
    },
    organization: {
      type: String,
      trim: true
    },
    designation: {
      type: String,
      trim: true
    },
    country: {
      type: String,
      trim: true
    }
  },
  customFields: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  qrCode: {
    type: String
  },
  badgePrinted: {
    type: Boolean,
    default: false
  },
  printedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  printedAt: {
    type: Date
  },
  checkIn: {
    isCheckedIn: {
      type: Boolean,
      default: false
    },
    checkedInAt: {
      type: Date
    },
    checkedInBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  resourceUsage: {
    meals: [{
      meal: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event.meals'
      },
      usedAt: {
        type: Date
      },
      issuedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      isVoid: {
        type: Boolean,
        default: false
      },
      voidedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      voidedAt: {
        type: Date
      }
    }],
    kitItems: [{
      item: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event.kitItems'
      },
      issuedAt: {
        type: Date
      },
      issuedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      isVoid: {
        type: Boolean,
        default: false
      },
      voidedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      voidedAt: {
        type: Date
      }
    }],
    certificates: [{
      certificate: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event.certificateTypes'
      },
      issuedAt: {
        type: Date
      },
      issuedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      isVoid: {
        type: Boolean,
        default: false
      },
      voidedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      voidedAt: {
        type: Date
      }
    }]
  },
  notes: {
    type: String
  },
  registrationType: {
    type: String,
    enum: ['pre-registered', 'onsite', 'imported'],
    default: 'pre-registered'
  },
  registeredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['active', 'cancelled', 'no-show'],
    default: 'active'
  },
  sponsoredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EventSponsor',
    required: false
  }
}, {
  timestamps: true
});

// Compound Unique Index for Event + RegistrationId (ensures registrationId is unique per event)
registrationSchema.index({ event: 1, registrationId: 1 }, { unique: true });

// RE-ADD Compound Unique Index for Event + Category + Name (ensures same person isn't registered multiple times in same category/event)
registrationSchema.index(
  {
    event: 1, 
    category: 1, 
    'personalInfo.firstName': 1, 
    'personalInfo.lastName': 1
  }, 
  {
    unique: true,
    background: true,
    // Optional: Add a partial filter index if needed (e.g., only enforce for 'active' status)
    // partialFilterExpression: { status: 'active' } 
  }
);

// Generate QR code before saving
registrationSchema.pre('save', function(next) {
  // If QR code already exists or this is not a new document, skip
  if (this.qrCode || !this.isNew) return next();
  
  // Simple QR code generation (in real implementation, use a QR code library)
  this.qrCode = `https://api.onsite-atlas.com/qr/${this.registrationId}`;
  next();
});

const Registration = mongoose.model('Registration', registrationSchema);

module.exports = Registration; 