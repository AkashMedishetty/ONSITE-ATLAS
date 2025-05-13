# ONSITE ATLAS Extension: Event Portal & Payment Management System

## Objective
Extend the ONSITE ATLAS conference management system with a comprehensive event portal, advanced registration workflows, payment processing, sponsor management, and enhanced registrant features while maintaining the existing architecture and code quality standards.

## Table of Contents
1. [Landing Page Builder](#landing-page-builder)
2. [Payment Gateway Integration](#payment-gateway-integration)
3. [Advanced Pricing System](#advanced-pricing-system)
4. [Workshop Management](#workshop-management)
5. [Registrant Portal](#registrant-portal)
6. [Abstract Submission Workflows](#abstract-submission-workflows)
7. [Admin Panel Enhancements](#admin-panel-enhancements)
8. [Client Dashboard & Analytics](#client-dashboard-analytics)
9. [Sponsor Management](#sponsor-management)
10. [Notification System](#notification-system)
11. [Hotel & Travel Tracking](#hotel-travel-tracking)
12. [Data Export & Reporting](#data-export-reporting)

## Detailed Requirements

### Landing Page Builder
<a name="landing-page-builder"></a>

#### Core Functionality
- Create a flexible landing page builder system supporting both template-based and drag-and-drop approaches
- Implement event-specific landing pages with customizable components
- Enable integration with registration forms
- Support custom HTML/CSS/JavaScript page import

#### Implementation Details

1. **Component System**
   - Create modular UI components for landing pages:
     - Hero sections (with customizable backgrounds, text, buttons)
     - Event details (date, venue, speakers)
     - Schedule/agenda blocks
     - Speaker/presenter showcases
     - Registration form embedding
     - Countdown timers
     - Sponsor showcases
     - Gallery/media sections
     - Custom HTML/JS/CSS sections

2. **Builder Interface**
   - Develop dual builder modes:
     - **Template Mode**: Pre-designed templates with configurable sections
     - **Advanced Mode**: Drag-and-drop interface with gridded layout system
   - Create preview functionality showing desktop/tablet/mobile views
   - Implement version history and draft/publish workflow

3. **Custom Page Integration**
   - Add "Import Custom Page" functionality supporting:
     - HTML/CSS file upload
     - JavaScript integration
     - External page embedding via iframe (with security considerations)
     - Custom code editor for direct HTML/CSS/JS editing

4. **Database Model Extensions**

```javascript
// LandingPage.js
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
    unique: true,
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
```

5. **API Routes**

```javascript
// landingPage.routes.js
router.get('/:eventId/landing-pages', auth, catchAsync(landingPageController.getLandingPages));
router.post('/:eventId/landing-pages', auth, authorize('admin', 'manager'), validateBody(landingPageSchema.create), catchAsync(landingPageController.createLandingPage));
router.get('/:eventId/landing-pages/:id', auth, catchAsync(landingPageController.getLandingPageById));
router.put('/:eventId/landing-pages/:id', auth, authorize('admin', 'manager'), validateBody(landingPageSchema.update), catchAsync(landingPageController.updateLandingPage));
router.delete('/:eventId/landing-pages/:id', auth, authorize('admin', 'manager'), catchAsync(landingPageController.deleteLandingPage));
router.post('/:eventId/landing-pages/:id/publish', auth, authorize('admin', 'manager'), catchAsync(landingPageController.publishLandingPage));
router.get('/:eventId/landing-pages/:id/preview', auth, catchAsync(landingPageController.previewLandingPage));
router.post('/:eventId/landing-pages/import-html', auth, authorize('admin', 'manager'), upload.single('htmlFile'), catchAsync(landingPageController.importHtmlPage));
router.post('/:eventId/landing-pages/:id/versions/:versionId/restore', auth, authorize('admin', 'manager'), catchAsync(landingPageController.restoreVersion));
```

6. **Public Endpoints**

```javascript
// public.routes.js
router.get('/event/:eventSlug', catchAsync(publicController.renderLandingPage));
router.get('/e/:shortCode', catchAsync(publicController.handleShortUrl));
```

7. **Controller Functions**

```javascript
// Key controller methods
getLandingPages // Get all landing pages for an event
createLandingPage // Create new landing page 
getLandingPageById // Get landing page by ID
updateLandingPage // Update landing page
deleteLandingPage // Delete landing page
publishLandingPage // Publish landing page version
previewLandingPage // Preview draft version
importHtmlPage // Import custom HTML page
restoreVersion // Restore previous version
renderLandingPage // Render public landing page
```

### Payment Gateway Integration
<a name="payment-gateway-integration"></a>

#### Core Functionality
- Implement modular payment gateway system with multiple provider support
- Create unified payment processing workflow
- Generate configurable invoices/receipts
- Support transaction tracking and reconciliation

#### Implementation Details

1. **Supported Payment Gateways**
   - Stripe
   - PayPal
   - Razorpay
   - Instamojo
   - Extensible framework for future additions

2. **Gateway Configuration System**
   - Create unified configuration interface in admin panel
   - Implement secure API key storage (encrypted)
   - Enable test/live mode toggling
   - Configure webhook endpoints for payment notifications

3. **Unified Payment Processing**
   - Create abstraction layer for consistent API across gateways
   - Implement gateway-specific adapters for each provider
   - Handle currency conversion if needed
   - Process refunds and cancellations

4. **Invoice/Receipt Generation**
   - Create customizable invoice/receipt templates
   - Support automatic generation after successful payment
   - Enable PDF download and email delivery
   - Include configurable tax handling

5. **Database Model Extensions**

```javascript
// PaymentGateway.js
const paymentGatewaySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    enum: ['stripe', 'paypal', 'razorpay', 'instamojo']
  },
  displayName: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: false
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  configuration: {
    type: Object,
    required: true
  },
  testMode: {
    type: Boolean,
    default: true
  },
  supportedCurrencies: [String],
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

// Payment.js
const paymentSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  registration: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Registration'
  },
  gateway: {
    type: String,
    required: true,
    enum: ['stripe', 'paypal', 'razorpay', 'instamojo']
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    required: true,
    default: 'USD'
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded', 'partially_refunded'],
    default: 'pending'
  },
  gatewayTransactionId: {
    type: String
  },
  gatewayResponse: {
    type: Object
  },
  items: [{
    type: {
      type: String,
      enum: ['registration', 'workshop', 'addon'],
      required: true
    },
    name: String,
    description: String,
    quantity: {
      type: Number,
      default: 1
    },
    unitPrice: Number,
    totalPrice: Number
  }],
  invoiceNumber: String,
  invoiceUrl: String,
  receiptUrl: String,
  notes: String,
  metadata: {
    type: Object
  },
  refunds: [{
    amount: Number,
    reason: String,
    gatewayRefundId: String,
    refundedAt: Date,
    refundedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed']
    }
  }],
  paidAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// InvoiceTemplate.js
const invoiceTemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  headerLogo: String,
  footerText: String,
  companyDetails: {
    name: String,
    address: String,
    taxId: String,
    contactInfo: String
  },
  templateHtml: {
    type: String,
    required: true
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
// payment.routes.js
router.get('/gateways', auth, catchAsync(paymentController.getPaymentGateways));
router.post('/gateways', auth, authorize('admin'), validateBody(paymentSchema.createGateway), catchAsync(paymentController.createPaymentGateway));
router.put('/gateways/:id', auth, authorize('admin'), validateBody(paymentSchema.updateGateway), catchAsync(paymentController.updatePaymentGateway));
router.delete('/gateways/:id', auth, authorize('admin'), catchAsync(paymentController.deletePaymentGateway));
router.post('/process', validateBody(paymentSchema.processPayment), catchAsync(paymentController.processPayment));
router.post('/verify', catchAsync(paymentController.verifyPayment));
router.get('/:id', auth, catchAsync(paymentController.getPaymentById));
router.post('/:id/refund', auth, authorize('admin', 'manager'), validateBody(paymentSchema.refundPayment), catchAsync(paymentController.refundPayment));
router.get('/invoice-templates', auth, catchAsync(paymentController.getInvoiceTemplates));
router.post('/invoice-templates', auth, authorize('admin'), validateBody(paymentSchema.createInvoiceTemplate), catchAsync(paymentController.createInvoiceTemplate));
router.put('/invoice-templates/:id', auth, authorize('admin'), validateBody(paymentSchema.updateInvoiceTemplate), catchAsync(paymentController.updateInvoiceTemplate));
router.delete('/invoice-templates/:id', auth, authorize('admin'), catchAsync(paymentController.deleteInvoiceTemplate));
router.get('/:id/invoice', catchAsync(paymentController.getInvoice));
router.get('/:id/receipt', catchAsync(paymentController.getReceipt));
```

7. **Controller Functions**

```javascript
// Key controller methods
getPaymentGateways // Get all payment gateways
createPaymentGateway // Create new gateway configuration
updatePaymentGateway // Update gateway configuration
deletePaymentGateway // Delete gateway configuration
processPayment // Process payment through selected gateway
verifyPayment // Verify payment status (webhook handler)
getPaymentById // Get payment details
refundPayment // Process refund
getInvoiceTemplates // Get invoice templates
createInvoiceTemplate // Create invoice template
updateInvoiceTemplate // Update invoice template
deleteInvoiceTemplate // Delete invoice template
getInvoice // Generate/retrieve invoice
getReceipt // Generate/retrieve receipt
```

8. **Payment Gateway Adapters**

```javascript
// Gateway adapter interface implementation
class PaymentGatewayAdapter {
  constructor(config) {
    this.config = config;
  }
  
  async initialize() { /* Gateway-specific initialization */ }
  async createPaymentIntent(amount, currency, metadata) { /* Create payment intent */ }
  async verifyPayment(payload) { /* Verify payment status */ }
  async processRefund(transactionId, amount, reason) { /* Process refund */ }
  getClientConfig() { /* Get client-side configuration */ }
}

// Implementation for each supported gateway
class StripeAdapter extends PaymentGatewayAdapter { /* Stripe-specific implementation */ }
class PayPalAdapter extends PaymentGatewayAdapter { /* PayPal-specific implementation */ }
class RazorpayAdapter extends PaymentGatewayAdapter { /* Razorpay-specific implementation */ }
class InstamojoAdapter extends PaymentGatewayAdapter { /* Instamojo-specific implementation */ }
```

### Advanced Pricing System
<a name="advanced-pricing-system"></a>

#### Core Functionality
- Implement multi-dimensional pricing matrix (category × timing tier)
- Support workshop pricing with add-on model
- Enable dynamic price calculation during registration
- Create comprehensive pricing management interface

#### Implementation Details

1. **Pricing Matrix Configuration**
   - Create category-based pricing structure
   - Implement timing tiers (early bird, normal, onsite)
   - Support date-driven automatic tier transitions
   - Enable custom pricing rules and discounts

2. **Workshop Pricing**
   - Configure per-workshop pricing
   - Support capacity limits with real-time availability
   - Allow independent workshop-only registration
   - Implement add-on pricing for conference registrants

3. **Dynamic Price Calculation**
   - Create pricing engine to calculate totals based on selections
   - Support real-time price updates on registration form
   - Handle tax calculations and currency formatting
   - Support discount codes and special offers

4. **Database Model Extensions**

```javascript
// PricingTier.js
const pricingTierSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  name: {
    type: String,
    required: true,
    enum: ['early-bird', 'normal', 'onsite']
  },
  displayName: {
    type: String,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: false
  },
  order: {
    type: Number,
    default: 0
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

// CategoryPrice.js
const categoryPriceSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  pricingTier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PricingTier',
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    required: true,
    default: 'USD'
  },
  description: String,
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

// Workshop.js
const workshopSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  startDateTime: Date,
  endDateTime: Date,
  venue: String,
  capacity: {
    type: Number,
    required: true
  },
  registrations: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Registration'
  }],
  availableFor: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  price: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    required: true,
    default: 'USD'
  },
  allowIndependentRegistration: {
    type: Boolean,
    default: false
  },
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

// Extend Event model with pricing settings
// Add to existing Event.js model
eventSchema.add({
  pricingSettings: {
    currency: {
      type: String,
      default: 'USD'
    },
    taxPercentage: {
      type: Number,
      default: 0
    },
    displayTaxSeparately: {
      type: Boolean,
      default: false
    },
    allowPartialPayments: {
      type: Boolean,
      default: false
    },
    autoSwitchPricingTiers: {
      type: Boolean,
      default: true
    }
  }
});
```

5. **API Routes**

```javascript
// pricing.routes.js
router.get('/:eventId/pricing-tiers', auth, catchAsync(pricingController.getPricingTiers));
router.post('/:eventId/pricing-tiers', auth, authorize('admin', 'manager'), validateBody(pricingSchema.createTier), catchAsync(pricingController.createPricingTier));
router.put('/:eventId/pricing-tiers/:id', auth, authorize('admin', 'manager'), validateBody(pricingSchema.updateTier), catchAsync(pricingController.updatePricingTier));
router.delete('/:eventId/pricing-tiers/:id', auth, authorize('admin', 'manager'), catchAsync(pricingController.deletePricingTier));

router.get('/:eventId/category-prices', auth, catchAsync(pricingController.getCategoryPrices));
router.post('/:eventId/category-prices', auth, authorize('admin', 'manager'), validateBody(pricingSchema.createCategoryPrice), catchAsync(pricingController.createCategoryPrice));
router.put('/:eventId/category-prices/:id', auth, authorize('admin', 'manager'), validateBody(pricingSchema.updateCategoryPrice), catchAsync(pricingController.updateCategoryPrice));
router.delete('/:eventId/category-prices/:id', auth, authorize('admin', 'manager'), catchAsync(pricingController.deleteCategoryPrice));

router.post('/:eventId/calculate-price', validateBody(pricingSchema.calculatePrice), catchAsync(pricingController.calculatePrice));
```

6. **Workshop Routes**

```javascript
// workshop.routes.js
router.get('/:eventId/workshops', catchAsync(workshopController.getWorkshops));
router.post('/:eventId/workshops', auth, authorize('admin', 'manager'), validateBody(workshopSchema.createWorkshop), catchAsync(workshopController.createWorkshop));
router.get('/:eventId/workshops/:id', catchAsync(workshopController.getWorkshopById));
router.put('/:eventId/workshops/:id', auth, authorize('admin', 'manager'), validateBody(workshopSchema.updateWorkshop), catchAsync(workshopController.updateWorkshop));
router.delete('/:eventId/workshops/:id', auth, authorize('admin', 'manager'), catchAsync(workshopController.deleteWorkshop));
router.get('/:eventId/workshops/:id/availability', catchAsync(workshopController.getWorkshopAvailability));
router.post('/:eventId/workshops/:id/register', validateBody(workshopSchema.registerForWorkshop), catchAsync(workshopController.registerForWorkshop));
```

7. **Controller Functions**

```javascript
// Pricing controller methods
getPricingTiers // Get pricing tiers for event
createPricingTier // Create pricing tier
updatePricingTier // Update pricing tier
deletePricingTier // Delete pricing tier
getCategoryPrices // Get category prices
createCategoryPrice // Create category price
updateCategoryPrice // Update category price
deleteCategoryPrice // Delete category price
calculatePrice // Calculate price based on selections

// Workshop controller methods
getWorkshops // Get workshops for event
createWorkshop // Create workshop
getWorkshopById // Get workshop by ID
updateWorkshop // Update workshop
deleteWorkshop // Delete workshop
getWorkshopAvailability // Get real-time availability
registerForWorkshop // Register for workshop
```

### Workshop Management
<a name="workshop-management"></a>

#### Core Functionality
- Create comprehensive workshop management system
- Implement capacity management and registration 
- Support workshop-only registrations
- Enable category-specific workshop availability

#### Implementation Details

1. **Workshop Configuration**
   - Create, edit, delete workshops for events
   - Configure workshop details (title, description, date/time, venue)
   - Set capacity limits and track availability
   - Configure pricing and registration options
   - Restrict workshops to specific categories

2. **Registration Integration**
   - Allow workshop selection during registration
   - Show real-time availability during registration process
   - Support workshop-only registration option
   - Update total price based on workshop selections

3. **Workshop Management**
   - Track registrations for each workshop
   - Monitor attendance and no-shows
   - Generate workshop attendee lists
   - Export workshop registration data

4. **Workshop Reporting**
   - Track registration numbers and capacity utilization
   - Generate revenue reports for workshops
   - Export workshop attendee information
   - Analyze workshop popularity and demographics

5. **API Routes** (in addition to routes defined in pricing section)

```javascript
// Additional workshop-related routes
router.get('/:eventId/workshops/:id/attendees', auth, catchAsync(workshopController.getWorkshopAttendees));
router.post('/:eventId/workshops/:id/check-in/:registrationId', auth, catchAsync(workshopController.checkInWorkshopAttendee));
router.get('/:eventId/workshops/:id/export-attendees', auth, catchAsync(workshopController.exportWorkshopAttendees));
router.get('/:eventId/workshops/reports', auth, catchAsync(workshopController.getWorkshopReports));
```

6. **Controller Functions**

```javascript
// Additional workshop controller methods
getWorkshopAttendees // Get list of workshop attendees
checkInWorkshopAttendee // Record workshop attendance
exportWorkshopAttendees // Export workshop attendee list
getWorkshopReports // Get workshop utilization reports
```

### Registrant Portal
<a name="registrant-portal"></a>

#### Core Functionality
- Create dedicated portal for registered attendees
- Enable profile management and event information
- Provide abstract submission interface
- Support credential management and notifications

#### Implementation Details

1. **Authentication & Access**
   - Create secure login process for registrants
   - Send login credentials after successful registration
   - Implement password reset and account recovery
   - Enable session management and security features

2. **Profile Management**
   - View and edit personal information
   - Update editable fields (configurable per event)
   - View registration details and payment information
   - Download invoice/receipt

3. **Event Information**
   - View event agenda and schedule
   - Access event announcements and updates
   - Download event materials and resources
   - View workshop registrations

4. **Abstract Management**
   - Submit new abstracts (if enabled)
   - View abstract status and feedback
   - Edit abstracts (if allowed and within deadline)
   - View abstract acceptance notifications

5. **Certificate & Resources**
   - Download attendance certificates (post-event)
   - Access presentation materials
   - View participation records

6. **Database Model Extensions**

```javascript
// RegistrantAccount.js
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

// EventAnnouncement.js
const eventAnnouncementSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  publishedAt: Date,
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

// EventResource.js
const eventResourceSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  fileUrl: String,
  fileType: String,
  fileSize: Number,
  isPublic: {
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
```

7. **API Routes**

```javascript
// registrantPortal.routes.js
router.post('/login', validateBody(registrantSchema.login), catchAsync(registrantPortalController.login));
router.post('/register', validateBody(registrantSchema.register), catchAsync(registrantPortalController.register));
router.post('/forgot-password', validateBody(registrantSchema.forgotPassword), catchAsync(registrantPortalController.forgotPassword));
router.post('/reset-password', validateBody(registrantSchema.resetPassword), catchAsync(registrantPortalController.resetPassword));
router.post('/verify', validateBody(registrantSchema.verify), catchAsync(registrantPortalController.verifyAccount));

// Protected registrant routes (require registrant authentication)
router.get('/profile', registrantAuth, catchAsync(registrantPortalController.getProfile));
router.put('/profile', registrantAuth, validateBody(registrantSchema.updateProfile), catchAsync(registrantPortalController.updateProfile));
router.get('/registration', registrantAuth, catchAsync(registrantPortalController.getRegistration));
router.get('/payments', registrantAuth, catchAsync(registrantPortalController.getPayments));
router.get('/payments/:id/invoice', registrantAuth, catchAsync(registrantPortalController.getInvoice));

router.get('/event', registrantAuth, catchAsync(registrantPortalController.getEventDetails));
router.get('/announcements', registrantAuth, catchAsync(registrantPortalController.getAnnouncements));
router.get('/resources', registrantAuth, catchAsync(registrantPortalController.getResources));
router.get('/resources/:id', registrantAuth, catchAsync(registrantPortalController.downloadResource));

router.get('/workshops', registrantAuth, catchAsync(registrantPortalController.getWorkshops));
router.post('/workshops/:id/register', registrantAuth, catchAsync(registrantPortalController.registerForWorkshop));

router.get('/abstracts', registrantAuth, catchAsync(registrantPortalController.getAbstracts));
router.post('/abstracts', registrantAuth, validateBody(registrantSchema.submitAbstract), catchAsync(registrantPortalController.submitAbstract));
router.get('/abstracts/:id', registrantAuth, catchAsync(registrantPortalController.getAbstractById));
router.put('/abstracts/:id', registrantAuth, validateBody(registrantSchema.updateAbstract), catchAsync(registrantPortalController.updateAbstract));

router.get('/certificates', registrantAuth, catchAsync(registrantPortalController.getCertificates));
router.get('/certificates/:id', registrantAuth, catchAsync(registrantPortalController.downloadCertificate));
```

8. **Controller Functions**

```javascript
// Registrant portal controller methods
login // Authenticate registrant
register // Register new registrant account
forgotPassword // Send password reset email
resetPassword // Reset password with token
verifyAccount // Verify account with token
getProfile // Get regist