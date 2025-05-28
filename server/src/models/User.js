const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const { toJSON, paginate } = require('./plugins');
const { roles } = require('../config/roles');

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error('Invalid email');
        }
      },
    },
    password: {
      type: String,
      required: true,
      trim: true,
      private: true,
    },
    role: {
      type: String,
      enum: roles,
      default: 'user',
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    organization: {
      type: String,
      trim: true,
    },
    position: {
      type: String,
      trim: true,
    },
    phoneNumber: {
      type: String,
      trim: true,
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
    },
    profileImage: String,
    bio: {
      type: String,
      trim: true,
    },
    socialLinks: {
      linkedin: String,
      twitter: String,
      website: String,
    },
    managedEvents: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
    }],
    preferences: {
      notifications: {
        email: {
          type: Boolean,
          default: true,
        },
        sms: {
          type: Boolean,
          default: false,
        },
        system: {
          type: Boolean,
          default: true,
        },
      },
      language: {
        type: String,
        default: 'en',
      },
      timezone: {
        type: String,
        default: 'UTC',
      },
    },
    // Event-specific roles for non-admin users
    eventRoles: [{
      eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true,
      },
      role: {
        type: String,
        enum: roles.filter(r => r !== 'admin'), // Only non-admin roles
        required: true,
      },
    }],
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
userSchema.plugin(toJSON);
userSchema.plugin(paginate);

/**
 * Check if email is taken
 * @param {string} email - The user's email
 * @param {ObjectId} [excludeUserId] - The id of the user to be excluded
 * @returns {Promise<boolean>}
 */
userSchema.statics.isEmailTaken = async function (email, excludeUserId) {
  const user = await this.findOne({ email, _id: { $ne: excludeUserId } });
  return !!user;
};

/**
 * Check if password matches the user's password
 * @param {string} password
 * @returns {Promise<boolean>}
 */
userSchema.methods.isPasswordMatch = async function (password) {
  const user = this;
  return bcrypt.compare(password, user.password);
};

userSchema.pre('save', async function (next) {
  const user = this;
  if (user.isModified('password')) {
    user.password = await bcrypt.hash(user.password, 8);
  }
  next();
});

// Add compound unique index for (email, eventId) in eventRoles (for non-admins)
userSchema.index({ email: 1, 'eventRoles.eventId': 1 }, { unique: true, partialFilterExpression: { 'eventRoles.0': { $exists: true } } });

/**
 * @typedef User
 */
const User = mongoose.model('User', userSchema);

module.exports = User; 