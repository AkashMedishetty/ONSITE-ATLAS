# Backend Documentation: Onsite Atlas

## Table of Contents
1. [Overview](#overview)
2. [Project Structure](#project-structure)
3. [API Endpoints](#api-endpoints)
4. [Database Models](#database-models)
5. [Controllers](#controllers)
6. [Authentication and Authorization](#authentication-and-authorization)
7. [Error Handling](#error-handling)
8. [Middleware](#middleware)
9. [Validation](#validation)
10. [Identified Issues](#identified-issues)

## Overview

The Onsite Atlas backend is built with Node.js and Express, using MongoDB as the database. It provides RESTful API endpoints for the frontend application to manage events, registrations, resources, categories, and abstracts.

**Key Technologies:**
- Node.js with Express
- MongoDB with Mongoose
- JWT for authentication
- Express middleware for request handling

## Project Structure

The backend follows a modular structure:

```
server/src/
├── controllers/        # API controller logic
├── models/             # MongoDB schema models
├── routes/             # API route definitions
├── middleware/         # Express middleware
├── validation/         # Request validation schemas
├── utils/              # Utility functions
├── config/             # Configuration files
├── services/           # Third-party service integrations
└── index.js            # Server entry point
```

## API Endpoints

### Authentication Endpoints

| Method | Endpoint | Controller | Description |
|--------|----------|------------|-------------|
| POST | /api/auth/login | authController.login | User login |
| POST | /api/auth/register | authController.register | User registration |
| POST | /api/auth/logout | authController.logout | User logout |
| POST | /api/auth/forgot-password | authController.forgotPassword | Request password reset |
| POST | /api/auth/reset-password | authController.resetPassword | Reset password with token |

### Event Endpoints

| Method | Endpoint | Controller | Description |
|--------|----------|------------|-------------|
| GET | /api/events | eventController.getEvents | Get all events (with pagination) |
| POST | /api/events | eventController.createEvent | Create new event |
| GET | /api/events/:id | eventController.getEventById | Get event by ID |
| PUT | /api/events/:id | eventController.updateEvent | Update event |
| DELETE | /api/events/:id | eventController.deleteEvent | Delete event (soft delete) |
| GET | /api/events/:id/dashboard | eventController.getEventDashboard | Get event dashboard data |
| GET | /api/events/:id/statistics | eventController.getEventStatistics | Get event statistics |

### Registration Endpoints

| Method | Endpoint | Controller | Description |
|--------|----------|------------|-------------|
| GET | /api/registrations | registrationController.getRegistrations | Get all registrations |
| GET | /api/events/:eventId/registrations | registrationController.getRegistrations | Get registrations for event |
| POST | /api/registrations | registrationController.createRegistration | Create new registration |
| GET | /api/registrations/:id | registrationController.getRegistrationById | Get registration by ID |
| PUT | /api/registrations/:id | registrationController.updateRegistration | Update registration |
| DELETE | /api/registrations/:id | registrationController.deleteRegistration | Delete registration |
| POST | /api/events/:eventId/registrations/import | registrationController.importRegistrations | Import registrations in bulk |
| POST | /api/registrations/validate | registrationController.validateRegistration | Validate registration ID |

### Category Endpoints

| Method | Endpoint | Controller | Description |
|--------|----------|------------|-------------|
| GET | /api/categories | categoryController.getCategories | Get all categories |
| GET | /api/events/:eventId/categories | categoryController.getEventCategories | Get categories for event |
| POST | /api/categories | categoryController.createCategory | Create new category |
| GET | /api/categories/:id | categoryController.getCategoryById | Get category by ID |
| PUT | /api/categories/:id | categoryController.updateCategory | Update category |
| DELETE | /api/categories/:id | categoryController.deleteCategory | Delete category |
| PUT | /api/categories/:id/resources | categoryController.updateCategoryResources | Update category resources |

### Resource Endpoints

| Method | Endpoint | Controller | Description |
|--------|----------|------------|-------------|
| GET | /api/resources | resourceController.getResources | Get all resources |
| GET | /api/events/:eventId/resources | resourceController.getEventResources | Get resources for event |
| GET | /api/events/:eventId/resources/food/config | resourceController.getFoodConfig | Get food configuration |
| GET | /api/events/:eventId/resources/food/recent | resourceController.getRecentFoodScans | Get recent food scans |
| GET | /api/events/:eventId/resources/food/statistics | resourceController.getFoodStatistics | Get food statistics |
| POST | /api/events/:eventId/resources/food | resourceController.recordFoodDistribution | Record food distribution |
| GET | /api/events/:eventId/resources/kits/items | resourceController.getKitItems | Get kit bag items |
| GET | /api/events/:eventId/resources/kits/recent | resourceController.getRecentKitDistributions | Get recent kit distributions |
| GET | /api/events/:eventId/resources/kits/statistics | resourceController.getKitStatistics | Get kit distribution statistics |
| POST | /api/events/:eventId/resources/kits | resourceController.recordKitDistribution | Record kit distribution |
| GET | /api/events/:eventId/resources/certificates/types | resourceController.getCertificateTypes | Get certificate types |
| POST | /api/events/:eventId/resources/certificates | resourceController.issueCertificate | Issue certificate |
| PUT | /api/resources/:id/void | resourceController.voidResource | Void a resource issuance |

### Abstract Endpoints

| Method | Endpoint | Controller | Description |
|--------|----------|------------|-------------|
| GET | /api/abstracts | abstractController.getAbstracts | Get all abstracts |
| GET | /api/events/:eventId/abstracts | abstractController.getEventAbstracts | Get abstracts for event |
| POST | /api/abstracts | abstractController.createAbstract | Create new abstract |
| GET | /api/abstracts/:id | abstractController.getAbstract | Get abstract by ID |
| PUT | /api/abstracts/:id | abstractController.updateAbstract | Update abstract |
| DELETE | /api/abstracts/:id | abstractController.deleteAbstract | Delete abstract |
| PUT | /api/abstracts/:id/review | abstractController.reviewAbstract | Review abstract |
| GET | /api/events/:eventId/abstracts/download | abstractController.downloadAbstracts | Download abstracts |

### Badge Endpoints (Needed by Frontend)

| Method | Endpoint | Controller | Description |
|--------|----------|------------|-------------|
| GET | /api/events/:eventId/badges/templates | badgeController.getBadgeTemplates | Get badge templates for event |
| GET | /api/events/:eventId/badges/templates/:id | badgeController.getBadgeTemplate | Get specific badge template |
| POST | /api/events/:eventId/badges/templates | badgeController.createBadgeTemplate | Create badge template |
| PUT | /api/events/:eventId/badges/templates/:id | badgeController.updateBadgeTemplate | Update badge template |
| DELETE | /api/events/:eventId/badges/templates/:id | badgeController.deleteBadgeTemplate | Delete badge template |
| POST | /api/events/:eventId/badges/generate | badgeController.generateBadges | Generate badges for printing |
| POST | /api/events/:eventId/badges/preview | badgeController.previewBadge | Preview badge for a registration |

### Report Endpoints (Needed by Frontend)

| Method | Endpoint | Controller | Description |
|--------|----------|------------|-------------|
| GET | /api/reports | reportController.getReports | Get all available reports |
| GET | /api/events/:eventId/reports | reportController.getEventReports | Get reports for event |
| POST | /api/events/:eventId/reports/generate | reportController.generateReport | Generate custom report |
| GET | /api/events/:eventId/reports/templates | reportController.getReportTemplates | Get report templates |
| POST | /api/events/:eventId/reports/templates | reportController.createReportTemplate | Create report template |
| PUT | /api/events/:eventId/reports/templates/:id | reportController.updateReportTemplate | Update report template |

### User Management Endpoints (Needed by Frontend)

| Method | Endpoint | Controller | Description |
|--------|----------|------------|-------------|
| GET | /api/users | userController.getUsers | Get all users |
| POST | /api/users | userController.createUser | Create new user |
| GET | /api/users/:id | userController.getUserById | Get user by ID |
| PUT | /api/users/:id | userController.updateUser | Update user |
| DELETE | /api/users/:id | userController.deleteUser | Delete user |
| GET | /api/roles | userController.getRoles | Get all roles |
| POST | /api/roles | userController.createRole | Create new role |
| PUT | /api/roles/:id | userController.updateRole | Update role |
| DELETE | /api/roles/:id | userController.deleteRole | Delete role |

### Email Template Endpoints (Needed by Frontend)

| Method | Endpoint | Controller | Description |
|--------|----------|------------|-------------|
| GET | /api/email-templates | emailController.getTemplates | Get all email templates |
| GET | /api/events/:eventId/email-templates | emailController.getEventTemplates | Get email templates for event |
| POST | /api/events/:eventId/email-templates | emailController.createTemplate | Create email template |
| PUT | /api/events/:eventId/email-templates/:id | emailController.updateTemplate | Update email template |
| DELETE | /api/events/:eventId/email-templates/:id | emailController.deleteTemplate | Delete email template |
| POST | /api/events/:eventId/email-templates/:id/test | emailController.testTemplate | Send test email using template |

### Scanner Endpoints (Needed by Frontend)

| Method | Endpoint | Controller | Description |
|--------|----------|------------|-------------|
| POST | /api/scan/validate | scannerController.validateScan | Validate a QR code scan |
| POST | /api/scan/checkin | scannerController.checkinScan | Check in an attendee via QR scan |
| GET | /api/events/:eventId/scan/recent | scannerController.getRecentScans | Get recent scans for event |

### Debug Endpoints (Development Only)

| Method | Endpoint | Controller | Description |
|--------|----------|------------|-------------|
| GET | /api/debug/ping | debugController.ping | Health check |
| GET | /api/debug/error | debugController.generateError | Generate test error |

## Database Models

### User Model

```javascript
{
  _id: ObjectId,
  email: String,
  password: String, // Hashed
  name: String,
  role: String, // 'admin', 'staff', 'reviewer'
  permissions: [String],
  createdAt: Date,
  updatedAt: Date
}
```

Key Methods:
- `comparePassword(candidatePassword)` - Compare provided password with stored hash
- `generateAuthToken()` - Generate JWT token for authentication

### Event Model

```javascript
{
  _id: ObjectId,
  name: String,
  description: String,
  startDate: Date,
  endDate: Date,
  venue: {
    name: String,
    address: String,
    city: String,
    state: String,
    country: String,
    zipCode: String
  },
  status: String, // 'draft', 'published', 'active', 'completed'
  registrationSettings: {
    registrationOpen: Boolean,
    registrationStartDate: Date,
    registrationEndDate: Date,
    registrationIdPrefix: String,
    requiredFields: [String],
    allowEdit: Boolean,
    customFields: [
      {
        id: String,
        label: String,
        type: String, // 'text', 'select', 'number', etc.
        options: [String], // For select fields
        required: Boolean
      }
    ]
  },
  resourceSettings: {
    meals: {
      enabled: Boolean,
      mealTypes: [
        {
          id: String,
          name: String,
          days: [Date],
          categoryPermissions: {
            [categoryId]: Boolean
          }
        }
      ]
    },
    kitItems: {
      enabled: Boolean,
      items: [
        {
          id: String,
          name: String,
          categoryPermissions: {
            [categoryId]: Boolean
          }
        }
      ]
    },
    certificates: {
      enabled: Boolean,
      types: [
        {
          id: String,
          name: String,
          categoryPermissions: {
            [categoryId]: Boolean
          }
        }
      ]
    }
  },
  abstractSettings: {
    enabled: Boolean,
    submissionStartDate: Date,
    submissionEndDate: Date,
    reviewEndDate: Date,
    notificationDate: Date,
    categories: [String],
    maxLength: Number,
    allowEdit: Boolean,
    requireApproval: Boolean
  },
  badgeSettings: {
    orientation: String, // 'portrait', 'landscape'
    width: Number,
    height: Number,
    unit: String, // 'in', 'cm', 'mm'
    fields: {
      name: Boolean,
      organization: Boolean,
      registrationId: Boolean,
      category: Boolean,
      qrCode: Boolean,
      country: Boolean,
      photo: Boolean
    }
  },
  emailSettings: {
    senderEmail: String,
    senderName: String,
    sendConfirmation: Boolean,
    templates: {
      registration: {
        subject: String,
        body: String
      },
      abstract: {
        subject: String,
        body: String
      }
    }
  },
  createdAt: Date,
  updatedAt: Date
}
```

Key Methods:
- `isActive()` - Check if event is currently active
- `isUpcoming()` - Check if event is upcoming
- `isPast()` - Check if event is past

### Category Model

```javascript
{
  _id: ObjectId,
  eventId: ObjectId, // Reference to Event
  name: String,
  description: String,
  color: String, // Hex color code
  badgeTemplate: String, // Template ID or path
  permissions: {
    meals: Boolean,
    kitItems: Boolean,
    certificates: Boolean,
    abstractSubmission: Boolean
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Registration Model

```javascript
{
  _id: ObjectId,
  eventId: ObjectId, // Reference to Event
  registrationId: String, // Custom ID format (e.g., MED23-001)
  qrCode: String, // Generated QR code data
  personalInfo: {
    firstName: String,
    lastName: String,
    email: String,
    phone: String,
    organization: String,
    country: String
  },
  category: ObjectId, // Reference to Category
  status: String, // 'registered', 'checked-in', 'cancelled'
  checkIn: {
    isCheckedIn: Boolean,
    checkedInAt: Date,
    checkedInBy: ObjectId // Reference to User
  },
  customFields: {
    // Dynamic custom fields based on event configuration
    [fieldId]: String
  },
  paymentStatus: String, // 'pending', 'paid', 'waived'
  createdAt: Date,
  updatedAt: Date
}
```

Key Methods:
- `generateQRCode()` - Generate QR code for registration
- `checkIn(userId)` - Mark registration as checked in

### Resource Model

```javascript
{
  _id: ObjectId,
  eventId: ObjectId, // Reference to Event
  registrationId: ObjectId, // Reference to Registration
  resourceType: String, // 'food', 'kit', 'certificate'
  resourceId: String, // ID of the specific resource
  resourceName: String, // Name of the resource
  timestamp: Date, // When the resource was issued
  issuedBy: ObjectId, // Reference to User who issued
  void: Boolean, // Whether the resource issuance is voided
  voidReason: String,
  voidedBy: ObjectId, // Reference to User who voided
  voidTimestamp: Date,
  createdAt: Date,
  updatedAt: Date
}
```

Key Methods:
- `void(userId, reason)` - Void a resource issuance with reason and user

### Abstract Model

```javascript
{
  _id: ObjectId,
  eventId: ObjectId, // Reference to Event
  abstractId: String, // Custom ID format (e.g., ABS-001)
  title: String,
  content: String,
  category: String,
  keywords: [String],
  authors: [
    {
      firstName: String,
      lastName: String,
      email: String,
      organization: String,
      isPresenting: Boolean
    }
  ],
  submittedBy: {
    registrationId: ObjectId, // Reference to Registration
    name: String,
    email: String
  },
  status: String, // 'draft', 'submitted', 'under-review', 'accepted', 'rejected'
  reviews: [
    {
      reviewerId: ObjectId, // Reference to User
      comments: String,
      score: Number,
      decision: String, // 'accept', 'reject', 'revise'
      timestamp: Date
    }
  ],
  attachments: [
    {
      filename: String,
      originalName: String,
      mimeType: String,
      size: Number,
      url: String
    }
  ],
  submissionDate: Date,
  lastUpdated: Date,
  notificationSent: Boolean,
  notificationDate: Date,
  createdAt: Date,
  updatedAt: Date
}
```

Key Methods:
- `addReview(reviewData)` - Add a review to the abstract
- `isEditable()` - Check if abstract is editable
- `getWordCount()` - Calculate word count of abstract content

## Controllers

### authController

Key functionality:
- User authentication with JWT tokens
- Password hashing with bcrypt
- Registration with email verification
- Password reset workflow

```javascript
// Login controller example
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  
  // Find user by email
  const user = await User.findOne({ email });
  
  if (!user) {
    res.status(401);
    throw new Error('Invalid credentials');
  }
  
  // Compare passwords
  const isMatch = await user.comparePassword(password);
  
  if (!isMatch) {
    res.status(401);
    throw new Error('Invalid credentials');
  }
  
  // Generate token
  const token = user.generateAuthToken();
  
  res.status(200).json({
    success: true,
    data: {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    }
  });
});
```

### eventController

Key functionality:
- CRUD operations for events
- Event statistics calculation
- Dashboard data aggregation

```javascript
// Get event statistics example
exports.getEventStatistics = asyncHandler(async (req, res) => {
  try {
    const eventId = req.params.id;
    
    // Validate MongoDB ObjectID format
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event ID format'
      });
    }
    
    const event = await Event.findById(eventId);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    // Calculate statistics
    const totalRegistrations = await Registration.countDocuments({ eventId });
    const checkedInCount = await Registration.countDocuments({ 
      eventId, 
      'checkIn.isCheckedIn': true 
    });
    
    // Calculate resource usage
    let resourcesCount = 0;
    if (Resource) {
      resourcesCount = await Resource.countDocuments({ eventId });
    }
    
    // Calculate abstracts stats
    let abstractsCount = 0;
    let abstractsApproved = 0;
    
    if (Abstract) {
      abstractsCount = await Abstract.countDocuments({ eventId });
      abstractsApproved = await Abstract.countDocuments({
        eventId,
        status: 'accepted'
      });
    }
    
    // Get category distribution
    const categories = await Category.find({ eventId });
    const categoryStats = [];
    
    for (const category of categories) {
      const count = await Registration.countDocuments({
        eventId,
        categoryId: category._id
      });
      
      categoryStats.push({
        id: category._id,
        name: category.name,
        color: category.color,
        count
      });
    }
    
    // Calculate check-in rate
    const checkInRate = totalRegistrations ? 
      Math.round((checkedInCount / totalRegistrations) * 100) : 0;
    
    return res.status(200).json({
      success: true,
      data: {
        totalRegistrations,
        checkedInCount,
        checkInRate,
        resourcesCount,
        abstractsCount,
        abstractsApproved,
        categories: categoryStats
      }
    });
  } catch (error) {
    console.error(`Error in getEventStatistics: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server error calculating statistics',
      error: error.message
    });
  }
});
```

### registrationController

Key functionality:
- CRUD operations for registrations
- Bulk import from Excel/CSV
- Registration ID generation
- QR code generation

```javascript
// Registration bulk import example
exports.importRegistrations = asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  const { mappings, data } = req.body;
  
  if (!mappings || !data || !Array.isArray(data)) {
    res.status(400);
    throw new Error('Invalid import data format');
  }
  
  // Check if event exists
  const event = await Event.findById(eventId);
  if (!event) {
    res.status(404);
    throw new Error('Event not found');
  }
  
  const results = {
    total: data.length,
    imported: 0,
    failed: 0,
    errors: []
  };
  
  // Process each row in the data
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    
    try {
      // Extract data based on mappings
      const personalInfo = {
        firstName: row[mappings.firstName],
        lastName: row[mappings.lastName],
        email: row[mappings.email],
        phone: row[mappings.phone],
        organization: row[mappings.organization],
        country: row[mappings.country]
      };
      
      // Find or create category
      let categoryId;
      if (mappings.category && row[mappings.category]) {
        const categoryName = row[mappings.category];
        let category = await Category.findOne({ 
          eventId, 
          name: categoryName 
        });
        
        if (!category) {
          // Create category if it doesn't exist
          category = await Category.create({
            eventId,
            name: categoryName,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
        
        categoryId = category._id;
      } else {
        // Use default category if available
        const defaultCategory = await Category.findOne({ eventId });
        categoryId = defaultCategory ? defaultCategory._id : null;
      }
      
      // Generate registration ID
      const registrationPrefix = event.registrationSettings?.idPrefix || 'REG';
      const count = await Registration.countDocuments({ eventId });
      const nextNumber = count + 1;
      const formattedNumber = nextNumber.toString().padStart(4, '0');
      const registrationId = `${registrationPrefix}-${formattedNumber}`;
      
      // Create registration
      await Registration.create({
        eventId,
        registrationId,
        personalInfo,
        categoryId,
        status: 'registered',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      results.imported++;
    } catch (error) {
      results.failed++;
      results.errors.push({
        row: i + 1,
        error: error.message
      });
    }
  }
  
  res.status(200).json({
    success: true,
    data: results
  });
});
```

### resourceController

Key functionality:
- Resource tracking (food, kits, certificates)
- Resource validation based on category permissions
- Distribution recording
- Statistics calculation

```javascript
// Record food distribution example
exports.recordFoodDistribution = asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  const { registrationId, mealType, date } = req.body;
  
  // Validate input
  if (!registrationId || !mealType) {
    res.status(400);
    throw new Error('Registration ID and meal type are required');
  }
  
  // Find registration
  const registration = await Registration.findOne({ 
    registrationId,
    eventId
  }).populate('category');
  
  if (!registration) {
    res.status(404);
    throw new Error('Registration not found');
  }
  
  // Check if category has meal permission
  const event = await Event.findById(eventId);
  if (!event) {
    res.status(404);
    throw new Error('Event not found');
  }
  
  // Find meal in event settings
  const meal = event.resourceSettings?.meals?.mealTypes?.find(
    m => m.id === mealType || m.name === mealType
  );
  
  if (!meal) {
    res.status(404);
    throw new Error('Meal type not found');
  }
  
  // Check if category has permission for this meal
  const categoryId = registration.category._id.toString();
  if (!meal.categoryPermissions[categoryId]) {
    res.status(403);
    throw new Error('Category does not have permission for this meal');
  }
  
  // Check if already used today
  const today = date ? new Date(date) : new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const existingResource = await Resource.findOne({
    eventId,
    registrationId: registration._id,
    resourceType: 'food',
    resourceId: mealType,
    timestamp: {
      $gte: today,
      $lt: tomorrow
    },
    void: false
  });
  
  if (existingResource) {
    res.status(400);
    throw new Error('Meal already used today');
  }
  
  // Create resource record
  const resource = await Resource.create({
    eventId,
    registrationId: registration._id,
    resourceType: 'food',
    resourceId: mealType,
    resourceName: meal.name,
    timestamp: new Date(),
    issuedBy: req.user._id,
    void: false,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  
  res.status(201).json({
    success: true,
    data: {
      registration: {
        _id: registration._id,
        registrationId: registration.registrationId,
        personalInfo: registration.personalInfo,
        category: registration.category
      },
      issuedAt: resource.timestamp,
      meal: meal.name
    }
  });
});
```

### abstractController

Key functionality:
- Abstract submission and management
- Abstract review workflow
- Bulk download of abstracts

```javascript
// Update abstract review status example
exports.reviewAbstract = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { status, comments, score } = req.body;
  
  // Validate status
  const validStatuses = ['under-review', 'accepted', 'rejected', 'revisions-requested'];
  if (!validStatuses.includes(status)) {
    return next(new ErrorResponse(`Invalid status: ${status}`, 400));
  }
  
  // Find abstract
  const abstract = await Abstract.findById(id);
  
  if (!abstract) {
    return next(new ErrorResponse(`Abstract not found with id of ${id}`, 404));
  }
  
  // Create review entry
  const review = {
    reviewerId: req.user._id,
    comments,
    score: score || 0,
    decision: status,
    timestamp: new Date()
  };
  
  // Add review to abstract
  abstract.reviews.push(review);
  
  // Update status
  abstract.status = status;
  
  // Save changes
  await abstract.save();
  
  res.status(200).json({
    success: true,
    data: abstract
  });
});
```

### categoryController

Key functionality:
- CRUD operations for categories
- Resource permission management
- Badge template association

## Authentication and Authorization

### Authentication Middleware

```javascript
// auth.js middleware example
const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');

// Protect routes
exports.protect = asyncHandler(async (req, res, next) => {
  let token;
  
  // Get token from header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  
  // Check if token exists
  if (!token) {
    res.status(401);
    throw new Error('Not authorized to access this route');
  }
  
  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from token
    req.user = await User.findById(decoded.id).select('-password');
    
    if (!req.user) {
      res.status(401);
      throw new Error('User not found');
    }
    
    next();
  } catch (error) {
    res.status(401);
    throw new Error('Not authorized to access this route');
  }
});

// Role authorization
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      res.status(403);
      throw new Error(`User role ${req.user.role} is not authorized to access this route`);
    }
    next();
  };
};
```

## Error Handling

### Error Handler Middleware

```javascript
// errorHandler.js middleware example
const ErrorResponse = require('../utils/errorResponse');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  
  // Log to console for dev
  console.error(err);
  
  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = `Resource not found with id of ${err.value}`;
    error = new ErrorResponse(message, 404);
  }
  
  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = new ErrorResponse(message, 400);
  }
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message);
    error = new ErrorResponse(message, 400);
  }
  
  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

module.exports = errorHandler;
```

## Middleware

### Logging Middleware

```javascript
// logger.js middleware example
const logger = (req, res, next) => {
  console.log(
    `${req.method} ${req.protocol}://${req.get('host')}${req.originalUrl}`
  );
  next();
};

module.exports = logger;
```

### Validation Middleware

```javascript
// validator.js middleware example
const validator = require('joi');

// Validation middleware
exports.validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }
    
    next();
  };
};

// Validation schemas
exports.schemas = {
  eventCreate: validator.object({
    name: validator.string().required(),
    description: validator.string(),
    startDate: validator.date().required(),
    endDate: validator.date().required(),
    venue: validator.object({
      name: validator.string().required(),
      address: validator.string().required(),
      city: validator.string().required(),
      state: validator.string(),
      country: validator.string().required(),
      zipCode: validator.string()
    })
  }),
  // Other schemas...
};
```

## Identified Issues

### 1. Missing Model Exports

- **Resource Model** was not properly exported in `models/index.js`, causing the statistics endpoint to fail with `Cannot read properties of undefined (reading 'countDocuments')` error.
- This affected:
  - Event statistics endpoint
  - Resource-related queries
- **Fix**: Update `models/index.js` to properly export the Resource model:
  ```javascript
  module.exports = {
    User: require('./User'),
    Event: require('./Event'),
    Registration: require('./Registration'),
    Category: require('./Category'),
    Resource: require('./Resource'),  // This was missing
    Abstract: require('./Abstract')
  };
  ```

### 2. Error Handling Inconsistencies

- **Inconsistent Error Response Format**: Different controllers return errors in different formats:
  - Some use `throw new Error(message)`
  - Others use `next(new ErrorResponse(message, statusCode))`
  - Some return directly with `res.status(code).json({ success: false, message })`
- This makes error handling on the frontend challenging
- **Standardized Approach**: All error responses should follow this format:
  ```javascript
  {
    success: false,
    message: "Error message",
    error: errorDetails  // Optional, development only
  }
  ```
- **Implementation**: Update the error handler middleware to ensure all errors are formatted consistently

### 3. Validation Issues

- **Missing Validation**: Some endpoints don't properly validate input data
- **Inconsistent Validation**: Some controllers use Joi validation, others use manual validation
- **Validation Middleware**: Not consistently applied across all routes
- **Standardized Approach**: All endpoints should use the validation middleware with Joi schemas

### 4. Authentication Problems

- **Token Verification**: JWT token verification doesn't check for token expiration properly
- **Password Reset**: Password reset functionality is incomplete
- **Role-based Authorization**: Role checks are implemented but not consistently applied
- **Fix**: Update authentication middleware to properly check token expiration and consistently apply role checks

### 5. MongoDB Connection Issues

- **Connection String**: Hard-coded in some places instead of using environment variables
- **Error Handling**: MongoDB connection errors aren't properly handled
- **Connection Options**: Missing important options like `useUnifiedTopology`
- **Fix**: Centralize database connection in a separate file that properly handles connections and errors

### 6. Missing API Endpoints

The following endpoints expected by the frontend have been added to the API Endpoints section above:
- Badge template save and load endpoints
- Report generation endpoints
- User management endpoints
- Email template endpoints
- Scanner-specific endpoints

### 7. Input Validation Problems

- **ObjectID Validation**: Not consistently checking for valid MongoDB ObjectIDs
- **Required Fields**: Some endpoints don't check for all required fields
- **Type Checking**: Lack of proper type validation for input data
- **Fix**: Use Joi validation schemas for all endpoints and implement a utility function for ObjectID validation

### 8. Missing Functionality

- **Certificate Issuance**: Certificate generation and distribution is not fully implemented
- **Email Notifications**: Email sending functionality is mentioned but not implemented
- **File Upload**: Abstract attachment upload functionality is incomplete
- **Fix**: Implement these features with proper API endpoints

### 9. Security Concerns

- **Password Hashing**: Password hashing implementation might not use proper salt rounds
- **Token Management**: No token blacklisting or refresh token mechanism
- **CORS Settings**: Potentially too permissive CORS settings
- **Fix**: Update security settings and implement proper token management

### 10. Performance Issues

- **Query Optimization**: Some queries don't use proper indexing
- **Large Responses**: Some endpoints return unnecessarily large response objects
- **N+1 Query Problem**: Some controllers make multiple sequential database queries instead of using aggregation or population
- **Fix**: Optimize queries and implement pagination for all list endpoints

### 11. Code Organization Issues

- **Controller Size**: Some controllers are too large (event.controller.js is 393 lines)
- **Duplicate Code**: Common functionality duplicated across controllers
- **Utility Functions**: Missing utility functions for common operations
- **Fix**: Refactor controllers and create utility functions for common operations

### 12. Frontend-Backend Alignment Issues

- **Environment Variable Format**: Frontend uses `process.env` which is not available in Vite applications (should be `import.meta.env`)
- **Pagination Parameters**: Inconsistent pagination parameters between frontend and backend
- **Response Structures**: Different data structures returned by some endpoints
- **Fix**: Standardize API response formats and document pagination parameters

## API Response Format Standards

To ensure consistency between frontend and backend, all API responses should follow these formats:

### Success Response Format
```javascript
{
  success: true,
  data: { ... }  // Response data object or array
}
```

### Paginated Response Format
```javascript
{
  success: true,
  data: [
    { ... },  // Array of items
    { ... }
  ],
  pagination: {
    page: 1,         // Current page number
    limit: 10,       // Items per page
    totalPages: 5,   // Total number of pages
    totalItems: 48   // Total number of items
  }
}
```

### Error Response Format
```javascript
{
  success: false,
  message: "Error message",
  errors: [ ... ]  // Optional array of specific errors
}
```

## Pagination Parameters

All list endpoints should support these pagination parameters:

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)
- `sort`: Field to sort by (e.g., "createdAt")
- `order`: Sort order ("asc" or "desc", default: "desc")
- `search`: Search term for text search

Example API call:
```
GET /api/registrations?page=2&limit=20&sort=createdAt&order=desc&search=john
``` 