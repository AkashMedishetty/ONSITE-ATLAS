const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const registrantAccountSchema = new mongoose.Schema({
  registration: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Registration',
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  passwordHash: {
    type: String,
    required: true,
    select: false
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  verificationExpires: Date,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  lastLogin: Date,
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

// Pre-save hook to update updatedAt timestamp
registrantAccountSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Method to check if password matches
registrantAccountSchema.methods.checkPassword = async function(password) {
  return await bcrypt.compare(password, this.passwordHash);
};

// Static method to register a new registrant account
registrantAccountSchema.statics.register = async function(registrationId, email, password) {
  const passwordHash = await bcrypt.hash(password, 12);
  const verificationToken = crypto.randomBytes(32).toString('hex');
  const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  const registrantAccount = new this({
    registration: registrationId,
    email,
    passwordHash,
    verificationToken,
    verificationExpires
  });

  await registrantAccount.save();
  return registrantAccount;
};

// Static method to find account by verification token
registrantAccountSchema.statics.findByVerificationToken = function(token) {
  return this.findOne({
    verificationToken: token,
    verificationExpires: { $gt: Date.now() }
  });
};

// Static method to find account by reset token
registrantAccountSchema.statics.findByResetToken = function(token) {
  return this.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() }
  });
};

// Method to generate password reset token
registrantAccountSchema.methods.generateResetToken = async function() {
  this.resetPasswordToken = crypto.randomBytes(32).toString('hex');
  this.resetPasswordExpires = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour
  await this.save();
  return this.resetPasswordToken;
};

// Method to reset password
registrantAccountSchema.methods.resetPassword = async function(password) {
  this.passwordHash = await bcrypt.hash(password, 12);
  this.resetPasswordToken = undefined;
  this.resetPasswordExpires = undefined;
  await this.save();
};

const RegistrantAccount = mongoose.model('RegistrantAccount', registrantAccountSchema);

module.exports = RegistrantAccount; 