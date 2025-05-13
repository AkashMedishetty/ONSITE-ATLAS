const mongoose = require('mongoose');

const importJobErrorDetailSchema = new mongoose.Schema({
  rowNumber: {
    type: Number,
  },
  message: {
    type: String,
    required: true,
  },
  rowData: { // To store the problematic row's data for inspection/download
    type: mongoose.Schema.Types.Mixed,
  }
}, { _id: false });

const importJobSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      index: true,
    },
    originalFileName: {
      type: String,
      trim: true,
    },
    totalRecords: {
      type: Number,
      required: true,
      min: 0,
    },
    processedRecords: { // Records for which processing has been attempted (success or fail)
      type: Number,
      default: 0,
      min: 0,
    },
    successfulRecords: {
      type: Number,
      default: 0,
      min: 0,
    },
    failedRecords: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'partial_completion', 'cancelled'],
      default: 'pending',
      required: true,
      index: true,
    },
    errorDetails: [importJobErrorDetailSchema], // Specific errors per row
    generalErrorMessage: { // Overall error message if the job itself fails catastrophically
      type: String,
      trim: true,
    },
    jobStartedAt: {
      type: Date,
    },
    jobCompletedAt: {
      type: Date,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Assuming you have a User model
      required: true,
    },
    // Optional: To store the path to an error report file (e.g., CSV of failed rows)
    // errorReportFileUrl: {
    //   type: String,
    //   trim: true,
    // }
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for progress percentage
importJobSchema.virtual('progressPercent').get(function () {
  if (this.totalRecords === 0) {
    return 0;
  }
  return Math.round((this.processedRecords / this.totalRecords) * 100);
});

const ImportJob = mongoose.model('ImportJob', importJobSchema);

module.exports = ImportJob; 