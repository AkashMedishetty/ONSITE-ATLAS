const mongoose = require('mongoose');

const landingPageSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    trim: true
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  publishedVersion: {
    type: Number,
    default: 0
  },
  components: [{
    type: {
      type: String,
      enum: ['hero', 'eventDetails', 'schedule', 'speakers', 'registrationForm', 
             'countdown', 'sponsors', 'gallery', 'custom', 'html'],
      required: true
    },
    order: {
      type: Number,
      required: true
    },
    settings: {
      type: Object,
      required: true
    },
    content: {
      type: Object
    },
    customHtml: String,
    customCss: String,
    customJs: String,
    isHidden: {
      type: Boolean,
      default: false
    }
  }],
  seo: {
    metaTitle: String,
    metaDescription: String,
    ogImage: String,
    keywords: [String]
  },
  versions: [{
    versionNumber: Number,
    components: Array,
    createdAt: Date,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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

// Middleware to ensure slug uniqueness
landingPageSchema.pre('save', async function(next) {
  if (this.isModified('slug')) {
    const count = await mongoose.models.LandingPage.countDocuments({
      slug: this.slug,
      event: this.event,
      _id: { $ne: this._id }
    });
    
    if (count > 0) {
      this.slug = `${this.slug}-${Date.now()}`;
    }
  }
  next();
});

// Method to save a new version
landingPageSchema.methods.saveVersion = function() {
  const currentVersion = this.publishedVersion + 1;
  
  this.versions.push({
    versionNumber: currentVersion,
    components: [...this.components],
    createdAt: new Date(),
    createdBy: this.createdBy
  });
  
  this.publishedVersion = currentVersion;
  return this.save();
};

const LandingPage = mongoose.model('LandingPage', landingPageSchema);

module.exports = LandingPage; 