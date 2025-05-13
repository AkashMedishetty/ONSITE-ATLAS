# Onsite Atlas Project Handover
**Timestamp: 2025-03-18 12:00 PM**

## Project Overview

Onsite Atlas is a comprehensive conference management system designed to handle:
- Onsite registration
- Badge printing
- Resource tracking (food, kits, certificates)
- Abstract submission and review

The system features a multi-tenant architecture supporting multiple events, with a focus on streamlining resource distribution and tracking throughout the event lifecycle.

## Project Structure

### Client-Side Structure
```
client/
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── Alert
│   │   │   ├── Badge
│   │   │   ├── Button
│   │   │   ├── Card
│   │   │   ├── etc...
│   ├── layouts/
│   │   ├── MainLayout
│   │   ├── DashboardLayout
│   ├── pages/
│   │   ├── Events/
│   │   │   ├── EventList.jsx
│   │   │   ├── EventForm.jsx
│   │   │   ├── EventPortal.jsx
│   │   │   ├── EventSettings.jsx
│   │   │   ├── settings/
│   │   │   │   ├── GeneralTab.jsx
│   │   │   │   ├── RegistrationTab.jsx
│   │   │   │   ├── ResourcesTab.jsx
│   │   │   │   ├── AbstractsTab.jsx
│   │   │   │   ├── BadgesTab.jsx
│   │   │   │   ├── PaymentTab.jsx
│   │   │   │   ├── EmailTab.jsx
│   │   │   │   ├── index.js
│   │   ├── Registration/
│   │   │   ├── RegistrationList.jsx
│   │   │   ├── RegistrationForm.jsx
│   │   │   ├── BulkImport.jsx
│   │   │   ├── index.js
│   │   ├── Resources/
│   │   │   ├── ResourceList.jsx
│   │   │   ├── ScannerStation.jsx
│   │   │   ├── FoodTracking.jsx
│   │   │   ├── KitBagDistribution.jsx
│   │   │   ├── CertificateIssuance.jsx
│   │   │   ├── ResourceConfiguration.jsx (to be implemented)
│   │   │   ├── index.js
│   │   ├── Abstracts/
│   │   │   ├── AbstractList.jsx
│   │   │   ├── AbstractForm.jsx
│   │   │   ├── AbstractDetail.jsx
│   │   │   ├── AbstractPortal.jsx
│   │   ├── BadgePrinting/
│   │   │   ├── BadgeDesigner.jsx
│   │   ├── PublicPortals/
│   │   │   ├── RegistrationPortal.jsx
│   │   │   ├── AbstractSubmissionPortal.jsx
│   │   ├── Reports/
│   │   │   ├── ReportsPage.jsx
│   │   │   ├── ReportBuilder.jsx
│   │   ├── Settings/
│   │   │   ├── SettingsPage.jsx
│   │   │   ├── UserManagement.jsx
│   │   │   ├── GlobalSettings.jsx
│   │   │   ├── EmailTemplates.jsx
│   │   │   ├── PaymentGateways.jsx
│   │   ├── Auth/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── ForgotPasswordPage.jsx
│   ├── context/
│   ├── hooks/
│   ├── utils/
│   ├── App.jsx
│   └── main.jsx
```

### Server-Side Structure
```
server/
├── src/
│   ├── controllers/
│   │   ├── eventController.js
│   │   ├── registrationController.js
│   │   ├── resourceController.js
│   │   ├── abstractController.js
│   │   └── etc...
│   ├── models/
│   │   ├── User.js
│   │   ├── Event.js
│   │   ├── Category.js
│   │   ├── Registration.js
│   │   ├── ResourceTracking.js
│   │   ├── Abstract.js
│   │   └── etc...
│   ├── routes/
│   │   ├── eventRoutes.js
│   │   ├── registrationRoutes.js
│   │   ├── resourceRoutes.js
│   │   ├── abstractRoutes.js
│   │   └── etc...
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── errorHandler.js
│   │   └── etc...
│   ├── config/
│   │   ├── db.js
│   │   └── etc...
│   └── app.js
```

## Implemented Components

### Events Module

#### EventPortal Component (`client/src/pages/Events/EventPortal.jsx`)
- Central hub for managing event-specific data and resources
- Displays event statistics, recent activities, and category distribution
- Provides quick access links to registrations, resources, and settings
- Access via URL: `/events/:id`

#### EventSettings Component (`client/src/pages/Events/EventSettings.jsx`)
- Comprehensive settings management for events
- Tab-based interface with multiple configuration sections:
  - General: Basic event details
  - Registration: Registration form configuration
  - Resources: Food, kit, certificate settings
  - Abstracts: Abstract submission settings
  - Badges: Badge design and printing settings
  - Payment: Payment gateway and pricing
  - Email: Email templates and notifications
- Uses modular tab components for organized code structure

#### EmailTab Component (`client/src/pages/Events/settings/EmailTab.jsx`)
- Email template management interface
- Sender configuration (email, name)
- Template editor for different notification types
- Variable placeholders for personalized emails
- Preview and test functionality
- Supports HTML formatting

#### Settings Tabs Structure
- All tab components follow consistent interface:
  - Props: `{ event, setEvent, setFormChanged }`
  - Data model: Updates are applied to event object and tracked via formChanged flag
  - User interface: Input fields, toggles, and specialized editors

### Registration Module

#### BulkImport Component (`client/src/pages/Registration/BulkImport.jsx`)
- Multi-step registration import process:
  1. File upload (XLSX/CSV)
  2. Data preview
  3. Field mapping (with required field validation)
  4. Results summary
- Detailed reporting of import success/failures
- Input validation and error handling
- Responsive interface with progress indicators

### Resources Module

#### KitBagDistribution Component (`client/src/pages/Resources/KitBagDistribution.jsx`)
- Interface for tracking kit bag items distributed to attendees
- QR code scanning to validate attendee eligibility
- Kit type selection with category permissions
- Real-time validation of category-based entitlements
- Distribution tracking with timestamps
- Distribution statistics and recent activity log

#### ResourceConfiguration (to be implemented)
- Currently being developed to manage resource settings:
  - Meal configuration
  - Kit item management
  - Certificate type settings
  - Category-based permissions

### Abstract Submission System

#### Abstract Components
- Complete system for managing academic abstract submissions
- Abstract model with MongoDB schema
- CRUD operations and validation
- Status management and review workflow
- Bulk download functionality

## API Interactions

### Event Management API

#### GET /api/events
- **Purpose**: Fetch list of all events
- **Response**: Array of event objects with basic information
- **Used by**: EventList component

#### GET /api/events/:id
- **Purpose**: Fetch detailed event information
- **Response**: Complete event object with all settings
- **Used by**: EventPortal, EventSettings components

#### POST /api/events
- **Purpose**: Create new event
- **Request Body**: Event details (name, dates, venue, etc.)
- **Response**: Created event object with ID
- **Used by**: EventForm component

#### PUT /api/events/:id
- **Purpose**: Update event details and settings
- **Request Body**: Updated event object
- **Response**: Updated event object
- **Used by**: EventSettings component

### Registration API

#### GET /api/events/:eventId/registrations
- **Purpose**: Fetch registrations for specific event
- **Query Params**: Pagination, filters
- **Response**: Array of registration objects
- **Used by**: RegistrationList component

#### POST /api/events/:eventId/registrations
- **Purpose**: Create new registration
- **Request Body**: Registration details
- **Response**: Created registration with ID and QR code
- **Used by**: RegistrationForm component

#### POST /api/events/:eventId/registrations/import
- **Purpose**: Bulk import registrations
- **Request Body**: 
  ```json
  {
    "mappings": {
      "firstName": "A",
      "lastName": "B",
      "email": "C",
      "organization": "D",
      "category": "E"
    },
    "data": [
      {"A": "John", "B": "Doe", "C": "john@example.com", "D": "Org", "E": "Delegate"},
      ...
    ]
  }
  ```
- **Response**: Import results with success/failure counts
- **Used by**: BulkImport component

### Resource Tracking API

#### GET /api/events/:eventId/resources/food
- **Purpose**: Get food tracking data
- **Response**: Food tracking records with timestamps
- **Used by**: FoodTracking component

#### POST /api/events/:eventId/resources/food
- **Purpose**: Record food distribution
- **Request Body**: 
  ```json
  {
    "registrationId": "MED23-001",
    "mealType": "lunch",
    "date": "2023-09-15"
  }
  ```
- **Response**: Created tracking record
- **Used by**: FoodTracking, ScannerStation components

#### GET /api/events/:eventId/resources/kits
- **Purpose**: Get kit distribution data
- **Response**: Kit tracking records
- **Used by**: KitBagDistribution component

#### POST /api/events/:eventId/resources/kits
- **Purpose**: Record kit distribution
- **Request Body**: 
  ```json
  {
    "registrationId": "MED23-001",
    "kitItemId": "kit_1"
  }
  ```
- **Response**: Created tracking record
- **Used by**: KitBagDistribution component

### Abstract API

#### GET /api/events/:eventId/abstracts
- **Purpose**: Fetch abstracts for event
- **Query Params**: Pagination, filters, status
- **Response**: Array of abstract objects
- **Used by**: AbstractList component

#### POST /api/events/:eventId/abstracts
- **Purpose**: Submit new abstract
- **Request Body**: Abstract content, author information
- **Response**: Created abstract with ID
- **Used by**: AbstractForm component

#### GET /api/events/:eventId/abstracts/:id
- **Purpose**: Fetch single abstract
- **Response**: Complete abstract object with review data
- **Used by**: AbstractDetail component

#### PUT /api/events/:eventId/abstracts/:id
- **Purpose**: Update abstract
- **Request Body**: Updated abstract content
- **Response**: Updated abstract object
- **Used by**: AbstractForm component

#### POST /api/events/:eventId/abstracts/:id/review
- **Purpose**: Submit review for abstract
- **Request Body**: Review comments, score, decision
- **Response**: Updated abstract with review status
- **Used by**: AbstractDetail component

#### GET /api/events/:eventId/abstracts/download
- **Purpose**: Download all abstracts
- **Query Params**: Format (PDF, DOCX, CSV)
- **Response**: File download
- **Used by**: AbstractList component

## Database Schema Details

### Users Collection
```javascript
{
  _id: ObjectId,
  email: String,
  password: String,
  name: String,
  role: String, // 'admin', 'staff', 'reviewer'
  permissions: [String],
  createdAt: Date,
  updatedAt: Date
}
```

### Events Collection
```javascript
{
  _id: ObjectId,
  name: String,
  description: String,
  startDate: Date,
  endDate: Date,
  venue: String,
  city: String,
  state: String,
  country: String,
  organizerName: String,
  organizerEmail: String,
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
  paymentSettings: {
    enabled: Boolean,
    gateway: String, // 'stripe', 'paypal', etc.
    currency: String,
    allowSkip: Boolean,
    categories: [
      {
        categoryId: String,
        amount: Number
      }
    ]
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

### Categories Collection
```javascript
{
  _id: ObjectId,
  eventId: ObjectId,
  name: String,
  description: String,
  color: String,
  badgeTemplate: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Registrations Collection
```javascript
{
  _id: ObjectId,
  eventId: ObjectId,
  registrationId: String, // e.g., 'MED23-001'
  qrCode: String,
  firstName: String,
  lastName: String,
  email: String,
  phone: String,
  organization: String,
  country: String,
  categoryId: ObjectId,
  status: String, // 'registered', 'checked-in', 'cancelled'
  checkInTime: Date,
  customFields: {
    [fieldId]: String
  },
  paymentStatus: String, // 'pending', 'paid', 'waived'
  createdAt: Date,
  updatedAt: Date
}
```

### ResourceTracking Collection
```javascript
{
  _id: ObjectId,
  eventId: ObjectId,
  registrationId: ObjectId,
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

### Abstracts Collection
```javascript
{
  _id: ObjectId,
  eventId: ObjectId,
  abstractId: String, // e.g., 'ABS-001'
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
    registrationId: ObjectId,
    name: String,
    email: String
  },
  status: String, // 'draft', 'submitted', 'under-review', 'accepted', 'rejected'
  reviews: [
    {
      reviewerId: ObjectId,
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

## Development Status

### Completed Components
- Event Portal core functionality
- Event Settings with tab-based interface
- Email Template management
- Bulk Import for registrations
- Kit Bag Distribution tracking
- Abstract submission system

### In Progress Components
- ResourceConfiguration (needs implementation)
- Certificate Issuance

### Upcoming Tasks
- Authentication system
- Badge Designer
- Abstract Portal for public submissions
- Reports and Analytics features
- User management and permissions

## UI/UX Implementation

### Design Philosophy
- Minimalist elegance with creative accents
- Clean, uncluttered interfaces
- Typography-focused design
- Subtle animations for feedback

### Components Library
Common UI components developed so far:
- Alert
- Badge
- Button
- Card
- Checkbox
- Input
- Modal
- Pagination
- Select
- Spinner
- Tabs
- Textarea
- Tooltip

### Layout Components
- MainLayout: Base layout with navigation and footer
- DashboardLayout: Application dashboard layout with sidebar

## Tech Stack Details

### Frontend
- React with Vite for fast development
- Tailwind CSS for styling
- React Router for navigation

### Backend
- Node.js with Express
- MongoDB (Atlas) for database
- Connection string: mongodb+srv://AkashMedishetty:<password>@onsitealturism.lzb7f.mongodb.net/?retryWrites=true&w=majority&appName=OnsiteAlturism

## Key Project Features

1. **Multi-tenant Architecture**
   - Each event is isolated with its own settings
   - Cross-event reporting and management

2. **Resource Tracking**
   - Comprehensive tracking of food, kits, and certificates
   - QR code-based validation
   - Category-based permissions

3. **Abstract Management**
   - Complete submission to review workflow
   - Author management
   - Review process
   - Bulk download

4. **Registration Management**
   - Custom Registration ID generation
   - Dynamic registration forms
   - Bulk import/export
   - Badge printing

## Open Issues

1. Missing `ResourceConfiguration.jsx` component causing import error.
2. Need to implement `CertificateIssuance.jsx` component.
3. Authentication system needs to be implemented.
4. Need to connect frontend components to backend API endpoints.

## Next Steps

1. Implement the `ResourceConfiguration.jsx` component.
2. Complete the `CertificateIssuance.jsx` component.
3. Implement the authentication system.
4. Add integration with backend APIs.
5. Develop the reporting and analytics features.
6. Implement user management and permissions system.
7. Create comprehensive testing suite.
8. Deploy application to AWS infrastructure.

---

This handover document was created on 2025-03-18 to facilitate continuous development of the Onsite Atlas project. It captures the current state, structure, and implementation details to help new developers or team members quickly understand the project. 