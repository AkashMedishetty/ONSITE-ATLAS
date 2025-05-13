const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Event name is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  venue: {
    name: {
      type: String,
      required: [true, 'Venue name is required']
    },
    address: {
      type: String,
      required: [true, 'Venue address is required']
    },
    city: {
      type: String,
      required: [true, 'City is required']
    },
    state: {
      type: String
    },
    country: {
      type: String,
      required: [true, 'Country is required']
    },
    zipCode: {
      type: String
    }
  },
  logo: {
    type: String
  },
  bannerImage: {
    type: String
  },
  registrationSettings: {
    idPrefix: {
      type: String,
      default: 'REG'
    },
    startNumber: {
      type: Number,
      default: 1
    },
    isOpen: {
      type: Boolean,
      default: true
    },
    allowOnsite: {
      type: Boolean,
      default: true
    },
    customFields: [{
      name: {
        type: String,
        required: true
      },
      type: {
        type: String,
        enum: ['text', 'number', 'date', 'select', 'checkbox'],
        required: true
      },
      options: [String],
      isRequired: {
        type: Boolean,
        default: false
      }
    }]
  },
  categories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  meals: [{
    name: {
      type: String,
      required: true
    },
    date: {
      type: Date,
      required: true
    },
    startTime: {
      type: String,
      required: true
    },
    endTime: {
      type: String,
      required: true
    }
  }],
  kitItems: [{
    name: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      default: 0
    }
  }],
  certificateTypes: [{
    name: {
      type: String,
      required: true
    },
    template: {
      type: String
    }
  }],
  abstractSettings: {
    enabled: {
      type: Boolean,
      default: false
    },
    isOpen: {
      type: Boolean,
      default: false
    },
    deadline: {
      type: Date
    },
    maxLength: {
      type: Number,
      default: 500
    },
    allowEditing: {
      type: Boolean,
      default: true
    },
    guidelines: {
      type: String,
      default: ''
    },
    categories: [{
      name: {
        type: String,
        required: true
      },
      description: {
        type: String
      },
      subTopics: [{
        name: {
          type: String,
          required: true
        },
        description: {
          type: String
        }
      }]
    }],
    notifyOnSubmission: {
      type: Boolean,
      default: false
    },
    allowFiles: {
      type: Boolean,
      default: false
    },
    maxFileSize: {
      type: Number,
      default: 5
    }
  },
  foodSettings: {
    enabled: {
      type: Boolean,
      default: true
    },
    meals: [{
      name: {
        type: String,
        default: 'Breakfast'
      },
      enabled: {
        type: Boolean,
        default: true
      }
    }],
    days: [{
      date: {
        type: Date,
        default: Date.now
      },
      enabled: {
        type: Boolean,
        default: true
      }
    }]
  },
  kitSettings: {
    enabled: {
      type: Boolean,
      default: true
    },
    items: [{
      name: {
        type: String,
        default: 'Welcome Kit'
      },
      enabled: {
        type: Boolean,
        default: true
      }
    }]
  },
  certificateSettings: {
    enabled: {
      type: Boolean,
      default: true
    },
    types: [{
      name: {
        type: String,
        default: 'Participation Certificate'
      },
      enabled: {
        type: Boolean,
        default: true
      }
    }]
  },
  badgeSettings: {
    orientation: {
      type: String,
      enum: ['portrait', 'landscape'],
      default: 'portrait'
    },
    size: {
      width: {
        type: Number,
        default: 3.5
      },
      height: {
        type: Number,
        default: 5
      }
    },
    unit: {
      type: String,
      enum: ['in', 'cm', 'mm'],
      default: 'in'
    },
    showLogo: {
      type: Boolean,
      default: true
    },
    logoPosition: {
      type: String,
      default: 'top'
    },
    showQR: {
      type: Boolean,
      default: true
    },
    qrPosition: {
      type: String,
      default: 'bottom'
    },
    fields: {
      name: {
        type: Boolean,
        default: true
      },
      organization: {
        type: Boolean,
        default: true
      },
      registrationId: {
        type: Boolean,
        default: true
      },
      category: {
        type: Boolean,
        default: true
      },
      country: {
        type: Boolean,
        default: true
      },
      qrCode: {
        type: Boolean,
        default: true
      }
    },
    fieldConfig: {
      name: {
        fontSize: {
          type: Number,
          default: 18
        },
        fontWeight: {
          type: String,
          default: 'bold'
        },
        position: {
          top: {
            type: Number,
            default: 40
          },
          left: {
            type: Number,
            default: 50
          }
        }
      },
      organization: {
        fontSize: {
          type: Number,
          default: 14
        },
        fontWeight: {
          type: String,
          default: 'normal'
        },
        position: {
          top: {
            type: Number,
            default: 65
          },
          left: {
            type: Number,
            default: 50
          }
        }
      },
      registrationId: {
        fontSize: {
          type: Number,
          default: 12
        },
        fontWeight: {
          type: String,
          default: 'normal'
        },
        position: {
          top: {
            type: Number,
            default: 85
          },
          left: {
            type: Number,
            default: 50
          }
        }
      },
      category: {
        fontSize: {
          type: Number,
          default: 12
        },
        fontWeight: {
          type: String,
          default: 'normal'
        },
        position: {
          top: {
            type: Number,
            default: 105
          },
          left: {
            type: Number,
            default: 50
          }
        }
      },
      country: {
        fontSize: {
          type: Number,
          default: 12
        },
        fontWeight: {
          type: String,
          default: 'normal'
        },
        position: {
          top: {
            type: Number,
            default: 240
          },
          left: {
            type: Number,
            default: 50
          }
        }
      },
      qrCode: {
        size: {
          type: Number,
          default: 100
        },
        position: {
          top: {
            type: Number,
            default: 135
          },
          left: {
            type: Number,
            default: 100
          }
        }
      }
    },
    colors: {
      background: {
        type: String,
        default: '#FFFFFF'
      },
      text: {
        type: String,
        default: '#000000'
      },
      accent: {
        type: String,
        default: '#3B82F6'
      },
      borderColor: {
        type: String,
        default: '#CCCCCC'
      }
    },
    background: {
      type: String
    },
    logo: {
      type: String
    }
  },
  emailSettings: {
    enabled: {
      type: Boolean,
      default: false
    },
    senderName: {
      type: String,
      default: 'Event Organizer'
    },
    senderEmail: {
      type: String,
      default: 'noreply@example.com'
    },
    replyToEmail: {
      type: String
    },
    smtpHost: {
      type: String
    },
    smtpPort: {
      type: Number,
      default: 587
    },
    smtpUser: {
      type: String
    },
    smtpPassword: {
      type: String
    },
    smtpSecure: {
      type: Boolean,
      default: false
    },
    certificateTemplate: {
      type: String
    },
    scientificBrochure: {
      type: String
    },
    automaticEmails: {
      registrationConfirmation: {
        type: Boolean,
        default: true
      },
      eventReminder: {
        type: Boolean,
        default: false
      },
      certificateDelivery: {
        type: Boolean,
        default: false
      },
      workshopInfo: {
        type: Boolean,
        default: false
      },
      scientificBrochure: {
        type: Boolean,
        default: false
      }
    },
    templates: {
      registration: {
        subject: {
          type: String,
          default: 'Registration Confirmation - {{eventName}}'
        },
        body: {
          type: String,
          default: 'Dear {{firstName}},\n\nThank you for registering for {{eventName}}.\n\nYour registration ID is: {{registrationId}}\n\nPlease keep this email for your reference. You can use the QR code below at the event for check-in:\n\n[QR_CODE]\n\nEvent Details:\nDate: {{eventDate}}\nVenue: {{eventVenue}}\n\nIf you have any questions, please contact us.\n\nRegards,\nThe Organizing Team'
        }
      },
      reminder: {
        subject: {
          type: String,
          default: 'Event Reminder - {{eventName}}'
        },
        body: {
          type: String,
          default: 'Dear {{firstName}},\n\nThis is a friendly reminder that {{eventName}} is happening soon.\n\nDate: {{eventDate}}\nVenue: {{eventVenue}}\n\nDon\'t forget to bring your registration QR code for quick check-in.\n\nWe look forward to seeing you there!\n\nRegards,\nThe Organizing Team'
        }
      },
      certificate: {
        subject: {
          type: String,
          default: 'Your Certificate for {{eventName}}'
        },
        body: {
          type: String,
          default: 'Dear {{firstName}},\n\nThank you for participating in {{eventName}}.\n\nYour certificate of participation is attached to this email.\n\nWe hope you enjoyed the event and look forward to seeing you again!\n\nRegards,\nThe Organizing Team'
        }
      },
      workshop: {
        subject: {
          type: String,
          default: 'Workshop Information - {{eventName}}'
        },
        body: {
          type: String,
          default: 'Dear {{firstName}},\n\nThank you for registering for the workshop at {{eventName}}.\n\nWorkshop Details:\nTitle: {{workshopTitle}}\nDate: {{workshopDate}}\nTime: {{workshopTime}}\nLocation: {{workshopLocation}}\n\nPlease arrive 15 minutes early for registration.\n\nRegards,\nThe Organizing Team'
        }
      },
      scientificBrochure: {
        subject: {
          type: String,
          default: 'Scientific Brochure - {{eventName}}'
        },
        body: {
          type: String,
          default: 'Dear {{firstName}},\n\nPlease find attached the scientific brochure for {{eventName}}.\n\nThe brochure contains detailed information about the sessions, speakers, and scientific program.\n\nWe look forward to your participation!\n\nRegards,\nThe Organizing Team'
        }
      },
      custom: {
        subject: {
          type: String,
          default: 'Important Update - {{eventName}}'
        },
        body: {
          type: String,
          default: 'Dear {{firstName}},\n\nWe wanted to share an important update regarding {{eventName}}.\n\n[Your custom message here]\n\nIf you have any questions, please don\'t hesitate to contact us.\n\nRegards,\nThe Organizing Team'
        }
      }
    }
  },
  emailHistory: [{
    subject: {
      type: String,
      required: true
    },
    date: {
      type: Date,
      default: Date.now
    },
    recipients: {
      type: Number,
      default: 0
    },
    successCount: {
      type: Number,
      default: 0
    },
    failedCount: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'completed'
    }
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  pricingSettings: {
    currency: {
      type: String,
      default: 'USD'
    },
    taxPercentage: {
      type: Number,
      default: 0
    },
    displayTaxSeparately: {
      type: Boolean,
      default: false
    },
    allowPartialPayments: {
      type: Boolean,
      default: false
    },
    autoSwitchPricingTiers: {
      type: Boolean,
      default: true
    },
    discountCodes: [{
      code: {
        type: String,
        required: true
      },
      discountType: {
        type: String,
        enum: ['percentage', 'fixed'],
        default: 'percentage'
      },
      discountValue: {
        type: Number,
        required: true
      },
      maxUses: {
        type: Number,
        default: null
      },
      usesCount: {
        type: Number,
        default: 0
      },
      validFrom: Date,
      validUntil: Date,
      isActive: {
        type: Boolean,
        default: true
      },
      appliesToWorkshops: {
        type: Boolean,
        default: false
      },
      limitedToCategories: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
      }]
    }]
  }
}, {
  timestamps: true
});

// Virtual for registration count
eventSchema.virtual('registrationCount', {
  ref: 'Registration',
  localField: '_id',
  foreignField: 'event',
  count: true
});

// Method to check if event is active
eventSchema.methods.isActive = function() {
  const now = new Date();
  return now >= this.startDate && now <= this.endDate;
};

// Method to check if event is upcoming
eventSchema.methods.isUpcoming = function() {
  const now = new Date();
  return now < this.startDate;
};

// Method to check if event is past
eventSchema.methods.isPast = function() {
  const now = new Date();
  return now > this.endDate;
};

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;