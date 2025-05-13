### Abstract Submission Workflows
<a name="abstract-submission-workflows"></a>

#### Core Functionality
- Implement flexible abstract submission workflows
- Support pre-registration and post-registration submission paths
- Enable configurable abstract forms and requirements
- Create comprehensive abstract review and management system

#### Implementation Details

1. **Workflow Configuration**
   - Configure abstract submission workflows at event level
   - Support two primary paths:
     - Submit abstract after registration (standard)
     - Submit abstract first, register after approval
   - Control abstract visibility and submission deadlines
   - Define abstract categories and submission requirements

2. **Abstract Form Builder**
   - Create configurable abstract submission forms
   - Support different abstract categories/types
   - Configure word/character limits
   - Set required fields and validation rules
   - Support file attachments (images, PDFs)

3. **Submission Management**
   - Track abstract submissions and status
   - Implement review workflows with approval/rejection
   - Send notifications for status changes
   - Generate abstract collections for publications

4. **Database Model Extensions**

```javascript
// Extend Abstract model with additional fields
// Add to existing Abstract.js model
abstractSchema.add({
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
    }
  }
});

// AbstractSettings.js
const abstractSettingsSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  submissionWorkflow: {
    type: String,
    enum: ['post-registration', 'pre-registration', 'both'],
    default: 'post-registration'
  },
  abstractTypes: [{
    name: String,
    description: String,
    maxCount: Number,
    isDefault: Boolean
  }],
  startDate: Date,
  endDate: Date,
  wordLimit: {
    type: Number,
    default: 300
  },
  isActive: {
    type: Boolean,
    default: false
  },
  acceptsResubmission: {
    type: Boolean,
    default: true
  },
  fileAttachmentsAllowed: {
    type: Boolean,
    default: false
  },
  maxFileSize: {
    type: Number, // in bytes
    default: 5 * 1024 * 1024 // 5MB
  },
  allowedFileTypes: [String],
  reviewers: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    abstractTypes: [String],
    maxAssignments: Number
  }],
  customFields: [{
    name: String,
    type: {
      type: String,
      enum: ['text', 'number', 'select', 'checkbox', 'radio', 'date']
    },
    options: [String],
    isRequired: Boolean,
    order: Number
  }],
  autoAssignReviewers: {
    type: Boolean,
    default: false
  },
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
```

5. **API Routes**

```javascript
// abstractSettings.routes.js
router.get('/:eventId/abstract-settings', auth, catchAsync(abstractSettingsController.getAbstractSettings));
router.put('/:eventId/abstract-settings', auth, authorize('admin', 'manager'), validateBody(abstractSettingsSchema.update), catchAsync(abstractSettingsController.updateAbstractSettings));

// abstractWorkflow.routes.js
router.post('/:eventId/abstracts/submit', validateBody(abstractWorkflowSchema.submitAbstract), catchAsync(abstractWorkflowController.submitAbstract));
router.post('/:eventId/abstracts/:abstractId/approve', auth, authorize('admin', 'manager'), catchAsync(abstractWorkflowController.approveAbstract));
router.post('/:eventId/abstracts/:abstractId/reject', auth, authorize('admin', 'manager'), validateBody(abstractWorkflowSchema.rejectAbstract), catchAsync(abstractWorkflowController.rejectAbstract));
router.post('/:eventId/abstracts/:abstractId/request-revision', auth, authorize('admin', 'manager'), validateBody(abstractWorkflowSchema.requestRevision), catchAsync(abstractWorkflowController.requestRevision));
router.post('/:eventId/abstracts/:abstractId/assign', auth, authorize('admin', 'manager'), validateBody(abstractWorkflowSchema.assignReviewers), catchAsync(abstractWorkflowController.assignReviewers));
router.post('/:eventId/abstracts/:abstractId/review', auth, validateBody(abstractWorkflowSchema.submitReview), catchAsync(abstractWorkflowController.submitReview));
router.post('/:eventId/abstracts/auto-assign', auth, authorize('admin', 'manager'), catchAsync(abstractWorkflowController.autoAssignReviewers));
router.get('/:eventId/abstracts/pending-review', auth, catchAsync(abstractWorkflowController.getPendingReviews));
router.get('/:eventId/abstracts/my-reviews', auth, catchAsync(abstractWorkflowController.getMyAssignedReviews));
router.get('/:eventId/abstracts/statistics', auth, catchAsync(abstractWorkflowController.getReviewStatistics));
```

6. **Controller Functions**

```javascript
// Abstract settings controller methods
getAbstractSettings // Get abstract settings for event
updateAbstractSettings // Update abstract settings

// Abstract workflow controller methods
submitAbstract // Submit new abstract
approveAbstract // Approve abstract
rejectAbstract // Reject abstract
requestRevision // Request revision for abstract
assignReviewers // Assign reviewers to abstract
submitReview // Submit review for abstract
autoAssignReviewers // Auto-assign reviewers to abstracts
getPendingReviews // Get abstracts pending review
getMyAssignedReviews // Get abstracts assigned to current user
getReviewStatistics // Get review statistics
```

### Admin Panel Enhancements
<a name="admin-panel-enhancements"></a>

#### Core Functionality
- Extend admin panel with new configuration options
- Create comprehensive settings for all new features
- Implement user-friendly interfaces for complex configurations
- Support granular permission control for administrators

#### Implementation Details

1. **Extended Event Settings**
   - Add configuration sections for new features:
     - Landing page settings
     - Payment and pricing configuration
     - Workshop management
     - Sponsor management
     - Hotel and travel options
   - Implement tabbed interface for organized configuration
   - Support event duplication with all new settings

2. **Category Extensions**
   - Add workshop permissions to categories
   - Configure abstract submission abilities per category
   - Define additional data collection per category
   - Control portal access features by category

3. **User Management**
   - Extend permissions system for new features
   - Create sponsor admin role
   - Implement fine-grained access control
   - Track admin actions on sensitive settings

4. **Custom Field Management**
   - Create, edit, and delete custom fields for:
     - Registration forms
     - Abstract submission forms
     - Workshop registration forms
     - Additional category data
   - Support validation rules and conditional logic
   - Enable file upload fields with validation

5. **Database Model Extensions**

```javascript
// Extend User model with additional permissions
// Add to existing User.js model
userSchema.add({
  extendedPermissions: {
    canManageLandingPages: {
      type: Boolean,
      default: false
    },
    canManagePayments: {
      type: Boolean,
      default: false
    },
    canManageSponsors: {
      type: Boolean,
      default: false
    },
    canManageWorkshops: {
      type: Boolean,
      default: false
    },
    canReviewAbstracts: {
      type: Boolean,
      default: false
    },
    canManageHotelTravel: {
      type: Boolean,
      default: false
    }
  },
  isSponsorAdmin: {
    type: Boolean,
    default: false
  },
  sponsorOrganization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sponsor'
  }
});

// CustomField.js
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

// Extend Category model
// Add to existing Category.js model
categorySchema.add({
  workshopPermissions: {
    canRegister: {
      type: Boolean,
      default: false
    },
    workshopIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workshop'
    }]
  },
  abstractPermissions: {
    canSubmit: {
      type: Boolean,
      default: false
    },
    allowedTypes: [String],
    maxSubmissions: Number
  },
  additionalDataFields: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CustomField'
  }],
  portalFeatures: {
    canViewAgenda: {
      type: Boolean,
      default: true
    },
    canDownloadMaterials: {
      type: Boolean,
      default: true
    },
    canViewCertificates: {
      type: Boolean,
      default: true
    }
  }
});
```

6. **API Routes**

```javascript
// adminSettings.routes.js
router.get('/custom-fields', auth, catchAsync(adminSettingsController.getCustomFields));
router.post('/custom-fields', auth, authorize('admin', 'manager'), validateBody(customFieldSchema.create), catchAsync(adminSettingsController.createCustomField));
router.put('/custom-fields/:id', auth, authorize('admin', 'manager'), validateBody(customFieldSchema.update), catchAsync(adminSettingsController.updateCustomField));
router.delete('/custom-fields/:id', auth, authorize('admin', 'manager'), catchAsync(adminSettingsController.deleteCustomField));

router.get('/event-settings/:eventId/tabs', auth, catchAsync(adminSettingsController.getEventSettingTabs));
router.get('/event-settings/:eventId/:tab', auth, catchAsync(adminSettingsController.getEventTabSettings));
router.put('/event-settings/:eventId/:tab', auth, authorize('admin', 'manager'), validateBody(adminSettingsSchema.updateTab), catchAsync(adminSettingsController.updateEventTabSettings));

router.put('/user-permissions/:userId', auth, authorize('admin'), validateBody(adminSettingsSchema.updatePermissions), catchAsync(adminSettingsController.updateUserPermissions));
router.post('/sponsor-admin', auth, authorize('admin'), validateBody(adminSettingsSchema.createSponsorAdmin), catchAsync(adminSettingsController.createSponsorAdmin));
```

7. **Controller Functions**

```javascript
// Admin settings controller methods
getCustomFields // Get custom fields
createCustomField // Create custom field
updateCustomField // Update custom field
deleteCustomField // Delete custom field
getEventSettingTabs // Get available event setting tabs
getEventTabSettings // Get settings for specific tab
updateEventTabSettings // Update settings for specific tab
updateUserPermissions // Update user permissions
createSponsorAdmin // Create sponsor admin account
```

### Client Dashboard & Analytics
<a name="client-dashboard-analytics"></a>

#### Core Functionality
- Create comprehensive client-facing dashboard
- Implement detailed analytics and visualization
- Enable export of all data and reports
- Support customizable KPI tracking

#### Implementation Details

1. **Dashboard Overview**
   - Design responsive dashboard with key metrics overview
   - Create card-based widgets for essential data points
   - Implement real-time data updates
   - Support dashboard customization

2. **Registration Analytics**
   - Track registration trends by date and category
   - Visualize demographic information
   - Monitor workshop registrations and capacity
   - Track payment status and revenue

3. **Financial Reporting**
   - Create comprehensive financial reports
   - Track revenue by category, pricing tier, and workshop
   - Generate tax reports and summaries
   - Export financial data to Excel

4. **Sponsorship Tracking**
   - Monitor sponsor contributions
   - Track sponsored registrations
   - Visualize sponsor ROI metrics
   - Generate sponsor performance reports

5. **Database Model Extensions**

```javascript
// Dashboard.js
const dashboardSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  layout: [{
    widgetId: String,
    x: Number,
    y: Number,
    w: Number,
    h: Number,
    config: Object
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// AnalyticsDataCache.js
const analyticsDataCacheSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  dataType: {
    type: String,
    enum: ['registration', 'financial', 'workshop', 'abstract', 'sponsorship'],
    required: true
  },
  data: {
    type: Object,
    required: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

// Report.js
const reportSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: String,
  type: {
    type: String,
    enum: ['registration', 'financial', 'workshop', 'abstract', 'sponsorship', 'custom'],
    required: true
  },
  config: {
    type: Object,
    required: true
  },
  isScheduled: {
    type: Boolean,
    default: false
  },
  scheduleConfig: {
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly']
    },
    recipients: [String],
    nextRunDate: Date
  },
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
```

6. **API Routes**

```javascript
// dashboard.routes.js
router.get('/:eventId/dashboard', auth, catchAsync(dashboardController.getDashboard));
router.put('/:eventId/dashboard/layout', auth, validateBody(dashboardSchema.updateLayout), catchAsync(dashboardController.updateDashboardLayout));
router.get('/:eventId/dashboard/widgets', auth, catchAsync(dashboardController.getDashboardWidgets));
router.get('/:eventId/dashboard/widget-data/:widgetId', auth, catchAsync(dashboardController.getWidgetData));

// analytics.routes.js
router.get('/:eventId/analytics/registration', auth, catchAsync(analyticsController.getRegistrationAnalytics));
router.get('/:eventId/analytics/financial', auth, authorize('admin', 'manager'), catchAsync(analyticsController.getFinancialAnalytics));
router.get('/:eventId/analytics/workshops', auth, catchAsync(analyticsController.getWorkshopAnalytics));
router.get('/:eventId/analytics/abstracts', auth, catchAsync(analyticsController.getAbstractAnalytics));
router.get('/:eventId/analytics/sponsors', auth, catchAsync(analyticsController.getSponsorAnalytics));
router.get('/:eventId/analytics/export/:type', auth, catchAsync(analyticsController.exportAnalyticsData));

// reports.routes.js
router.get('/:eventId/reports', auth, catchAsync(reportController.getReports));
router.post('/:eventId/reports', auth, authorize('admin', 'manager'), validateBody(reportSchema.createReport), catchAsync(reportController.createReport));
router.get('/:eventId/reports/:id', auth, catchAsync(reportController.getReportById));
router.put('/:eventId/reports/:id', auth, authorize('admin', 'manager'), validateBody(reportSchema.updateReport), catchAsync(reportController.updateReport));
router.delete('/:eventId/reports/:id', auth, authorize('admin', 'manager'), catchAsync(reportController.deleteReport));
router.post('/:eventId/reports/:id/generate', auth, catchAsync(reportController.generateReport));
router.post('/:eventId/reports/:id/schedule', auth, authorize('admin', 'manager'), validateBody(reportSchema.scheduleReport), catchAsync(reportController.scheduleReport));
router.get('/:eventId/reports/:id/export', auth, catchAsync(reportController.exportReport));
```

7. **Controller Functions**

```javascript
// Dashboard controller methods
getDashboard // Get dashboard layout and data
updateDashboardLayout // Update dashboard layout
getDashboardWidgets // Get available dashboard widgets
getWidgetData // Get data for specific widget

// Analytics controller methods
getRegistrationAnalytics // Get registration analytics
getFinancialAnalytics // Get financial analytics
getWorkshopAnalytics // Get workshop analytics
getAbstractAnalytics // Get abstract analytics
getSponsorAnalytics // Get sponsor analytics
exportAnalyticsData // Export analytics data

// Report controller methods
getReports // Get reports
createReport // Create report
getReportById // Get report by ID
updateReport // Update report
deleteReport // Delete report
generateReport // Generate report
scheduleReport // Schedule report
exportReport // Export report
```

### Sponsor Management
<a name="sponsor-management"></a>

#### Core Functionality
- Implement comprehensive sponsor management system
- Create sponsor portal with registration capabilities
- Enable sponsor content management
- Track sponsored registrations and allotments

#### Implementation Details

1. **Sponsor Configuration**
   - Create, edit, and manage event sponsors
   - Define sponsorship levels and benefits
   - Configure registration allotments per sponsor
   - Set up sponsor branding and visibility options

2. **Sponsor Portal**
   - Create dedicated portal for sponsor administrators
   - Enable self-service registration of sponsored guests
   - Provide dashboard with allocation usage metrics
   - Allow content management for exhibit materials

3. **Sponsored Registration Tracking**
   - Track registrations by sponsor
   - Monitor allocation usage
   - Support manual and bulk registration import
   - Generate sponsor-specific reports

4. **Database Model Extensions**

```javascript
// Sponsor.js
const sponsorSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: String,
  logo: String,
  websiteUrl: String,
  level: {
    type: String,
    enum: ['platinum', 'gold', 'silver', 'bronze', 'partner', 'custom'],
    default: 'custom'
  },
  customLevel: String,
  contactName: String,
  contactEmail: String,
  contactPhone: String,
  registrationAllotment: {
    type: Number,
    default: 0
  },
  registrationCount: {
    type: Number,
    default: 0
  },
  registrationCategories: [{
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category'
    },
    allotment: Number,
    used: {
      type: Number,
      default: 0
    }
  }],
  adminUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  exhibitor: {
    isExhibitor: {
      type: Boolean,
      default: false
    },
    boothNumber: String,
    boothSize: String,
    notes: String
  },
  visibility: {
    showOnLandingPage: {
      type: Boolean,
      default: true
    },
    showLogoOnBadge: {
      type: Boolean,
      default: false
    },
    showInMobileApp: {
      type: Boolean,
      default: true
    }
  },
  sponsorPortal: {
    isEnabled: {
      type: Boolean,
      default: true
    },
    customWelcomeMessage: String,
    allowContentUpload: {
      type: Boolean,
      default: false
    }
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending'],
    default: 'active'
  },
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

// SponsorContent.js
const sponsorContentSchema = new mongoose.Schema({
  sponsor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sponsor',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  contentType: {
    type: String,
    enum: ['document', 'image', 'video', 'link'],
    required: true
  },
  fileUrl: String,
  fileName: String,
  fileSize: Number,
  externalUrl: String,
  isPublished: {
    type: Boolean,
    default: false
  },
  categories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
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

// Extend Registration model
// Add to existing Registration.js model
registrationSchema.add({
  sponsor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sponsor'
  },
  isSponsoredRegistration: {
    type: Boolean,
    default: false
  },
  sponsorNotes: String
});
```

5. **API Routes**

```javascript
// sponsor.routes.js
router.get('/:eventId/sponsors', auth, catchAsync(sponsorController.getSponsors));
router.post('/:eventId/sponsors', auth, authorize('admin', 'manager'), validateBody(sponsorSchema.createSponsor), catchAsync(sponsorController.createSponsor));
router.get('/:eventId/sponsors/:id', auth, catchAsync(sponsorController.getSponsorById));
router.put('/:eventId/sponsors/:id', auth, authorize('admin', 'manager'), validateBody(sponsorSchema.updateSponsor), catchAsync(sponsorController.updateSponsor));
router.delete('/:eventId/sponsors/:id', auth, authorize('admin', 'manager'), catchAsync(sponsorController.deleteSponsor));
router.get('/:eventId/sponsors/:id/registrations', auth, catchAsync(sponsorController.getSponsorRegistrations));
router.post('/:eventId/sponsors/:id/registrations', auth, validateBody(sponsorSchema.createRegistration), catchAsync(sponsorController.createSponsorRegistration));
router.post('/:eventId/sponsors/:id/bulk-registrations', auth, upload.single('file'), catchAsync(sponsorController.bulkCreateSponsorRegistrations));
router.get('/:eventId/sponsors/:id/allocation', auth, catchAsync(sponsorController.getSponsorAllocation));
router.put('/:eventId/sponsors/:id/allocation', auth, authorize('admin', 'manager'), validateBody(sponsorSchema.updateAllocation), catchAsync(sponsorController.updateSponsorAllocation));

// sponsorContent.routes.js
router.get('/:sponsorId/content', auth, catchAsync(sponsorContentController.getSponsorContent));
router.post('/:sponsorId/content', auth, upload.single('file'), validateBody(sponsorContentSchema.createContent), catchAsync(sponsorContentController.createSponsorContent));
router.get('/:sponsorId/content/:id', auth, catchAsync(sponsorContentController.getSponsorContentById));
router.put('/:sponsorId/content/:id', auth, validateBody(sponsorContentSchema.updateContent), catchAsync(sponsorContentController.updateSponsorContent));
router.delete('/:sponsorId/content/:id', auth, catchAsync(sponsorContentController.deleteSponsorContent));
router.post('/:sponsorId/content/:id/publish', auth, catchAsync(sponsorContentController.publishSponsorContent));
```

6. **Sponsor Portal Routes**

```javascript
// sponsorPortal.routes.js
router.post('/login', validateBody(sponsorPortalSchema.login), catchAsync(sponsorPortalController.login));
router.post('/forgot-password', validateBody(sponsorPortalSchema.forgotPassword), catchAsync(sponsorPortalController.forgotPassword));
router.post('/reset-password', validateBody(sponsorPortalSchema.resetPassword), catchAsync(sponsorPortalController.resetPassword));

// Protected sponsor portal routes (require sponsor authentication)
router.get('/dashboard', sponsorAuth, catchAsync(sponsorPortalController.getDashboard));
router.get('/registrations', sponsorAuth, catchAsync(sponsorPortalController.getRegistrations));
router.post('/registrations', sponsorAuth, validateBody(sponsorPortalSchema.createRegistration), catchAsync(sponsorPortalController.createRegistration));
router.get('/registrations/:id', sponsorAuth, catchAsync(sponsorPortalController.getRegistrationById));
router.put('/registrations/:id', sponsorAuth, validateBody(sponsorPortalSchema.updateRegistration), catchAsync(sponsorPortalController.updateRegistration));
router.delete('/registrations/:id', sponsorAuth, catchAsync(sponsorPortalController.deleteRegistration));
router.post('/registrations/bulk-import', sponsorAuth, upload.single('file'), catchAsync(sponsorPortalController.bulkImportRegistrations));
router.get('/allocation', sponsorAuth, catchAsync(sponsorPortalController.getAllocation));
router.get('/content', sponsorAuth, catchAsync(sponsorPortalController.getContent));
router.post('/content', sponsorAuth, upload.single('file'), validateBody(sponsorPortalSchema.createContent), catchAsync(sponsorPortalController.createContent));
router.get('/content/:id', sponsorAuth, catchAsync(sponsorPortalController.getContentById));
router.put('/content/:id', sponsorAuth, validateBody(sponsorPortalSchema.updateContent), catchAsync(sponsorPortalController.updateContent));
router.delete('/content/:id', sponsorAuth, catchAsync(sponsorPortalController.deleteContent));
```

7. **Controller Functions**

```javascript
// Sponsor controller methods
getSponsors // Get sponsors
createSponsor // Create sponsor
getSponsorById // Get sponsor by ID
updateSponsor // Update sponsor
deleteSponsor // Delete sponsor
getSponsorRegistrations // Get sponsor registrations
createSponsorRegistration // Create sponsor registration
bulkCreateSponsorRegistrations // Bulk create sponsor registrations
getSponsorAllocation // Get sponsor allocation
updateSponsorAllocation // Update sponsor allocation

// Sponsor content controller methods
getSponsorContent // Get sponsor content
createSponsorContent // Create sponsor content
getSponsorContentById // Get sponsor content by ID
updateSponsorContent // Update sponsor content
deleteSponsorContent // Delete sponsor content
publishSponsorContent // Publish sponsor content

// Sponsor portal controller methods
login // Authenticate sponsor
forgotPassword // Send password reset email
resetPassword // Reset password with token
getDashboard // Get sponsor dashboard
getRegistrations // Get sponsor registrations
createRegistration // Create registration
getRegistrationById // Get registration by ID
updateRegistration // Update registration
deleteRegistration // Delete registration
bulkImportRegistrations // Bulk import registrations
getAllocation // Get allocation
getContent // Get sponsor content
createContent // Create content
getContentById // Get content by ID
updateContent // Update content
deleteContent // Delete content
```

### Notification System
<a name="notification-system"></a>

#### Core