const mongoose = require('mongoose');

const reviewCommentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  comment: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const abstractSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  registration: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Registration',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Please provide a title for your abstract'],
    trim: true,
    maxlength: [200, 'Abstract title cannot exceed 200 characters']
  },
  authors: {
    type: String,
    required: [true, 'Please provide the authors of the abstract'],
    trim: true
  },
  authorAffiliations: {
    type: String,
    trim: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category', 
    required: false
  },
  topic: {
    type: String,
    required: [true, 'Please select a topic for your abstract'],
    trim: true
  },
  subTopic: {
    type: String,
    trim: true
  },
  content: {
    type: String,
    required: [true, 'Please provide the content of your abstract'],
    trim: true,
    maxlength: [5000, 'Abstract content cannot exceed 5000 characters']
  },
  wordCount: {
    type: Number,
    default: 0
  },
  fileUrl: {
    type: String,
    required: false
  },
  fileName: {
    type: String,
    required: false
  },
  fileSize: {
    type: Number,
    required: false
  },
  fileType: {
    type: String,
    required: false
  },
  submissionDate: {
    type: Date,
    default: Date.now
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['draft', 'submitted', 'under-review', 'approved', 'rejected', 'revision-requested', 'pending', 'accepted', 'revised-pending-review'],
    default: 'submitted'
  },
  reviewComments: [reviewCommentSchema],
  // New fields for abstract submission workflow
  submissionPath: {
    type: String,
    enum: ['post-registration', 'pre-registration'],
    default: 'post-registration'
  },
  submissionType: {
    type: String,
    enum: ['oral', 'poster', 'workshop', 'other'],
    default: 'poster'
  },
  abstractNumber: String,
  keywords: [String],
  additionalAuthors: [{
    name: String,
    email: String,
    organization: String,
    isPrimaryContact: Boolean
  }],
  customFields: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  reviewDetails: {
    assignedTo: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    reviews: [{
      reviewer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      score: Number,
      comments: String,
      decision: {
        type: String,
        enum: ['accept', 'reject', 'revise', 'undecided']
      },
      isComplete: Boolean,
      reviewedAt: Date
    }],
    finalDecision: {
      type: String,
      enum: ['accepted', 'rejected', 'revision-requested', 'pending'],
      default: 'pending'
    },
    decisionReason: String,
    decisionDate: Date,
    decisionBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    averageScore: Number
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Calculate word count before saving
abstractSchema.pre('save', function(next) {
  if (this.isModified('content')) {
    // Count words in content
    const words = this.content.trim().split(/\s+/);
    this.wordCount = words.length;
  }
  
  if (this.isModified('content') || this.isModified('title') || this.isModified('authors') || this.isModified('topic')) {
    this.lastUpdated = Date.now();
  }
  
  // Generate abstract number if not already set
  if (!this.abstractNumber && this.isNew) {
    const randomPart = Math.floor(1000 + Math.random() * 9000); // 4-digit random number
    const datePart = new Date().getFullYear().toString().substr(-2); // Last 2 digits of year
    this.abstractNumber = `ABS-${datePart}-${randomPart}`;
  }
  
  next();
});

// Virtual for full registration information
abstractSchema.virtual('registrationInfo', {
  ref: 'Registration',
  localField: 'registration',
  foreignField: '_id',
  justOne: true
});

// Virtual for event information
abstractSchema.virtual('eventInfo', {
  ref: 'Event',
  localField: 'event',
  foreignField: '_id',
  justOne: true
});

// Virtual for category information
abstractSchema.virtual('categoryInfo', {
  ref: 'Category',
  localField: 'category',
  foreignField: '_id',
  justOne: true
});

// Method to check if abstract is editable
abstractSchema.methods.isEditable = function() {
  return ['draft', 'submitted', 'revision-requested', 'pending'].includes(this.status);
};

// Method to assign reviewers
abstractSchema.methods.assignReviewers = async function(reviewerIds) {
  console.log(`[AbstractModel] assignReviewers (Rule C) called for abstract ${this._id}. Incoming reviewerIds:`, reviewerIds);

  if (!this.reviewDetails) {
    this.reviewDetails = { assignedTo: [], reviews: [] }; // Ensure reviewDetails and assignedTo exist
  } else if (!this.reviewDetails.assignedTo) {
    this.reviewDetails.assignedTo = []; // Ensure assignedTo exists if reviewDetails does
  }
  
  const validReviewerIds = reviewerIds.filter(id => id !== null && id !== undefined && String(id).trim() !== '');
  console.log(`[AbstractModel] Valid reviewerIds (Rule C) after filtering:`, validReviewerIds);

  if (validReviewerIds.length > 0) {
    // If multiple valid IDs are somehow sent, take the first one to enforce single assignment.
    // The frontend should ideally prevent sending multiple for this rule.
    const singleReviewerId = validReviewerIds[0];
    console.log(`[AbstractModel] Assigning single reviewer ${singleReviewerId} to abstract ${this._id}.`);
    this.reviewDetails.assignedTo = [singleReviewerId];
  } else {
    // No valid reviewers provided, or an empty array was sent, so unassign.
    console.log(`[AbstractModel] No valid reviewers provided/selected. Unassigning all reviewers from abstract ${this._id}.`);
    this.reviewDetails.assignedTo = [];
  }
  
  // Note: This logic does not automatically clear out existing reviews if an abstract is reassigned.
  // If Reviewer A reviewed Abstract 1, and then Abstract 1 is reassigned to Reviewer B,
  // Reviewer A's review object might still exist in `this.reviewDetails.reviews`.
  // Managing orphaned reviews is a separate concern that might need to be addressed
  // depending on desired application behavior (e.g., in a pre-save hook or a dedicated cleanup utility).

  await this.save();
  return this;
};

// Method to submit a review
abstractSchema.methods.submitReview = async function(reviewerId, reviewData) {
  if (!this.reviewDetails) {
    this.reviewDetails = {
      assignedTo: [reviewerId],
      reviews: []
    };
  }
  
  // Check if reviewer is already in the assignedTo list
  const reviewerIdStr = reviewerId.toString();
  if (!this.reviewDetails.assignedTo.some(id => id.toString() === reviewerIdStr)) {
    this.reviewDetails.assignedTo.push(reviewerId);
  }
  
  // Check if the reviewer has already submitted a review
  const existingReviewIndex = this.reviewDetails.reviews.findIndex(
    review => review.reviewer && review.reviewer.toString() === reviewerIdStr
  );
  
  const reviewObj = {
    reviewer: reviewerId,
    score: reviewData.score,
    comments: reviewData.comments,
    decision: reviewData.decision,
    isComplete: true,
    reviewedAt: new Date()
  };
  
  if (existingReviewIndex >= 0) {
    // Update existing review
    this.reviewDetails.reviews[existingReviewIndex] = reviewObj;
  } else {
    // Add new review
    this.reviewDetails.reviews.push(reviewObj);
  }
  
  // Update status to under-review if it was submitted
  if (this.status === 'submitted') {
    this.status = 'under-review';
  }
  
  // Calculate average score if all reviewers have submitted
  if (this.reviewDetails.assignedTo.length > 0 && 
      this.reviewDetails.reviews.length === this.reviewDetails.assignedTo.length) {
    const scores = this.reviewDetails.reviews.map(review => review.score).filter(score => score !== undefined);
    if (scores.length > 0) {
      const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      this.reviewDetails.averageScore = Math.round(avgScore * 10) / 10; // Round to 1 decimal place
    }
  }
  
  await this.save();
  return this;
};

// Method to make a final decision
abstractSchema.methods.makeDecision = async function(decision, decisionReason, userId) {
  if (!this.reviewDetails) {
    this.reviewDetails = {
      assignedTo: [],
      reviews: []
    };
  }
  
  this.reviewDetails.finalDecision = decision;
  this.reviewDetails.decisionReason = decisionReason;
  this.reviewDetails.decisionDate = new Date();
  this.reviewDetails.decisionBy = userId;
  
  // Update the status based on the decision
  switch (decision) {
    case 'accepted':
      this.status = 'accepted';
      break;
    case 'rejected':
      this.status = 'rejected';
      break;
    case 'revision-requested':
      this.status = 'revision-requested';
      break;
    default:
      this.status = 'under-review';
  }
  
  await this.save();
  return this;
};

// Method to track decision history
abstractSchema.methods.trackDecisionHistory = async function(decision, reason, userId) {
  if (!this.reviewDetails) {
    this.reviewDetails = {
      assignedTo: [],
      reviews: [],
      decisionHistory: []
    };
  }
  
  if (!this.reviewDetails.decisionHistory) {
    this.reviewDetails.decisionHistory = [];
  }
  
  // Add the current decision to history
  this.reviewDetails.decisionHistory.push({
    decision: decision,
    reason: reason,
    decidedBy: userId,
    decidedAt: new Date()
  });
  
  // Call the make decision method to update current status
  await this.makeDecision(decision, reason, userId);
  
  return this;
};

// Static method to get abstracts needing review
abstractSchema.statics.getPendingReviews = async function(eventId) {
  return this.find({
    event: eventId,
    status: 'under-review'
  })
  .populate('registration', 'firstName lastName email')
  .populate('category', 'name')
  .populate('reviewDetails.assignedTo', 'firstName lastName email')
  .populate('reviewDetails.reviews.reviewer', 'firstName lastName email');
};

// Static method to get abstracts for a reviewer
abstractSchema.statics.getForReviewer = async function(reviewerId, eventId = null) {
  const query = {
    'reviewDetails.assignedTo': reviewerId
  };
  
  if (eventId) {
    query.event = eventId;
  }
  
  return this.find(query)
    .sort({ submissionDate: -1 })
    .populate('event', 'name')
    .populate('registration', 'firstName lastName email')
    .populate('category', 'name');
};

module.exports = mongoose.model('Abstract', abstractSchema); 