const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const eventClientSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
    index: true
  },
  clientId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  plainPassword: {
    type: String,
    required: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active',
    required: true
  }
}, {
  timestamps: true
});

eventClientSchema.statics.generateNextClientId = async function(eventId, eventPrefix) {
  const count = await this.countDocuments({ event: eventId });
  const nextNum = (count + 1).toString().padStart(3, '0');
  return `OC-${eventPrefix}-${nextNum}`;
};

eventClientSchema.pre('save', async function(next) {
  if (this.isModified('plainPassword')) {
    this.passwordHash = await bcrypt.hash(this.plainPassword, 10);
  }
  next();
});

const EventClient = mongoose.model('EventClient', eventClientSchema);
module.exports = EventClient; 