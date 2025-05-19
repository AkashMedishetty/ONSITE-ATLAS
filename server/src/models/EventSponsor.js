const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { toJSON, paginate } = require('./plugins'); // Assuming these plugins are available and relevant
const validator = require('validator');

const eventSponsorSchema = new mongoose.Schema(
  {
    sponsorId: { // SPN-EVENTPREFIX-001
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      index: true,
    },
    companyName: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
    },
    authorizedPerson: {
      type: String,
      required: [true, 'Authorized person is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      validate: [validator.isEmail, 'Please provide a valid email address'],
    },
    displayPhoneNumber: { // New field for display/contact purposes
      type: String,
      trim: true,
      // Not required, as contactPhone (for login) is the primary identifier for login
      // We can add validation for 10 digits later in Joi if needed
    },
    contactPhone: { // This remains for login (hashed password)
      type: String,
      required: [true, 'Contact phone for login is required'],
      trim: true,
    },
    sponsoringAmount: {
      type: Number,
      min: 0,
      default: null,
      optional: true,
    },
    registrantAllotment: {
      type: Number,
      integer: true,
      min: 0,
      default: 0,
    },
    description: {
      type: String,
      trim: true,
      optional: true,
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Add plugins
eventSponsorSchema.plugin(toJSON);
eventSponsorSchema.plugin(paginate);

// Hash contactPhone before saving if it has been modified (for password functionality)
eventSponsorSchema.pre('save', async function (next) {
  if (this.isModified('contactPhone')) {
    this.contactPhone = await bcrypt.hash(this.contactPhone, 10);
  }
  next();
});

// Method to check password (contactPhone)
eventSponsorSchema.methods.isPasswordMatch = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.contactPhone);
};

// Static method to check if sponsorId is taken for a particular event (if needed, otherwise global unique on sponsorId)
// eventSponsorSchema.statics.isSponsorIdTakenForEvent = async function (sponsorId, eventId, excludeSponsorId) {
//   const criteria = { sponsorId, event: eventId };
//   if (excludeSponsorId) {
//     criteria._id = { $ne: excludeSponsorId };
//   }
//   const sponsor = await this.findOne(criteria);
//   return !!sponsor;
// };

const EventSponsor = mongoose.model('EventSponsor', eventSponsorSchema);

module.exports = EventSponsor; 