# Database Schema Documentation

This document outlines the MongoDB schema for the ONSITE ATLAS application. It describes all collections, their fields, data types, and relationships.

## Collections Overview

- **Users**: Admin and staff accounts
- **Events**: Conference/event details
- **Categories**: Attendee types for events
- **Registrations**: Attendee information
- **Resources**: Resource tracking (food, kit, certificate usage)
- **ResourceSettings**: Configuration for resources
- **Abstracts**: Abstract submissions

## Users Collection

Stores administrator and staff account information.

```js
{
  _id: ObjectId,                 // MongoDB document ID
  name: String,                  // User's full name
  email: String,                 // User's email address (unique)
  password: String,              // Hashed password
  role: String,                  // User role (admin, staff)
  events: [ObjectId],            // References to events this user has access to
  isActive: Boolean,             // Whether the account is active
  createdAt: Date,               // Account creation timestamp
  updatedAt: Date                // Last update timestamp
}
```

## Events Collection

Stores conference or event details.

```js
{
  _id: ObjectId,                 // MongoDB document ID
  name: String,                  // Event name
  description: String,           // Event description
  startDate: Date,               // Event start date
  endDate: Date,                 // Event end date
  venue: {                       // Venue information
    name: String,                // Venue name
    address: String,             // Street address
    city: String,                // City
    state: String,               // State/province
    country: String,             // Country
    zipCode: String              // Postal/zip code
  },
  registrationSettings: {        // Registration configuration
    idPrefix: String,            // Prefix for registration IDs
    startNumber: Number,         // Starting number for registration IDs
    isOpen: Boolean,             // Whether registration is open
    allowOnsite: Boolean,        // Whether on-site registration is allowed
    customFields: Array          // Custom registration fields
  },
  categories: [ObjectId],        // References to categories (may be redundant)
  abstractSettings: {            // Abstract submission settings
    isOpen: Boolean,             // Whether abstract submission is open
    deadline: Date,              // Submission deadline
    maxLength: Number,           // Maximum abstract length
    allowEditing: Boolean        // Whether authors can edit after submission
  },
  createdBy: ObjectId,           // User who created the event
  status: String,                // Event status (draft, published, etc.)
  meals: Array,                  // Configured meals for the event
  kitItems: Array,               // Configured kit items
  certificateTypes: Array,       // Configured certificate types
  createdAt: Date,               // Creation timestamp
  updatedAt: Date                // Last update timestamp
}
```

## Categories Collection

Defines different attendee types and their entitlements.

```js
{
  _id: ObjectId,                 // MongoDB document ID
  name: String,                  // Category name (e.g., Speaker, Delegate)
  event: ObjectId,               // Reference to parent event
  color: String,                 // Color code for UI representation
  permissions: {                 // Resource permissions
    meals: Boolean,              // Whether category can access meals
    kitItems: Boolean,           // Whether category can access kit items
    certificates: Boolean,       // Whether category can access certificates
    abstractSubmission: Boolean  // Whether category can submit abstracts
  },
  mealEntitlements: Array,       // Specific meal items allowed
  kitItemEntitlements: Array,    // Specific kit items allowed
  certificateEntitlements: Array,// Specific certificate types allowed
  createdAt: Date,               // Creation timestamp
  updatedAt: Date                // Last update timestamp
}
```

## Registrations Collection

Stores attendee registration information.

```js
{
  _id: ObjectId,                 // MongoDB document ID
  registrationId: String,        // Unique registration ID (e.g., ATC-0006)
  event: ObjectId,               // Reference to parent event
  category: ObjectId,            // Reference to attendee category
  personalInfo: {                // Personal information
    firstName: String,           // First name
    lastName: String,            // Last name
    email: String,               // Email address
    phone: String,               // Phone number
    organization: String,        // Organization/company
    country: String              // Country
  },
  badgePrinted: Boolean,         // Whether badge has been printed
  checkIn: {                     // Check-in status
    isCheckedIn: Boolean,        // Whether attendee has checked in
    checkedInAt: Date,           // Check-in timestamp (optional)
    checkedInBy: ObjectId        // User who checked in the attendee (optional)
  },
  resourceUsage: {               // Resource usage tracking
    meals: Array,                // Meals claimed
    kitItems: Array,             // Kit items claimed
    certificates: Array          // Certificates issued
  },
  registrationType: String,      // Registration type (online, onsite, imported)
  status: String,                // Registration status (active, canceled)
  qrCode: String,                // URL to QR code image
  createdAt: Date,               // Creation timestamp
  updatedAt: Date                // Last update timestamp
}
```

## Resources Collection

Tracks resource issuance and usage.

```js
{
  _id: ObjectId,                 // MongoDB document ID
  event: ObjectId,               // Reference to parent event
  registration: ObjectId,        // Reference to registration
  type: String,                  // Resource type (food, kit, certificate)
  subType: String,               // Specific resource subtype (meal name, kit item)
  issuedBy: ObjectId,            // User who issued the resource
  issuedAt: Date,                // Timestamp when issued
  isVoided: Boolean,             // Whether the resource is voided
  voidedBy: ObjectId,            // User who voided the resource (if voided)
  voidedAt: Date,                // Timestamp when voided (if voided)
  voidReason: String,            // Reason for voiding (if voided)
  notes: String,                 // Additional notes
  createdAt: Date,               // Creation timestamp
  updatedAt: Date                // Last update timestamp
}
```

## ResourceSettings Collection

Configures resource settings for events.

```js
{
  _id: ObjectId,                 // MongoDB document ID
  event: ObjectId,               // Reference to parent event
  type: String,                  // Resource type (food, kit, certificate)
  settings: {                    // Resource-specific settings
    // For food:
    meals: [String],             // Available meals
    options: [String],           // Food options (veg, non-veg)
    days: Number,                // Number of event days
    
    // For kit:
    items: [String],             // Available kit items
    options: [String],           // Size options if applicable
    
    // For certificate:
    types: [String]              // Certificate types
  },
  isEnabled: Boolean,            // Whether this resource type is enabled
  createdBy: ObjectId,           // User who created these settings
  updatedBy: ObjectId,           // User who last updated these settings
  createdAt: Date,               // Creation timestamp
  updatedAt: Date                // Last update timestamp
}
```

## Abstracts Collection

Stores abstract submissions.

```js
{
  _id: ObjectId,                 // MongoDB document ID
  event: ObjectId,               // Reference to parent event
  registration: ObjectId,        // Reference to registration of submitter
  title: String,                 // Abstract title
  content: String,               // Abstract content
  authors: [                     // List of authors
    {
      name: String,              // Author name
      affiliation: String,       // Author affiliation
      isPresenting: Boolean      // Whether this author is presenting
    }
  ],
  category: String,              // Abstract category
  status: String,                // Submission status (submitted, approved, rejected)
  reviewedBy: ObjectId,          // User who reviewed the abstract
  reviewNotes: String,           // Review notes
  submittedAt: Date,             // Submission timestamp
  updatedAt: Date                // Last update timestamp
}
```

## Relationships

- **Users to Events**: One-to-many (users can create multiple events)
- **Events to Categories**: One-to-many (events have multiple categories)
- **Events to Registrations**: One-to-many (events have multiple registrations)
- **Categories to Registrations**: One-to-many (categories can have multiple registrations)
- **Events to ResourceSettings**: One-to-many (events have multiple resource settings)
- **Registrations to Resources**: One-to-many (registrations can have multiple resources)
- **Registrations to Abstracts**: One-to-many (registrations can have multiple abstract submissions)

## Indexes

The following fields should be indexed for optimal performance:

- `users.email` (unique)
- `events.createdBy`
- `categories.event`
- `registrations.event`
- `registrations.registrationId` (unique)
- `registrations.category`
- `resources.event`
- `resources.registration`
- `resourceSettings.event` and `resourceSettings.type` (compound index)
- `abstracts.event`
- `abstracts.registration` 