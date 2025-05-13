const mongoose = require('mongoose');

const customFieldSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  formType: {
    type: String,
    enum: ['registration', 'abstract', 'workshop', 'category', 'travel'],
    required: true
  },
  name: {
    type: String,
    required: true
  },
  label: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['text', 'textarea', 'number', 'email', 'select', 'checkbox', 'radio', 'date', 'file'],
    required: true
  },
  options: [String],
  placeholder: String,
  defaultValue: mongoose.Schema.Types.Mixed,
  isRequired: {
    type: Boolean,
    default: false
  },
  validations: {
    minLength: Number,
    maxLength: Number,
    pattern: String,
    min: Number,
    max: Number,
    fileTypes: [String],
    maxFileSize: Number
  },
  visibleTo: {
    type: String,
    enum: ['all', 'admin', 'specific-categories'],
    default: 'all'
  },
  categories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  conditionalLogic: {
    isConditional: {
      type: Boolean,
      default: false
    },
    dependsOn: String,
    condition: {
      type: String,
      enum: ['equals', 'not-equals', 'contains', 'not-contains', 'greater-than', 'less-than']
    },
    value: mongoose.Schema.Types.Mixed
  },
  order: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

const CustomField = mongoose.model('CustomField', customFieldSchema);

module.exports = CustomField; 