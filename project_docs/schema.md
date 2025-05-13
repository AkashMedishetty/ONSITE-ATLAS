# Onsite Atlas Database Schema

This document outlines the MongoDB schema design for the Onsite Atlas application.

## Core Collections

### Users
Stores admin and staff user accounts.

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

### Events
Stores conference/event details.

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

### Categories
Stores attendee types with their permissions.

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

### Registrations
Stores attendee registration information.

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

### Abstracts
Stores abstract submissions.

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
  attachments: [{
    filename: String,
    originalName: String,
    mimeType: String,
    size: Number,
    url: String,
    uploadedAt: Date
  }],
  review: {
    status: String (enum: 'pending', 'approved', 'rejected', 'revisions_requested'),
    reviewedBy: ObjectId (references User),
    reviewedAt: Date,
    comments: String
  },
  lastEdited: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## Relationships

### One-to-Many Relationships
- User to Events (a user can manage multiple events)
- Event to Categories (an event can have multiple categories)
- Event to Registrations (an event can have multiple registrations)
- Category to Registrations (a category can have multiple registrations)
- Registration to Abstracts (a registration can have multiple abstracts)

### Many-to-Many Relationships
- Users to Events (users can be assigned to multiple events, and events can have multiple users)

## Indexes

### User Collection
- `email`: Unique index for fast lookups during authentication
- `events`: Index for querying users by event

### Event Collection
- `createdBy`: Index for querying events by creator
- `status`: Index for filtering events by status

### Category Collection
- `event`: Index for querying categories by event

### Registration Collection
- `registrationId`: Unique index for fast lookups by ID
- `event`: Index for querying registrations by event
- `category`: Index for querying registrations by category
- `personalInfo.email`: Index for querying registrations by email
- Compound index on `event` and `personalInfo.email` for uniqueness validation

### Abstract Collection
- `event`: Index for querying abstracts by event
- `registration`: Index for querying abstracts by registration
- `review.status`: Index for filtering abstracts by review status

## Data Validation

MongoDB schema validation is implemented to ensure data integrity:

- Required fields are enforced
- Enum values are restricted to predefined sets
- String fields have minimum and maximum lengths
- Date fields are validated for proper format
- Numeric fields have minimum and maximum values

## Notes on Schema Design

1. **Embedded vs. Referenced Documents**:
   - Small, static data is embedded (e.g., venue information in Event)
   - Large or frequently changing data uses references (e.g., registrations)

2. **Denormalization Strategy**:
   - Category names are stored in Registration documents for faster retrieval
   - Event names are stored in Abstract documents for faster retrieval

3. **Scalability Considerations**:
   - Indexes are created for frequently queried fields
   - Large text fields (like abstract content) are monitored for size
   - Pagination is implemented for large collections

4. **Data Lifecycle**:
   - Soft deletion is used for most entities (status field)
   - Archiving strategy for old events 