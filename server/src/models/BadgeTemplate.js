const mongoose = require('mongoose');

const badgeTemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  isGlobal: {
    type: Boolean,
    default: false
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
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
  background: {
    type: String,
    default: '#FFFFFF'
  },
  backgroundImage: {
    type: String
  },
  logo: {
    type: String
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  elements: [{
    type: {
      type: String,
      enum: ['text', 'image', 'qrCode', 'shape', 'category'],
      required: true
    },
    id: {
      type: String,
      required: true
    },
    fieldType: {
      type: String,
      enum: ['name', 'organization', 'registrationId', 'category', 'country', 'custom', 'qrCode', 'image', 'shape'],
      required: true
    },
    content: {
      type: String
    },
    position: {
      x: {
        type: Number,
        required: true
      },
      y: {
        type: Number,
        required: true
      }
    },
    size: {
      width: {
        type: Number
      },
      height: {
        type: Number
      }
    },
    style: {
      fontSize: {
        type: Number
      },
      fontFamily: {
        type: String
      },
      fontWeight: {
        type: String
      },
      color: {
        type: String
      },
      backgroundColor: {
        type: String
      },
      borderColor: {
        type: String
      },
      borderWidth: {
        type: Number
      },
      borderRadius: {
        type: Number
      },
      padding: {
        type: Number
      },
      opacity: {
        type: Number,
        min: 0,
        max: 1,
        default: 1
      },
      zIndex: {
        type: Number,
        default: 1
      },
      rotation: {
        type: Number,
        default: 0
      }
    }
  }],
  printSettings: {
    showBorder: {
      type: Boolean,
      default: false
    },
    borderWidth: {
      type: Number,
      default: 1
    },
    borderColor: {
      type: String,
      default: '#CCCCCC'
    },
    padding: {
      type: Number,
      default: 0
    },
    margin: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('BadgeTemplate', badgeTemplateSchema); 