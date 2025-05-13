# Onsite Atlas Project Reference

## Project Overview
Onsite Atlas is a comprehensive conference management system designed to handle onsite registration, badge printing, resource tracking (food, kits, certificates), and abstract submission for events. The system features a multi-tenant architecture supporting multiple events.

## Project Structure

### Client-Side Structure
```
client/
├── src/
│   ├── components/
│   │   ├── common/         # Reusable UI components
│   │   │   ├── Alert.jsx
│   │   │   ├── Badge.jsx
│   │   │   ├── Button.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── Checkbox.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Pagination.jsx
│   │   │   ├── Select.jsx
│   │   │   ├── Spinner.jsx
│   │   │   ├── Tabs.jsx
│   │   │   ├── Textarea.jsx
│   │   │   ├── Tooltip.jsx
│   │   │   ├── QRCodeGenerator.jsx
│   │   │   ├── BadgeTemplate.jsx
│   │   │   ├── GlobalSearch.jsx
│   │   │   └── index.js    # Barrel file exporting all components
│   │   └── layout/         # Layout components
│   ├── contexts/           # React context providers
│   ├── layouts/            # Page layouts
│   │   ├── MainLayout/     # Base layout with navigation and footer
│   │   └── DashboardLayout/ # Dashboard specific layout with sidebar
│   ├── pages/              # Page components
│   │   ├── Auth/           # Authentication pages
│   │   ├── Events/         # Event management pages
│   │   ├── Registration/   # Registration pages
│   │   ├── Resources/      # Resource tracking pages
│   │   ├── Abstracts/      # Abstract submission pages
│   │   ├── BadgePrinting/  # Badge printing pages
│   │   ├── Categories/     # Category management pages
│   │   ├── Reports/        # Reporting pages
│   │   ├── Settings/       # Settings pages
│   │   └── PublicPortals/  # Public-facing portals
│   ├── services/           # API service clients
│   │   ├── api.js          # Base API configuration
│   │   ├── apiService.js   # Common API utilities
│   │   ├── eventService.js # Event-related API methods
│   │   ├── registrationService.js # Registration-related API methods
│   │   ├── resourceService.js # Resource-related API methods
│   │   ├── abstractService.js # Abstract-related API methods
│   │   ├── authService.js  # Authentication API methods
│   │   ├── categoryService.js # Category-related API methods
│   │   └── index.js        # Barrel file exporting all services
│   ├── utils/              # Utility functions
│   ├── App.jsx             # Main application component with routing
│   └── main.jsx            # Application entry point
├── public/                 # Static assets
├── index.html              # Entry HTML file
└── package.json            # Frontend dependencies
```

### Server-Side Structure
```
server/
├── src/
│   ├── controllers/        # API controller logic
│   │   ├── event.controller.js
│   │   ├── registration.controller.js
│   │   ├── abstract.controller.js
│   │   ├── category.controller.js
│   │   └── auth.controller.js
│   ├── models/             # MongoDB schema models
│   │   ├── User.js
│   │   ├── Event.js
│   │   ├── Category.js
│   │   ├── Registration.js
│   │   ├── Resource.js
│   │   ├── Abstract.js
│   │   └── index.js        # Exports all models
│   ├── routes/             # API route definitions
│   │   ├── events.routes.js
│   │   ├── registrations.routes.js
│   │   ├── resources.routes.js
│   │   ├── abstracts.routes.js
│   │   ├── categories.routes.js
│   │   └── auth.routes.js
│   ├── middleware/         # Express middleware
│   │   ├── auth.js         # Authentication middleware
│   │   └── errorHandler.js # Error handling middleware
│   ├── validation/         # Request validation schemas
│   ├── utils/              # Utility functions
│   ├── config/             # Configuration files
│   ├── services/           # Third-party service integrations
│   └── index.js            # Server entry point
├── logs/                   # Server logs
└── package.json            # Backend dependencies
```

## API Configuration

### Base API Configuration

The frontend API configuration is defined in `client/src/services/api.js`:

```javascript
import axios from 'axios';

// Create an axios instance with the correct API base URL
const api = axios.create({
  baseURL: import.meta.env.PROD 
    ? '/api'
    : 'http://localhost:5000/api', // Explicit backend URL in development
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add request interceptor for authentication
api.interceptors.request.use(
  (config) => {
    // Add token to request headers if available
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default api;
```

### API Services

The application uses service modules for each main entity type (events, registrations, etc.). These services handle API calls and data formatting.

## Component Pages and Data Requirements

### Event Management Components

#### EventPortal Component
**File:** `client/src/pages/Events/EventPortal.jsx`

**Description:** Central hub for managing a specific event, showing statistics, and providing navigation to other event-related pages.

**Props:**
- No props (uses React Router params)

**State:**
- `event`: Event data object
- `statistics`: Event statistics object
- `activities`: Recent activities array
- `loading`: Boolean indicating loading state
- `error`: Error message or null
- `activeTab`: String indicating active tab

**API Endpoint Dependencies:**
- `GET /api/events/:id` - Get event details
- `GET /api/events/:id/statistics` - Get event statistics
- `GET /api/events/:id/dashboard` - Get event dashboard data

**Expected Request Data:**
- Event ID from URL params

**Expected Response Data:**
```javascript
// Event data
{
  _id: String,
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
  status: String, // 'draft', 'published', 'active', 'completed', 'archived'
  registrationSettings: {
    // Registration settings object
  },
  resourceSettings: {
    // Resource settings object
  },
  abstractSettings: {
    // Abstract settings object
  },
  emailSettings: {
    // Email settings object
  },
  badgeSettings: {
    // Badge settings object
  }
}

// Statistics data
{
  totalRegistrations: Number,
  checkedIn: Number,
  categories: Array,
  resourcesDistributed: Number,
  abstractsSubmitted: Number,
  abstractsApproved: Number
}

// Dashboard data
{
  recentActivities: Array,
  // Additional dashboard data
}
```

#### EventSettings Component
**File:** `client/src/pages/Events/EventSettings.jsx`

**Description:** Comprehensive settings management for events with tab-based interface.

**Props:**
- No props (uses React Router params)

**State:**
- `event`: Event data object
- `loading`: Boolean loading state
- `error`: Error message or null
- `activeTab`: String indicating active settings tab
- `formChanged`: Boolean indicating if form has unsaved changes

**API Endpoint Dependencies:**
- `GET /api/events/:id` - Get event details
- `PUT /api/events/:id` - Update event details

**Expected Request Data for Update:**
```javascript
{
  name: String,
  description: String,
  startDate: Date,
  endDate: Date,
  venue: Object,
  registrationSettings: Object,
  resourceSettings: Object,
  abstractSettings: Object,
  emailSettings: Object,
  badgeSettings: Object
}
```

**Expected Response Data:**
- Same as the event data structure from EventPortal

### Registration Components

#### RegistrationList Component
**File:** `client/src/pages/Registration/RegistrationList.jsx`

**Description:** Displays a list of registrations with filtering, sorting, and pagination.

**Props:**
- `eventId`: String (optional, filters by event if provided)

**State:**
- `registrations`: Array of registration objects
- `loading`: Boolean loading state
- `error`: Error message or null
- `filters`: Object containing filter criteria
- `page`: Number indicating current page
- `totalPages`: Number of total pages
- `selectedRegistrations`: Array of selected registration IDs

**API Endpoint Dependencies:**
- `GET /api/registrations` or `GET /api/events/:eventId/registrations` - Get registrations (filtered by event if eventId provided)

**Expected Request Data:**
- Query parameters for filtering, pagination, and sorting:
```
?page=1&limit=10&sortBy=createdAt&sortDirection=desc&status=active&category=categoryId&search=searchTerm
```

**Expected Response Data:**
```javascript
{
  success: true,
  data: [
    {
      _id: String,
      registrationId: String,
      event: { _id: String, name: String },
      category: { _id: String, name: String },
      personalInfo: {
        firstName: String,
        lastName: String,
        email: String,
        // Other personal info fields
      },
      checkIn: {
        isCheckedIn: Boolean,
        checkedInAt: Date
      },
      status: String,
      createdAt: Date,
      // Other registration fields
    },
    // More registrations
  ],
  total: Number,
  page: Number,
  pages: Number
}
```

#### RegistrationForm Component
**File:** `client/src/pages/Registration/RegistrationForm.jsx`

**Description:** Form for creating or editing registrations.

**Props:**
- `eventId`: String (required for new registrations)
- `registrationId`: String (required for editing existing registrations)
- `onSuccess`: Function callback after successful submission

**State:**
- `formData`: Object containing form data
- `loading`: Boolean loading state
- `submitting`: Boolean submission state
- `error`: Error message or null
- `categories`: Array of available categories
- `formConfig`: Object containing form field configuration

**API Endpoint Dependencies:**
- `GET /api/events/:eventId/categories` - Get categories for the event
- `GET /api/events/:eventId` - Get event details including registration settings
- `POST /api/registrations` - Create new registration
- `PUT /api/registrations/:id` - Update existing registration
- `GET /api/registrations/:id` - Get registration details (for editing)

**Expected Request Data for Create/Update:**
```javascript
{
  eventId: String,
  categoryId: String,
  personalInfo: {
    firstName: String,
    lastName: String,
    email: String,
    phone: String,
    organization: String,
    // Other custom fields based on event configuration
  },
  // Other registration fields
}
```

**Expected Response Data:**
```javascript
{
  success: true,
  data: {
    _id: String,
    registrationId: String,
    // Full registration object similar to list response
  }
}
```

#### BulkImport Component
**File:** `client/src/pages/Registration/BulkImport.jsx`

**Description:** Multi-step process for bulk importing registrations from Excel/CSV files.

**Props:**
- `eventId`: String (required)

**State:**
- `step`: Number indicating current import step
- `file`: File object
- `mappings`: Object mapping Excel columns to registration fields
- `parsedData`: Array of parsed data rows
- `importing`: Boolean import state
- `results`: Object containing import results
- `error`: Error message or null

**API Endpoint Dependencies:**
- `GET /api/events/:eventId/categories` - Get categories for mapping
- `POST /api/events/:eventId/registrations/import` - Bulk import registrations

**Expected Request Data for Import:**
```javascript
{
  mappings: {
    firstName: "A", // Excel column A maps to firstName
    lastName: "B",  // Excel column B maps to lastName
    email: "C",     // etc.
    // Other field mappings
  },
  data: [
    // Parsed rows from Excel with column letters as keys
    { "A": "John", "B": "Doe", "C": "john@example.com", ... },
    // More rows
  ]
}
```

**Expected Response Data:**
```javascript
{
  success: true,
  imported: Number, // Count of successfully imported registrations
  failed: Number,   // Count of failed imports
  total: Number,    // Total rows processed
  errors: [         // Array of errors for failed imports
    {
      row: Number,
      error: String
    }
  ]
}
```

### Resource Tracking Components

#### FoodTracking Component
**File:** `client/src/pages/Resources/FoodTracking.jsx`

**Description:** Interface for tracking meal consumption with QR code scanning.

**Props:**
- `eventId`: String (required)

**State:**
- `selectedDay`: Number or Date
- `selectedMeal`: String
- `scanning`: Boolean indicating active scanning
- `scanResult`: Object with scan result
- `recentScans`: Array of recent scan results
- `statistics`: Object with usage statistics
- `error`: Error message or null

**API Endpoint Dependencies:**
- `GET /api/events/:eventId/resources/food/config` - Get food configuration (days, meals)
- `GET /api/events/:eventId/resources/food/recent` - Get recent food tracking records
- `GET /api/events/:eventId/resources/food/statistics` - Get food usage statistics
- `POST /api/events/:eventId/resources/food` - Record food distribution

**Expected Request Data for Scanning:**
```javascript
{
  registrationId: String, // From QR code scan
  day: Number,
  meal: String
}
```

**Expected Response Data for Scan:**
```javascript
{
  success: true,
  data: {
    registration: {
      _id: String,
      registrationId: String,
      personalInfo: {
        firstName: String,
        lastName: String
      },
      category: {
        _id: String,
        name: String
      }
    },
    issuedAt: Date,
    meal: String,
    day: Number
  }
}
```

#### KitBagDistribution Component
**File:** `client/src/pages/Resources/KitBagDistribution.jsx`

**Description:** Interface for tracking kit bag distribution with QR code scanning.

**Props:**
- `eventId`: String (required)

**State:**
- `selectedItem`: String (kit item ID)
- `scanning`: Boolean indicating active scanning
- `scanResult`: Object with scan result
- `recentDistributions`: Array of recent distributions
- `kitItems`: Array of available kit items
- `statistics`: Object with distribution statistics
- `error`: Error message or null

**API Endpoint Dependencies:**
- `GET /api/events/:eventId/resources/kits/items` - Get kit items configuration
- `GET /api/events/:eventId/resources/kits/recent` - Get recent kit distributions
- `GET /api/events/:eventId/resources/kits/statistics` - Get kit distribution statistics
- `POST /api/events/:eventId/resources/kits` - Record kit distribution

**Expected Request Data for Distribution:**
```javascript
{
  registrationId: String, // From QR code scan
  kitItemId: String
}
```

**Expected Response Data for Distribution:**
```javascript
{
  success: true,
  data: {
    registration: {
      _id: String,
      registrationId: String,
      personalInfo: {
        firstName: String,
        lastName: String
      },
      category: {
        _id: String,
        name: String
      }
    },
    issuedAt: Date,
    kitItem: {
      _id: String,
      name: String
    }
  }
}
```

#### ScannerStation Component
**File:** `client/src/pages/Resources/ScannerStation.jsx`

**Description:** Generic scanner interface that can be configured for different resource types.

**Props:**
- `resourceType`: String ('food', 'kit', 'certificate')
- `eventId`: String (required)
- `onScan`: Function callback after successful scan

**State:**
- `scanning`: Boolean indicating active scanning
- `scanResult`: Object with scan result
- `error`: Error message or null
- `camera`: String selected camera device

**API Endpoint Dependencies:**
- Uses the appropriate resource API based on resourceType prop

**Expected Request/Response Data:**
- Depends on the resource type (see FoodTracking and KitBagDistribution)

### Abstract Submission Components

#### AbstractList Component
**File:** `client/src/pages/Abstracts/AbstractList.jsx`

**Description:** Displays a list of abstracts with filtering, sorting, and review capabilities.

**Props:**
- `eventId`: String (optional, filters by event if provided)

**State:**
- `abstracts`: Array of abstract objects
- `loading`: Boolean loading state
- `error`: Error message or null
- `filters`: Object containing filter criteria
- `page`: Number indicating current page
- `totalPages`: Number of total pages
- `statistics`: Object with abstract statistics

**API Endpoint Dependencies:**
- `GET /api/abstracts` or `GET /api/events/:eventId/abstracts` - Get abstracts
- `GET /api/events/:eventId/abstracts/statistics` - Get abstract statistics

**Expected Request Data:**
- Query parameters for filtering, pagination, and sorting:
```
?page=1&limit=10&sortBy=createdAt&sortDirection=desc&status=pending&search=searchTerm
```

**Expected Response Data:**
```javascript
{
  success: true,
  data: [
    {
      _id: String,
      title: String,
      content: String,
      authors: [
        {
          name: String,
          email: String,
          organization: String,
          isPrimaryAuthor: Boolean
        }
      ],
      registration: {
        _id: String,
        registrationId: String,
        personalInfo: {
          firstName: String,
          lastName: String
        }
      },
      review: {
        status: String, // 'pending', 'approved', 'rejected', 'revisions_requested'
        reviewedBy: String,
        reviewedAt: Date,
        comments: String
      },
      createdAt: Date,
      updatedAt: Date
    },
    // More abstracts
  ],
  total: Number,
  page: Number,
  pages: Number
}
```

#### AbstractSubmissionForm Component
**File:** `client/src/pages/Abstracts/AbstractSubmissionForm.jsx`

**Description:** Form for submitting or editing abstracts.

**Props:**
- `eventId`: String (required for new submissions)
- `abstractId`: String (required for editing existing abstracts)
- `onSuccess`: Function callback after successful submission

**State:**
- `formData`: Object containing form data
- `loading`: Boolean loading state
- `submitting`: Boolean submission state
- `error`: Error message or null
- `wordCount`: Number of words in abstract
- `validating`: Boolean validation state
- `registrationValid`: Boolean indicating if registration ID is valid

**API Endpoint Dependencies:**
- `GET /api/events/:eventId/abstracts/config` - Get abstract submission configuration
- `POST /api/abstracts` - Create new abstract
- `PUT /api/abstracts/:id` - Update existing abstract
- `GET /api/abstracts/:id` - Get abstract details (for editing)
- `POST /api/registrations/validate` - Validate registration ID

**Expected Request Data for Create/Update:**
```javascript
{
  eventId: String,
  registrationId: String,
  title: String,
  content: String,
  authors: [
    {
      name: String,
      email: String,
      organization: String,
      isPrimaryAuthor: Boolean
    }
  ],
  keywords: [String],
  category: String
}
```

**Expected Response Data:**
```javascript
{
  success: true,
  data: {
    _id: String,
    title: String,
    // Full abstract object similar to list response
  }
}
```

#### AbstractDetail Component
**File:** `client/src/pages/Abstracts/AbstractDetail.jsx`

**Description:** Detailed view of a single abstract with review functionality.

**Props:**
- `abstractId`: String (required)

**State:**
- `abstract`: Abstract object
- `loading`: Boolean loading state
- `error`: Error message or null
- `reviewComments`: String
- `reviewStatus`: String
- `submitting`: Boolean submission state

**API Endpoint Dependencies:**
- `GET /api/abstracts/:id` - Get abstract details
- `PUT /api/abstracts/:id/review` - Submit abstract review

**Expected Request Data for Review:**
```javascript
{
  status: String, // 'approved', 'rejected', 'revisions_requested'
  comments: String
}
```

**Expected Response Data:**
```javascript
{
  success: true,
  data: {
    _id: String,
    // Updated abstract object with review information
  }
}
```

### Badge Printing Components

#### BadgeDesigner Component
**File:** `client/src/pages/BadgePrinting/BadgeDesigner.jsx`

**Description:** Visual interface for designing badge templates and printing badges.

**Props:**
- `eventId`: String (required)

**State:**
- `template`: Object containing badge template design
- `selectedCategory`: String (category ID for previewing)
- `previewData`: Object with sample data for preview
- `loading`: Boolean loading state
- `error`: Error message or null
- `mode`: String ('design' or 'print')
- `selectedRegistrations`: Array of registration IDs for printing

**API Endpoint Dependencies:**
- `GET /api/events/:eventId/badge-templates` - Get saved badge templates
- `POST /api/events/:eventId/badge-templates` - Save badge template
- `GET /api/events/:eventId/categories` - Get categories for template design
- `POST /api/badges/print` - Generate printable badges

**Expected Request Data for Template Save:**
```javascript
{
  template: {
    name: String,
    elements: [
      {
        type: String, // 'text', 'image', 'qrcode'
        content: String,
        position: { x: Number, y: Number },
        size: { width: Number, height: Number },
        style: Object // Style properties
      }
    ],
    size: { width: Number, height: Number },
    orientation: String // 'portrait' or 'landscape'
  }
}
```

**Expected Response Data for Print Request:**
```javascript
{
  success: true,
  data: {
    printJobId: String,
    url: String // URL to download printable PDF
  }
}
```

## Database Schema

### User Model
```javascript
{
  _id: ObjectId,
  name: String,
  email: String,
  password: String (hashed),
  role: String (enum: 'admin', 'manager', 'staff'),
  events: [ObjectId] (references Event),
  isActive: Boolean,
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

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
  logo: String (URL),
  bannerImage: String (URL),
  registrationSettings: {
    idPrefix: String,
    startNumber: Number,
    isOpen: Boolean,
    allowOnsite: Boolean,
    customFields: [{
      name: String,
      type: String (enum: 'text', 'number', 'date', 'select', 'checkbox'),
      options: [String],
      isRequired: Boolean
    }]
  },
  categories: [ObjectId] (references Category),
  meals: [{
    name: String,
    date: Date,
    startTime: String,
    endTime: String
  }],
  kitItems: [{
    name: String,
    quantity: Number
  }],
  certificateTypes: [{
    name: String,
    template: String (URL)
  }],
  abstractSettings: {
    isOpen: Boolean,
    deadline: Date,
    maxLength: Number,
    allowEditing: Boolean
  },
  createdBy: ObjectId (references User),
  status: String (enum: 'draft', 'published', 'archived'),
  createdAt: Date,
  updatedAt: Date
}
```

### Category Model
```javascript
{
  _id: ObjectId,
  name: String,
  description: String,
  event: ObjectId (references Event),
  color: String (hex color),
  badgeTemplate: String (URL),
  permissions: {
    meals: Boolean,
    kitItems: Boolean,
    certificates: Boolean,
    abstractSubmission: Boolean
  },
  mealEntitlements: [{
    mealId: ObjectId,
    entitled: Boolean
  }],
  kitItemEntitlements: [{
    itemId: ObjectId,
    entitled: Boolean
  }],
  certificateEntitlements: [{
    certificateId: ObjectId,
    entitled: Boolean
  }],
  createdAt: Date,
  updatedAt: Date
}
```

### Registration Model
```javascript
{
  _id: ObjectId,
  registrationId: String,
  event: ObjectId (references Event),
  category: ObjectId (references Category),
  personalInfo: {
    firstName: String,
    lastName: String,
    email: String,
    phone: String,
    organization: String,
    designation: String,
    country: String
  },
  customFields: Map<String, Mixed>,
  qrCode: String,
  badgePrinted: Boolean,
  checkIn: {
    isCheckedIn: Boolean,
    checkedInAt: Date,
    checkedInBy: ObjectId (references User)
  },
  resourceUsage: {
    meals: [{
      meal: ObjectId,
      usedAt: Date,
      issuedBy: ObjectId (references User),
      isVoid: Boolean,
      voidedBy: ObjectId (references User),
      voidedAt: Date
    }],
    kitItems: [{
      item: ObjectId,
      issuedAt: Date,
      issuedBy: ObjectId (references User),
      isVoid: Boolean,
      voidedBy: ObjectId (references User),
      voidedAt: Date
    }],
    certificates: [{
      certificate: ObjectId,
      issuedAt: Date,
      issuedBy: ObjectId (references User),
      isVoid: Boolean,
      voidedBy: ObjectId (references User),
      voidedAt: Date
    }]
  },
  notes: String,
  registrationType: String (enum: 'pre-registered', 'onsite', 'imported'),
  registeredBy: ObjectId (references User),
  status: String (enum: 'active', 'cancelled', 'no-show'),
  createdAt: Date,
  updatedAt: Date
}
```

### Resource Model
```javascript
{
  _id: ObjectId,
  eventId: ObjectId (references Event),
  registrationId: ObjectId (references Registration),
  resourceType: String, // 'food', 'kit', 'certificate'
  resourceId: String,
  resourceName: String,
  timestamp: Date,
  issuedBy: ObjectId, // User ID
  void: Boolean,
  voidReason: String,
  voidedBy: ObjectId,
  voidTimestamp: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Abstract Model
```javascript
{
  _id: ObjectId,
  title: String,
  content: String,
  event: ObjectId (references Event),
  registration: ObjectId (references Registration),
  authors: [{
    name: String,
    email: String,
    organization: String,
    isPrimaryAuthor: Boolean
  }],
  keywords: [String],
  category: String,
  review: {
    status: String, // 'pending', 'approved', 'rejected', 'revisions_requested'
    reviewedBy: ObjectId (references User),
    reviewedAt: Date,
    comments: String
  },
  attachments: [{
    filename: String,
    originalName: String,
    mimeType: String,
    size: Number,
    url: String,
    uploadedAt: Date
  }],
  lastEdited: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## Common Issues and Solutions

### API Error: Event Statistics Endpoint Failure (500 Error)

**Error:**
```
GET http://localhost:5000/api/events/[ID]/statistics 500 (Internal Server Error)
Error: Cannot read properties of undefined (reading 'countDocuments')
```

**Root Cause:**
The server-side endpoint was attempting to use `countDocuments` on the Resource model, which was missing or not properly imported.

**Solution:**
1. Ensure Resource model is properly defined in `server/src/models/Resource.js`
2. Verify that Resource model is properly exported in `models/index.js`
3. Add null checks in the controller to handle undefined models:
```javascript
const resourceCount = Resource ? await Resource.countDocuments({ eventId }) : 0;
```

### Environment Variable References in Vite Applications

**Error:**
References to `process.env` in Vite applications which should be `import.meta.env`.

**Solution:**
Replace all instances of `process.env` with `import.meta.env` in all service files.
Ensure environment variables are properly defined in `.env` files with the `VITE_` prefix.

### Inconsistent API Response Handling

**Issue:**
Different API services handle responses differently, leading to inconsistent error handling.

**Solution:**
Standardize response format across all services:
```javascript
// Success response
{
  success: true,
  data: responseData,
  message: 'Operation completed successfully'
}

// Error response
{
  success: false,
  message: errorMessage,
  data: null
}
```

### Component Loading States

**Issue:**
Components don't handle loading states properly, leading to UI issues.

**Solution:**
Implement consistent loading state handling:
```jsx
if (loading) {
  return <Spinner size="lg" centered />;
}

if (error) {
  return <Alert variant="error">{error}</Alert>;
}

// Then render the main component
```

## Common API Endpoints

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh-token` - Refresh authentication token
- `POST /api/auth/forgot-password` - Request password reset

### Event Endpoints
- `GET /api/events` - List all events
- `GET /api/events/:id` - Get event details
- `POST /api/events` - Create new event
- `PUT /api/events/:id` - Update event
- `GET /api/events/:id/statistics` - Get event statistics
- `GET /api/events/:id/dashboard` - Get event dashboard data

### Registration Endpoints
- `GET /api/events/:eventId/registrations` - List registrations for event
- `POST /api/events/:eventId/registrations` - Create new registration
- `GET /api/registrations/:id` - Get registration details
- `PUT /api/registrations/:id` - Update registration
- `POST /api/events/:eventId/registrations/import` - Import registrations

### Resource Tracking Endpoints
- `GET /api/events/:eventId/resources` - List all resources for event
- `POST /api/events/:eventId/resources` - Record resource usage
- `GET /api/events/:eventId/resources/food` - Get food tracking data
- `POST /api/events/:eventId/resources/food` - Record food distribution
- `GET /api/events/:eventId/resources/kits` - Get kit distribution data
- `POST /api/events/:eventId/resources/kits` - Record kit distribution

### Abstract Endpoints
- `GET /api/events/:eventId/abstracts` - List abstracts for event
- `POST /api/events/:eventId/abstracts` - Submit new abstract
- `GET /api/abstracts/:id` - Get abstract details
- `PUT /api/abstracts/:id` - Update abstract
- `PUT /api/abstracts/:id/review` - Update abstract review status

## Implementation Status

The project is in active development with some components fully implemented and others still using mock data. The tracking-mock-data-removal.md file tracks the progress of replacing mock data with real API calls.

### Completed Components
- Event Portal core functionality
- Event Settings with tab-based interface
- Email Template management
- Bulk Import for registrations
- Kit Bag Distribution tracking
- Abstract submission system

### In Progress Components
- ResourceConfiguration
- Certificate Issuance

### Components Still Using Mock Data
- ReportBuilder
- CategoryResources
- CreateRegistration
- EventRegistration
- AbstractSubmissions
- ResourceDistribution
- BadgePrinting 