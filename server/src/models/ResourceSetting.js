const mongoose = require('mongoose');

// New Schema for individual fields on the certificate
const certificateFieldSchema = new mongoose.Schema({
  id: { type: String, required: true }, // Unique ID for the field within its template
  type: { type: String, required: true, default: 'text' }, // e.g., "text"; future: "qrCode", "image"
  label: { type: String, required: true }, // UI label, e.g., "Participant Full Name"
  dataSource: { type: String, required: true }, // e.g., "Registration.personalInfo.firstName Registration.personalInfo.lastName", "Event.name", "Static.Custom Text"
  staticText: { type: String }, // Content if dataSource is "Static.Custom Text"
  position: {
    x: { type: Number, required: true },
    y: { type: Number, required: true }
  },
  style: {
    font: { type: String, default: 'Helvetica' },
    fontSize: { type: Number, default: 12 },
    color: { type: String, default: '#000000' },
    align: { type: String, default: 'left', enum: ['left', 'center', 'right'] },
    fontWeight: { type: String, default: 'normal', enum: ['normal', 'bold'] }, // Mongoose doesn't directly map to PDFKit bold, font name choice is better
    maxWidth: { type: Number }, // Optional, for text wrapping
    rotation: { type: Number, default: 0 } // Added rotation field, in degrees
  },
  sampleValue: { type: String }, // Optional, for UI preview
  isRequired: { type: Boolean, default: false }
}, { _id: false }); // No separate _id for these sub-documents by default

// New Schema for a single certificate template
const certificateTemplateSchema = new mongoose.Schema({
  name: { type: String, required: true }, // User-defined name, e.g., "Participation Certificate"
  // 'type' here is a user-defined category for the template, not a Mongoose schema type.
  // It was previously part of the structure, e.g., "Participation", "Abstract", "Workshop".
  // We can keep it if it helps categorize templates in the UI.
  categoryType: { type: String, required: true }, // e.g., "Participation", "Abstract Presenter"
  templateUrl: { type: String, required: true }, // e.g., "/uploads/certificate_templates/design.pdf"
  templateUnit: { type: String, default: 'pt', enum: ['pt', 'mm', 'cm'] }, // Unit for coordinates in fields
  fields: [certificateFieldSchema] // Array of dynamic fields
}, { timestamps: true }); // Add timestamps if you want to know when a specific template was created/updated

const resourceSettingSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
    index: true
  },
  type: {
    type: String,
    required: true,
    enum: ['food', 'kitBag', 'certificate', 'certificatePrinting'],
    index: true
  },
  settings: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
    // This field will continue to be used for 'food', 'kitBag', and the original 'certificate' type.
    // For 'certificatePrinting', the new 'certificatePrintingTemplates' field below should be used.
  },
  // New field specifically for certificate printing templates
  certificatePrintingTemplates: {
    type: [certificateTemplateSchema],
    default: undefined // This field is only relevant when type is 'certificatePrinting'
  },
  isEnabled: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Unique compound index on event and type
resourceSettingSchema.index({ event: 1, type: 1 }, { unique: true });

const ResourceSetting = mongoose.model('ResourceSetting', resourceSettingSchema);

module.exports = ResourceSetting; 