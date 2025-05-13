# ONSITE ATLAS Extension - Implementation Tracking

This document tracks the implementation status of all features outlined in the ONSITE ATLAS extension plan.

## Core Features Implementation Status

| Feature | Status | Notes | Last Updated |
|---------|--------|-------|-------------|
| **Landing Page Builder** | In Progress | Database models, controllers, and frontend components implemented. Added LandingPage model, controller, routes and UI components including LandingPagesManager, LandingPageEditor, and public viewing components. | 2023-04-08 |
| **Payment Gateway Integration** | In Progress | Database models created for PaymentGateway, Payment, and InvoiceTemplate. Frontend service for payment processing implemented. Routes and controllers for payment functionality added. | 2023-04-08 |
| **Advanced Pricing System** | In Progress | Database models created for PricingTier, CategoryPrice, and Workshop. Added pricing settings to Event model. Created robust data models with validation and business logic. | 2023-04-08 |
| **Workshop Management** | In Progress | Workshop model created with comprehensive validation and business logic methods. | 2023-04-08 |
| **Registrant Portal** | In Progress | Implemented models, controllers, and middleware for registrant authentication and profile management. Added routes and service functions for event information, resources, and abstract submission. | 2023-04-09 |
| **Abstract Submission Workflows** | In Progress | Implemented AbstractSettings model, validation schema, controller and routes for abstract submission, review, and workflow management. Added workflow functionality to Abstract model. Created frontend components for abstract submission, listing, and review in the registrant portal. | 2023-04-10 |
| **Admin Panel Enhancements** | In Progress | Extended User model with additional permissions. Created CustomField model to support dynamic form fields. Added Category model extensions for workshop and abstract permissions. Implemented controllers and routes for admin settings and custom field management. | 2023-04-11 |
| **Client Dashboard & Analytics** | Not Started | Comprehensive metrics and visualization | 2023-04-07 |
| **Sponsor Management** | Not Started | Sponsor portal and registration capabilities | 2023-04-07 |
| **Notification System** | Not Started | Multi-channel notifications (email, WhatsApp, SMS) | 2023-04-07 |
| **Hotel & Travel Tracking** | Not Started | Travel information and hotel booking management | 2023-04-07 |
| **Data Export & Reporting** | Not Started | Flexible export system with multiple formats | 2023-04-07 |

## Technical Implementation Status

| Component | Status | Notes | Last Updated |
|-----------|--------|-------|-------------|
| **Frontend Architecture** | In Progress | Created new components for landing page management and payment processing integration | 2023-04-08 |
| **State Management** | In Progress | Added state management for landing page editing and payment processing | 2023-04-08 |
| **Dynamic Form Handling** | In Progress | Implemented dynamic form components for landing page editor | 2023-04-08 |
| **Query Optimization** | Not Started | Database indexing and aggregation pipelines | 2023-04-07 |
| **Background Processing** | Not Started | Job queuing system for resource-intensive tasks | 2023-04-07 |
| **Caching Strategy** | Not Started | Redis/Memcached implementation | 2023-04-07 |
| **Mobile Responsiveness** | In Progress | Landing page components designed with mobile-first approach | 2023-04-08 |
| **Performance Optimization** | Not Started | Frontend and backend optimizations | 2023-04-07 |
| **Accessibility Compliance** | Not Started | WCAG 2.1 AA compliance implementation | 2023-04-07 |
| **Security Implementation** | In Progress | Implemented encryption for payment gateway credentials and validation for pricing models | 2023-04-08 |

## Phase Implementation Plan

### Phase 1: Foundation
- [x] Database model extensions
- [x] Landing page builder
- [x] Payment gateway integration
- [x] Pricing system

### Phase 2: Registration & Workshops
- [ ] Registration form enhancements
- [x] Workshop management
- [x] Registrant portal
- [x] Abstract submission workflows

### Phase 3: Administrative Features
- [x] Admin panel enhancements
- [ ] Client dashboard
- [ ] Sponsor management
- [ ] Notification system

### Phase 4: Additional Features
- [ ] Hotel & travel tracking
- [ ] Data export & reporting
- [ ] Performance optimization
- [ ] Documentation and training

## Implementation Notes

### Landing Page Builder Implementation (2023-04-08)
- Created MongoDB models for LandingPage with version history support
- Implemented controllers and routes for CRUD operations
- Developed frontend components for managing, editing, and previewing landing pages
- Integrated into EventPortal navigation for easy access
- Added public routes for accessing published landing pages

#### API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------------|
| GET | `/api/events/:eventId/landing-pages` | List all landing pages for an event | Yes |
| POST | `/api/events/:eventId/landing-pages` | Create a new landing page | Yes |
| GET | `/api/events/:eventId/landing-pages/:id` | Get a specific landing page | Yes |
| PUT | `/api/events/:eventId/landing-pages/:id` | Update a landing page | Yes |
| DELETE | `/api/events/:eventId/landing-pages/:id` | Delete a landing page | Yes |
| POST | `/api/events/:eventId/landing-pages/:id/publish` | Publish a landing page | Yes |
| GET | `/api/events/:eventId/landing-pages/:id/preview` | Preview a landing page | Yes |
| POST | `/api/events/:eventId/landing-pages/import-html` | Import HTML for a landing page | Yes |
| POST | `/api/events/:eventId/landing-pages/:id/restore/:versionId` | Restore previous version | Yes |
| GET | `/api/public/events/:slug/landing` | View public landing page | No |
| GET | `/api/public/go/:shortCode` | Handle short URL redirect | No |

#### Data Models

```javascript
// LandingPage Model
{
  event: ObjectId, // Reference to Event
  title: String,
  slug: String,
  isPublished: Boolean,
  publishedVersion: String,
  components: [
    {
      type: String, // hero, text, image, cta, etc.
      content: Object, // Component-specific content
      order: Number
    }
  ],
  seo: {
    title: String,
    description: String,
    keywords: String,
    ogImage: String
  },
  versions: [
    {
      version: String,
      components: Array,
      createdAt: Date,
      createdBy: ObjectId
    }
  ],
  createdBy: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

### Payment Gateway Integration Implementation (2023-04-08)
- Created MongoDB models for PaymentGateway, Payment, and InvoiceTemplate
- Implemented secure credential storage with encryption
- Added support for multiple payment providers (Stripe, PayPal, Razorpay, Instamojo)
- Created routes and APIs for payment processing
- Integrated payment forms into landing pages

#### API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------------|
| GET | `/api/payment-gateways` | List payment gateways | Yes |
| POST | `/api/payment-gateways` | Create payment gateway | Yes |
| PUT | `/api/payment-gateways/:id` | Update payment gateway | Yes |
| DELETE | `/api/payment-gateways/:id` | Delete payment gateway | Yes |
| POST | `/api/payments/process` | Process a payment | No* |
| POST | `/api/payments/verify` | Verify a payment | No* |
| GET | `/api/payments/:id` | Get payment by ID | Yes |
| POST | `/api/payments/:id/refund` | Refund a payment | Yes |
| GET | `/api/invoice-templates` | List invoice templates | Yes |
| POST | `/api/invoice-templates` | Create invoice template | Yes |
| PUT | `/api/invoice-templates/:id` | Update invoice template | Yes |
| DELETE | `/api/invoice-templates/:id` | Delete invoice template | Yes |
| GET | `/api/payments/:id/invoice` | Get invoice for payment | Mixed** |
| GET | `/api/payments/:id/receipt` | Get receipt for payment | Mixed** |

\* While no authentication required, validation is performed based on the event and other factors
\** Public access with a token or authenticated access for admins

#### Data Models

```javascript
// PaymentGateway Model
{
  name: String, // stripe, paypal, razorpay, instamojo
  displayName: String,
  isActive: Boolean,
  isDefault: Boolean,
  configuration: {
    // Encrypted sensitive fields
    apiKey: String,
    apiSecret: String,
    clientId: String,
    clientSecret: String,
    // Non-sensitive fields
    publicKey: String,
    mode: String // test, live
  },
  testMode: Boolean,
  supportedCurrencies: [String],
  createdBy: ObjectId,
  createdAt: Date,
  updatedAt: Date
}

// Payment Model
{
  event: ObjectId, // Reference to Event
  registration: ObjectId, // Reference to Registration
  gateway: String, // Payment gateway used
  amount: Number,
  currency: String,
  status: String, // pending, completed, failed, refunded, partially_refunded
  gatewayTransactionId: String,
  gatewayResponse: Object,
  items: [
    {
      type: String, // registration, workshop, etc.
      description: String,
      quantity: Number,
      unitPrice: Number
    }
  ],
  invoiceNumber: String,
  invoiceUrl: String,
  receiptUrl: String,
  notes: String,
  metadata: Object,
  refunds: [
    {
      amount: Number,
      reason: String,
      refundedAt: Date,
      refundedBy: ObjectId,
      status: String // pending, completed, failed
    }
  ],
  paidAt: Date,
  createdAt: Date,
  updatedAt: Date
}

// InvoiceTemplate Model
{
  name: String,
  isDefault: Boolean,
  headerLogo: String,
  footerText: String,
  companyDetails: {
    name: String,
    address: String,
    taxId: String,
    contact: String
  },
  templateHtml: String, // HTML template with placeholders
  createdBy: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

### Advanced Pricing System Implementation (2023-04-08)
- Created MongoDB models for PricingTier, CategoryPrice, and Workshop
- Enhanced Event model with pricing settings including discount codes
- Implemented business logic for tier-based pricing
- Added validation for date ranges and pricing conflicts
- Created workshop capacity management with availability tracking
- Added methods for checking workshop eligibility by category

#### API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------------|
| GET | `/api/events/:eventId/pricing-tiers` | List pricing tiers | Yes |
| POST | `/api/events/:eventId/pricing-tiers` | Create pricing tier | Yes |
| PUT | `/api/events/:eventId/pricing-tiers/:id` | Update pricing tier | Yes |
| DELETE | `/api/events/:eventId/pricing-tiers/:id` | Delete pricing tier | Yes |
| GET | `/api/events/:eventId/category-prices` | List category prices | Yes |
| POST | `/api/events/:eventId/category-prices` | Create category price | Yes |
| PUT | `/api/events/:eventId/category-prices/:id` | Update category price | Yes |
| DELETE | `/api/events/:eventId/category-prices/:id` | Delete category price | Yes |
| POST | `/api/events/:eventId/calculate-price` | Calculate price for selection | No |
| GET | `/api/events/:eventId/workshops` | List workshops | No |
| POST | `/api/events/:eventId/workshops` | Create workshop | Yes |
| GET | `/api/events/:eventId/workshops/:id` | Get workshop by ID | No |
| PUT | `/api/events/:eventId/workshops/:id` | Update workshop | Yes |
| DELETE | `/api/events/:eventId/workshops/:id` | Delete workshop | Yes |
| GET | `/api/events/:eventId/workshops/:id/availability` | Get workshop availability | No |
| POST | `/api/events/:eventId/workshops/:id/register` | Register for workshop | No* |
| GET | `/api/events/:eventId/workshops/:id/attendees` | Get workshop attendees | Yes |
| POST | `/api/events/:eventId/workshops/:id/check-in/:registrationId` | Check in attendee | Yes |
| GET | `/api/events/:eventId/workshops/:id/export-attendees` | Export attendees | Yes |
| GET | `/api/events/:eventId/workshops/reports` | Get workshop reports | Yes |

\* While no authentication required, validation is performed based on the event and other factors

#### Data Models

```javascript
// PricingTier Model
{
  event: ObjectId, // Reference to Event
  name: String, // early-bird, normal, onsite
  displayName: String,
  startDate: Date,
  endDate: Date,
  isActive: Boolean,
  order: Number,
  createdAt: Date,
  updatedAt: Date
}

// CategoryPrice Model
{
  event: ObjectId, // Reference to Event
  category: ObjectId, // Reference to Category
  pricingTier: ObjectId, // Reference to PricingTier
  price: Number,
  currency: String,
  description: String,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}

// Workshop Model
{
  event: ObjectId, // Reference to Event
  title: String,
  description: String,
  startDateTime: Date,
  endDateTime: Date,
  venue: String,
  capacity: Number,
  registrations: [ObjectId], // References to Registration
  availableFor: [ObjectId], // References to Category
  price: Number,
  currency: String,
  allowIndependentRegistration: Boolean,
  isActive: Boolean,
  instructor: {
    name: String,
    bio: String,
    photo: String
  },
  materials: [
    {
      name: String,
      fileUrl: String,
      isPublic: Boolean
    }
  ],
  attendees: [
    {
      registration: ObjectId, // Reference to Registration
      checkedIn: Boolean,
      checkinTime: Date,
      checkedInBy: ObjectId // Reference to User
    }
  ],
  createdBy: ObjectId,
  createdAt: Date,
  updatedAt: Date
}

// Event Model Extension for Pricing
{
  pricingSettings: {
    currency: String,
    taxPercentage: Number,
    displayTaxSeparately: Boolean,
    allowPartialPayments: Boolean,
    autoSwitchPricingTiers: Boolean,
    discountCodes: [
      {
        code: String,
        discountType: String, // percentage, fixed
        discountValue: Number,
        maxUses: Number,
        usesCount: Number,
        validFrom: Date,
        validUntil: Date,
        isActive: Boolean,
        appliesToWorkshops: Boolean,
        limitedToCategories: [ObjectId] // References to Category
      }
    ]
  }
}
```

### Registrant Portal Implementation (2023-04-09)
- Created MongoDB models for RegistrantAccount, EventAnnouncement, and EventResource
- Implemented JWT-based authentication system specific to registrants
- Added middleware for securing registrant-specific routes
- Developed controllers for profile management, event information, and resource access
- Created frontend service with API calls for authentication and data retrieval

#### API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------------|
| POST | `/api/registrant-portal/login` | Authenticate registrant | No |
| POST | `/api/registrant-portal/register` | Register new account | No |
| POST | `/api/registrant-portal/forgot-password` | Request password reset | No |
| POST | `/api/registrant-portal/reset-password` | Reset password with token | No |
| POST | `/api/registrant-portal/verify` | Verify account with token | No |
| GET | `/api/registrant-portal/profile` | Get registrant profile | Yes |
| PUT | `/api/registrant-portal/profile` | Update profile | Yes |
| GET | `/api/registrant-portal/registration` | Get registration details | Yes |
| GET | `/api/registrant-portal/payments` | Get payment history | Yes |
| GET | `/api/registrant-portal/payments/:id/invoice` | Get payment invoice | Yes |
| GET | `/api/registrant-portal/event` | Get event details | Yes |
| GET | `/api/registrant-portal/announcements` | Get event announcements | Yes |
| GET | `/api/registrant-portal/resources` | Get event resources | Yes |
| GET | `/api/registrant-portal/resources/:id` | Download resource | Yes |
| GET | `/api/registrant-portal/workshops` | Get available workshops | Yes |
| POST | `/api/registrant-portal/workshops/:id/register` | Register for workshop | Yes |
| GET | `/api/registrant-portal/abstracts` | Get submitted abstracts | Yes |
| POST | `/api/registrant-portal/abstracts` | Submit abstract | Yes |
| GET | `/api/registrant-portal/abstracts/:id` | Get abstract by ID | Yes |
| PUT | `/api/registrant-portal/abstracts/:id` | Update abstract | Yes |
| GET | `/api/registrant-portal/certificates` | Get certificates | Yes |
| GET | `/api/registrant-portal/certificates/:id` | Download certificate | Yes |

#### Data Models

```javascript
// RegistrantAccount Model
{
  registration: ObjectId, // Reference to Registration
  email: String,
  passwordHash: String,
  isVerified: Boolean,
  verificationToken: String,
  verificationExpires: Date,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  lastLogin: Date,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}

// EventAnnouncement Model
{
  event: ObjectId, // Reference to Event
  title: String,
  content: String,
  isPublished: Boolean,
  publishedAt: Date,
  categories: [ObjectId], // References to Category
  createdBy: ObjectId, // Reference to User
  createdAt: Date,
  updatedAt: Date
}

// EventResource Model
{
  event: ObjectId, // Reference to Event
  title: String,
  description: String,
  fileUrl: String,
  fileType: String,
  fileSize: Number,
  isPublic: Boolean,
  categories: [ObjectId], // References to Category
  createdBy: ObjectId, // Reference to User
  createdAt: Date,
  updatedAt: Date
}
```

### Abstract Submission Workflows Implementation (2023-04-10)
- Created MongoDB models for AbstractSettings with workflow configuration support
- Enhanced Abstract model with review details, submission types, and workflow status
- Implemented controllers for abstract submissions, reviews, and administration
- Added validation schemas for all abstract workflow operations
- Created APIs for reviewer assignment, review submission, and abstract decisions
- Implemented automated email notifications for workflow events
- Added statistics and reporting for abstract submissions
- Created frontend components for abstract submission, listing, and review in the registrant portal
- Developed frontend components in the registrant portal:
  - `AbstractSubmissionForm`: A comprehensive form supporting various submission types, keywords, additional authors, and file attachments
  - `AbstractsList`: A dashboard showing all user's submitted abstracts with status indicators
  - `AbstractDetail`: Detailed view of submitted abstracts with review feedback and decision history
- Added routes in the registrant portal for abstract management
- Created responsive UI with validation for abstract submissions
- Implemented real-time word count monitoring for abstract content
- Added support for custom fields defined in abstract settings
- Integrated review feedback display and revision workflow

#### API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------------|
| GET | `/api/events/:eventId/abstract-workflow/settings` | Get abstract settings | Yes |
| POST | `/api/events/:eventId/abstract-workflow/settings` | Update abstract settings | Yes |
| GET | `/api/events/:eventId/abstract-workflow/reviewers` | Get available reviewers | Yes |
| POST | `/api/events/:eventId/abstract-workflow/auto-assign-reviewers` | Auto-assign reviewers | Yes |
| GET | `/api/events/:eventId/abstract-workflow` | List abstracts | Yes |
| POST | `/api/events/:eventId/abstract-workflow` | Submit abstract | No* |
| GET | `/api/events/:eventId/abstract-workflow/review-statistics` | Get review statistics | Yes |
| GET | `/api/events/:eventId/abstract-workflow/pending-reviews` | Get pending reviews | Yes |
| GET | `/api/events/:eventId/abstract-workflow/my-reviews` | Get current user's reviews | Yes |
| GET | `/api/events/:eventId/abstract-workflow/:abstractId` | Get abstract by ID | Mixed** |
| POST | `/api/events/:eventId/abstract-workflow/:abstractId/assign-reviewers` | Assign reviewers | Yes |
| POST | `/api/events/:eventId/abstract-workflow/:abstractId/review` | Submit review | Yes |
| POST | `/api/events/:eventId/abstract-workflow/:abstractId/approve` | Approve abstract | Yes |
| POST | `/api/events/:eventId/abstract-workflow/:abstractId/reject` | Reject abstract | Yes |
| POST | `/api/events/:eventId/abstract-workflow/:abstractId/request-revision` | Request revision | Yes |

\* While no authentication required, validation is performed based on the event settings
\** Authors can view their own abstracts, reviewers can view assigned abstracts, admins can view all

#### Data Models

```javascript
// AbstractSettings Model
{
  event: ObjectId, // Reference to Event
  submissionWorkflow: [String], // post-registration, pre-registration
  abstractTypes: [
    {
      name: String,
      displayName: String,
      description: String,
      isDefault: Boolean
    }
  ],
  startDate: Date,
  endDate: Date,
  wordLimit: Number,
  isActive: Boolean,
  acceptsResubmission: Boolean,
  fileAttachmentsAllowed: Boolean,
  maxFileSize: Number,
  allowedFileTypes: [String],
  reviewers: [
    {
      user: ObjectId,
      maxAssignments: Number
    }
  ],
  customFields: [
    {
      name: String,
      label: String,
      type: String, // text, number, select, etc.
      options: [String],
      isRequired: Boolean,
      order: Number
    }
  ],
  autoAssignReviewers: Boolean,
  createdBy: ObjectId,
  createdAt: Date,
  updatedAt: Date
}

// Abstract Model (Enhanced for Workflow)
{
  // ... existing fields ...
  submissionPath: String, // post-registration, pre-registration
  submissionType: String, // oral, poster, workshop, etc.
  abstractNumber: String,
  keywords: [String],
  additionalAuthors: [
    {
      name: String,
      email: String,
      organization: String,
      isPrimaryContact: Boolean
    }
  ],
  customFields: Object,
  reviewDetails: {
    assignedTo: [ObjectId], // References to User
    reviews: [
      {
        reviewer: ObjectId, // Reference to User
        score: Number,
        comments: String,
        decision: String, // accept, reject, revise, undecided
        isComplete: Boolean,
        reviewedAt: Date
      }
    ],
    averageScore: Number,
    finalDecision: String, // accepted, rejected, revision-requested, pending
    decisionReason: String,
    decisionDate: Date,
    decisionBy: ObjectId, // Reference to User
    decisionHistory: [
      {
        decision: String,
        reason: String,
        decidedBy: ObjectId,
        decidedAt: Date
      }
    ]
  }
}
```

### Admin Panel Enhancements Implementation (2023-04-11)
- Extended User model with additional permissions for new features
- Added Category model extensions for workshop permissions, abstract permissions, and portal features
- Created CustomField model for creating dynamic form fields in various sections
- Implemented controllers and routes for admin settings
- Created validation schemas for all admin settings operations
- Added support for event tab settings management
- Developed user permission management functionality
- Implemented sponsor admin creation capability

#### API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------------|
| GET | `/api/admin-settings/event-settings/:eventId/tabs` | Get available settings tabs for an event | Yes |
| GET | `/api/admin-settings/event-settings/:eventId/:tab` | Get settings for a specific tab | Yes |
| PUT | `/api/admin-settings/event-settings/:eventId/:tab` | Update settings for a specific tab | Yes |
| PUT | `/api/admin-settings/user-permissions/:userId` | Update user permissions | Yes (Admin) |
| POST | `/api/admin-settings/sponsor-admin` | Create a sponsor admin account | Yes (Admin) |
| POST | `/api/custom-fields` | Create a custom field | Yes |
| GET | `/api/custom-fields/:id` | Get a custom field by ID | Yes |
| PUT | `/api/custom-fields/:id` | Update a custom field | Yes |
| DELETE | `/api/custom-fields/:id` | Delete a custom field | Yes |
| GET | `/api/custom-fields/event/:eventId` | Get custom fields for an event | Yes |

#### Data Models

```javascript
// Extended User Model
{
  // ... existing fields
  extendedPermissions: {
    canManageLandingPages: Boolean,
    canManagePayments: Boolean,
    canManageSponsors: Boolean,
    canManageWorkshops: Boolean,
    canReviewAbstracts: Boolean,
    canManageHotelTravel: Boolean
  },
  isSponsorAdmin: Boolean,
  sponsorOrganization: ObjectId // Reference to Sponsor
}

// Extended Category Model
{
  // ... existing fields
  workshopPermissions: {
    canRegister: Boolean,
    workshopIds: [ObjectId] // References to Workshop
  },
  abstractPermissions: {
    canSubmit: Boolean,
    allowedTypes: [String],
    maxSubmissions: Number
  },
  additionalDataFields: [ObjectId], // References to CustomField
  portalFeatures: {
    canViewAgenda: Boolean,
    canDownloadMaterials: Boolean,
    canViewCertificates: Boolean
  }
}

// CustomField Model
{
  event: ObjectId, // Reference to Event
  formType: String, // registration, abstract, workshop, category, travel
  name: String,
  label: String,
  type: String, // text, textarea, number, email, select, checkbox, radio, date, file
  options: [String], // For select, checkbox, radio types
  placeholder: String,
  defaultValue: Mixed,
  isRequired: Boolean,
  validations: {
    minLength: Number,
    maxLength: Number,
    pattern: String,
    min: Number,
    max: Number,
    fileTypes: [String],
    maxFileSize: Number
  },
  visibleTo: String, // all, admin, specific-categories
  categories: [ObjectId], // References to Category
  conditionalLogic: {
    isConditional: Boolean,
    dependsOn: String,
    condition: String, // equals, not-equals, contains, not-contains, greater-than, less-than
    value: Mixed
  },
  order: Number,
  isActive: Boolean,
  createdBy: ObjectId, // Reference to User
  createdAt: Date,
  updatedAt: Date
}
``` 
 