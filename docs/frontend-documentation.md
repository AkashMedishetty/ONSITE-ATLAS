# Frontend Documentation: Onsite Atlas

## Table of Contents
1. [Overview](#overview)
2. [Page Structure](#page-structure)
3. [Main Pages and Components](#main-pages-and-components)
4. [Navigation Structure](#navigation-structure)
5. [Data Flow](#data-flow)
6. [API Interactions](#api-interactions)
7. [Identified Issues](#identified-issues)

## Overview

The Onsite Atlas frontend is built with React using Vite as the build tool. It follows a component-based architecture with a structured organization of pages, layouts, components, and services.

**Key Technologies:**
- React with Vite
- React Router v6 for routing
- Tailwind CSS for styling
- Framer Motion for animations
- Axios for API requests

## Page Structure

The frontend follows a hierarchical structure:

```
client/src/
├── components/     # Reusable UI components
├── contexts/       # React context providers
├── layouts/        # Page layouts
├── pages/          # Main page components
├── services/       # API services
├── utils/          # Utility functions
└── App.jsx         # Main routing component
```

### Main Page Categories:

- **Auth**: Login, registration, and password recovery
- **Events**: Event management, creation, and settings
- **Registration**: User registration management
- **Resources**: Resource tracking (food, kits, certificates)
- **Abstracts**: Abstract submission and review
- **BadgePrinting**: Badge design and printing
- **Categories**: Category management
- **Reports**: Reporting and analytics
- **Settings**: System settings and configuration
- **PublicPortals**: Public-facing registration and abstract submission

## Main Pages and Components

### Dashboard and Timeline Pages

#### Dashboard
- **File**: `client/src/pages/Dashboard.jsx`
- **Purpose**: Main landing page and data overview
- **Key Components**: Statistics cards, event list, activity feed
- **Data Requirements**: System statistics, upcoming events, recent activities
- **API Interactions**: Fetches system-wide statistics and recent events
- **Issues**: Currently using mock data instead of real API connections

#### Timeline
- **File**: `client/src/pages/Timeline.jsx`
- **Purpose**: Visual timeline of events and activities
- **Key Components**: Interactive timeline, filters, event cards
- **Data Requirements**: Events with dates, activity log
- **Features**: Timeline navigation, event filtering, activity visualization
- **Issues**: Using hardcoded data, needs API integration

### Events Module

#### EventList
- **File**: `client/src/pages/Events/EventList.jsx`
- **Purpose**: Displays a list of all events with filtering and pagination
- **Key Components**: Card, Button, Badge, Spinner components
- **Data Requirements**: Fetches event list from `eventService.getEvents()`
- **Navigation**: Links to event details, creation, and editing

#### EventForm
- **File**: `client/src/pages/Events/EventForm.jsx`
- **Purpose**: Form for creating or editing events
- **Key Components**: Form input components, date pickers, buttons
- **Data Requirements**: 
  - For editing: Fetches event data from `eventService.getEventById(id)`
  - Submits via `eventService.createEvent()` or `eventService.updateEvent()`
- **State Management**: Form state with validation

#### EventPortal
- **File**: `client/src/pages/Events/EventPortal.jsx`
- **Purpose**: Central hub for managing a specific event
- **Key Components**: Tabs for different event sections (dashboard, registrations, resources, etc.)
- **Data Requirements**: 
  - Event details: `eventService.getEventById(id)`
  - Statistics: `eventService.getEventStatistics(id)`
- **Tab Navigation**: Dashboard, Registrations, Categories, Resources, Abstracts, Badges, Reports, Settings
- **Issues**: Tab persistence problems, statistics endpoint failures

#### EventSettings
- **File**: `client/src/pages/Events/EventSettings.jsx`
- **Purpose**: Comprehensive settings management for events
- **Key Components**: Tab-based interface with separate tabs for different settings
- **Sub-Components**:
  - GeneralTab: Basic event details
  - RegistrationTab: Registration form configuration
  - ResourcesTab: Food, kit, certificate settings
  - AbstractsTab: Abstract submission settings
  - BadgesTab: Badge design settings
  - PaymentTab: Payment gateway settings
  - EmailTab: Email template settings
- **Data Flow**: Settings changes are applied to the event object and tracked with a `formChanged` flag

### Registration Module

#### RegistrationList
- **File**: `client/src/pages/Registration/RegistrationList.jsx`
- **Purpose**: Displays list of registrations with filtering, sorting, and pagination
- **Key Components**: Tables, filters, search inputs
- **Data Requirements**: Fetches registrations from `registrationService.getRegistrations(params)`
- **Filters**: Status, event, search term
- **Pagination**: Page-based navigation

#### RegistrationForm
- **File**: `client/src/pages/Registration/RegistrationForm.jsx`
- **Purpose**: Form for creating or editing registrations
- **Key Components**: Form inputs based on event configuration
- **Data Requirements**:
  - Categories: `eventService.getEventCategories(eventId)`
  - Form config: `eventService.getRegistrationFormConfig(eventId)`
  - For editing: `registrationService.getRegistrationById(id)`
- **Dynamic Forms**: Renders form fields based on event configuration

#### BulkImport
- **File**: `client/src/pages/Registration/BulkImport.jsx`
- **Purpose**: Multi-step process for bulk importing registrations from Excel/CSV
- **Key Components**: File upload, mapping interface, results summary
- **Steps**:
  1. File upload (XLSX/CSV)
  2. Data preview
  3. Field mapping
  4. Import execution and results display
- **API Interaction**: `registrationService.importRegistrations(eventId, data)`

### Categories Module

#### CategoryList
- **File**: `client/src/pages/Categories/CategoryList.jsx`
- **Purpose**: Displays a list of categories for an event
- **Key Components**: Category cards with color indicators, filters, search
- **Data Requirements**: Fetches categories from `categoryService.getCategories(eventId)`
- **Features**: Filtering, sorting, pagination, quick actions (edit, delete)
- **Issues**: Currently using mock data instead of API integration

#### CategoryForm
- **File**: `client/src/pages/Categories/CategoryForm.jsx`
- **Purpose**: Form for creating or editing categories
- **Key Components**: Form inputs for category details, color picker
- **Data Requirements**: 
  - For editing: Fetches category from `categoryService.getCategoryById(id)`
  - Submits via `categoryService.createCategory()` or `categoryService.updateCategory()`
- **Features**: Color selection, permission settings
- **Issues**: Using mock data, inconsistent validation

#### CategoryDetail
- **File**: `client/src/pages/Categories/CategoryDetail.jsx`
- **Purpose**: Detailed view of a single category with permissions and statistics
- **Key Components**: Information cards, permission toggles, registrant counts
- **Data Requirements**: Category details, registrations in this category, resource permissions
- **API Interactions**: Gets category details and related data
- **Issues**: Using mock data, missing API implementation

#### CategoryResources
- **File**: `client/src/pages/Categories/CategoryResources.jsx`
- **Purpose**: Configure resources available to a specific category
- **Key Components**: Resource type toggle switches, permission matrix
- **Data Requirements**: Category details, available resources
- **Features**: Permission management for meals, kit items, certificates
- **Issues**: Using mock data, needs API integration

### Resources Module

#### ResourceList
- **File**: `client/src/pages/Resources/ResourceList.jsx`
- **Purpose**: Overview of all resources across events
- **Key Components**: Tables, filters, statistics cards
- **Data Requirements**: Fetches resource data from `resourceService.getResources(params)`

#### FoodTracking
- **File**: `client/src/pages/Resources/FoodTracking.jsx`
- **Purpose**: Interface for tracking meal consumption with QR scanning
- **Key Components**: QR scanner, meal selection, tracking logs
- **Data Requirements**:
  - Food config: `resourceService.getFoodConfig(eventId)`
  - Recent scans: `resourceService.getRecentFoodScans(eventId)`
  - Statistics: `resourceService.getFoodStatistics(eventId)`
- **Scanning Flow**: Scan QR → Validate → Record distribution
- **API Interactions**: Records food distribution via `resourceService.recordFoodDistribution(data)`

#### KitBagDistribution
- **File**: `client/src/pages/Resources/KitBagDistribution.jsx`
- **Purpose**: Interface for tracking kit bag distribution with QR scanning
- **Key Components**: QR scanner, kit item selection, distribution logs
- **Data Requirements**:
  - Kit items: `resourceService.getKitItems(eventId)`
  - Recent distributions: `resourceService.getRecentKitDistributions(eventId)`
  - Statistics: `resourceService.getKitStatistics(eventId)`
- **Scanning Flow**: Similar to FoodTracking, but for kit items
- **API Interactions**: Records kit distribution via `resourceService.recordKitDistribution(data)`

#### CertificateIssuance
- **File**: `client/src/pages/Resources/CertificateIssuance.jsx`
- **Purpose**: Interface for issuing certificates to attendees
- **Key Components**: Certificate selection, recipient search, issuance logs
- **Data Requirements**: Certificate types, recipients, issuance history
- **API Interactions**: `resourceService.issueCertificate(data)`
- **Issues**: Component is incomplete, needs further implementation and API integration

#### ScannerStation
- **File**: `client/src/pages/Resources/ScannerStation.jsx`
- **Purpose**: Generic scanner interface configurable for different resource types
- **Key Components**: QR scanner, resource selection, validation display
- **Configuration**: Can be set up for different resource types (food, kit, certificate)
- **API Interactions**: Uses the appropriate resource service based on type
- **Issues**: Import issues with QR code reader library, problems handling undefined resourceType

#### ResourceConfiguration
- **File**: `client/src/pages/Resources/ResourceConfiguration.jsx`
- **Purpose**: Configuration interface for resources (meals, kit items, certificates)
- **Key Components**: Configuration forms for each resource type
- **Data Requirements**: Current resource configurations
- **API Interactions**: Updates resource settings via appropriate service methods
- **Issues**: Incomplete implementation, causing import errors in other components

### Abstracts Module

#### AbstractList
- **File**: `client/src/pages/Abstracts/AbstractList.jsx`
- **Purpose**: Displays list of abstracts with filtering, sorting, and review capabilities
- **Key Components**: Tables, filters, status indicators
- **Data Requirements**: Fetches abstracts via `abstractService.getAbstracts(params)`
- **Filters**: Status, category, search term

#### AbstractForm
- **File**: `client/src/pages/Abstracts/AbstractForm.jsx`
- **Purpose**: Form for creating or editing abstracts
- **Key Components**: Rich text editor, author management, category selection
- **Data Requirements**:
  - Abstract settings: `eventService.getAbstractSettings(eventId)`
  - For editing: `abstractService.getAbstractById(id)`
- **Validation**: Word count, author information, registration validation

#### AbstractDetail
- **File**: `client/src/pages/Abstracts/AbstractDetail.jsx`
- **Purpose**: Detailed view of a single abstract with review functionality
- **Key Components**: Abstract content display, review form, activity log
- **Data Requirements**: Fetches abstract details via `abstractService.getAbstractById(id)`
- **Review Flow**: Review comment entry, decision selection, submission
- **API Interactions**: Updates abstract reviews via `abstractService.reviewAbstract(id, reviewData)`

#### AbstractPortal
- **File**: `client/src/pages/Abstracts/AbstractPortal.jsx`
- **Purpose**: Public portal for abstract submission
- **Key Components**: Registration validation, abstract form
- **Flow**: Registration verification → Abstract submission form → Confirmation
- **API Interactions**: Validates registration and submits abstracts

### Badge Printing Module

#### BadgeDesigner
- **File**: `client/src/pages/BadgePrinting/BadgeDesigner.jsx`
- **Purpose**: Visual interface for designing badge templates
- **Key Components**: Design canvas, element toolbox, property editor
- **Data Requirements**: Badge templates, categories, sample data
- **Design Features**: Drag-and-drop elements, text formatting, image placement
- **API Interactions**: Saves templates via `eventService.saveBadgeTemplate(eventId, template)`
- **Issues**: Using mock data, canvas rendering issues, needs full API integration

#### BadgePrintingPage
- **File**: `client/src/pages/BadgePrinting/BadgePrintingPage.jsx`
- **Purpose**: Interface for printing badges with template selection
- **Key Components**: Template selection, registrant selection, preview
- **Print Flow**: Select template → Select registrants → Preview → Print
- **API Interactions**: Generates printable badges via `eventService.generateBadges(eventId, data)`
- **Issues**: Using mock data for templates and registrants

### Reports Module

#### ReportsPage
- **File**: `client/src/pages/Reports/ReportsPage.jsx`
- **Purpose**: Display pre-configured reports with data visualization
- **Key Components**: Report selection, filters, data visualization
- **Data Requirements**: Event data, registrations, resource usage, abstracts
- **Features**: Filtering, date range selection, export options
- **API Interactions**: Fetches report data based on selected report type and filters
- **Issues**: Using mock data, incomplete API integration

#### ReportBuilder
- **File**: `client/src/pages/Reports/ReportBuilder.jsx`
- **Purpose**: Interface for creating custom reports
- **Key Components**: Data source selection, field selection, visualization options
- **Features**: Drag-and-drop field selection, chart type selection, filtering
- **API Interactions**: Fetches available data sources and fields, submits report configuration
- **Issues**: Using mock data, needs complete API integration

### Settings Module

#### SettingsPage
- **File**: `client/src/pages/Settings/SettingsPage.jsx`
- **Purpose**: Main settings hub with navigation to specific settings areas
- **Key Components**: Settings navigation, system information
- **Features**: System status, links to specific settings
- **Issues**: Needs implementation of actual settings features

#### UserManagement
- **File**: `client/src/pages/Settings/UserManagement.jsx`
- **Purpose**: Manage system users and permissions
- **Key Components**: User list, role assignment, permission matrix
- **Data Requirements**: Users, roles, permissions
- **Features**: User creation, role assignment, permission management
- **API Interactions**: User CRUD operations, role assignments
- **Issues**: Uses mock data, needs API integration

#### GlobalSettings
- **File**: `client/src/pages/Settings/GlobalSettings.jsx`
- **Purpose**: Manage system-wide settings
- **Key Components**: Settings forms for different aspects of the system
- **Features**: Timezone, date format, default settings
- **Issues**: Uses mock data, needs proper implementation

#### EmailTemplates
- **File**: `client/src/pages/Settings/EmailTemplates.jsx`
- **Purpose**: Manage system email templates
- **Key Components**: Template editor, variable insertion, preview
- **Features**: Rich text editing, variable placeholders, testing
- **API Interactions**: Save and test email templates
- **Issues**: Uses mock data, needs API integration

#### PaymentGateways
- **File**: `client/src/pages/Settings/PaymentGateways.jsx`
- **Purpose**: Configure payment gateway integrations
- **Key Components**: Gateway configuration forms, test interfaces
- **Features**: Multiple gateway support, testing tools
- **Issues**: Uses mock data, needs API integration

### Auth Module

#### LoginPage
- **File**: `client/src/pages/Auth/LoginPage.jsx`
- **Purpose**: User authentication
- **Key Components**: Login form, error display
- **API Interactions**: `authService.login(credentials)`
- **Issues**: Incomplete authentication system, token management issues

#### RegisterPage
- **File**: `client/src/pages/Auth/RegisterPage.jsx`
- **Purpose**: New user registration
- **Key Components**: Registration form with validation
- **API Interactions**: `authService.register(userData)`
- **Issues**: Incomplete validation, missing backend implementation

#### ForgotPasswordPage
- **File**: `client/src/pages/Auth/ForgotPasswordPage.jsx`
- **Purpose**: Password recovery
- **Key Components**: Email entry form, confirmation display
- **API Interactions**: `authService.requestPasswordReset(email)`
- **Issues**: Missing backend implementation

### Public Portals

#### RegistrationPortal
- **File**: `client/src/pages/PublicPortals/RegistrationPortal.jsx`
- **Purpose**: Public portal for event registration
- **Key Components**: Dynamic registration form based on event configuration
- **Data Requirements**: Event details, categories, form configuration
- **Form Validation**: Required fields, email format, custom validations
- **API Interactions**: Creates registrations via `registrationService.registerForEvent(data)`
- **Issues**: Inconsistent validation, error handling problems

## Navigation Structure

The application uses React Router v6 for navigation, defined in `App.jsx`:

### Main Routing Structure

1. **Authentication Routes**
   - `/login` - LoginPage
   - `/register` - RegisterPage
   - `/forgot-password` - ForgotPasswordPage

2. **Public Portal Routes**
   - `/portal/register/:eventId` - RegistrationPortal
   - `/portal/abstract/:eventId` - AbstractPortal

3. **Main Dashboard Routes**
   - `/` - Dashboard (main landing page)
   - `/timeline` - Timeline view

4. **Event Routes**
   - `/events` - EventList (all events)
   - `/events/new` - EventForm (create)
   - `/events/:id/edit` - EventForm (edit)
   - `/events/:id/settings` - EventSettings
   - `/events/:id` - EventPortal (main event management)

5. **Registration Routes**
   - `/registrations` - RegistrationList (all registrations)
   - `/registrations/new` - RegistrationForm (create)
   - `/registrations/:id/edit` - RegistrationForm (edit)
   - `/registrations/import` - BulkImport

6. **Event-Specific Registration Routes**
   - `/events/:eventId/registrations` - RegistrationList (filtered by event)
   - `/events/:eventId/registrations/new` - RegistrationForm (for event)
   - `/events/:eventId/registrations/:id/edit` - RegistrationForm (for event)
   - `/events/:eventId/registrations/import` - BulkImport (for event)
   - `/events/:eventId/registrations/badges` - BadgePrintingPage

7. **Resource Routes**
   - `/resources` - ResourceList
   - `/resources/scanner` - ScannerStation
   - `/resources/configuration` - ResourceConfiguration
   - `/events/:eventId/resources` - ResourceList (filtered by event)
   - `/events/:eventId/resources/food` - FoodTracking
   - `/events/:eventId/resources/kits` - KitBagDistribution
   - `/events/:eventId/resources/certificates` - CertificateIssuance

8. **Abstract Routes**
   - `/abstracts` - AbstractList (all abstracts)
   - `/abstracts/:id` - AbstractDetail
   - `/events/:eventId/abstracts` - AbstractList (filtered by event)
   - `/events/:eventId/abstracts/new` - AbstractForm
   - `/events/:eventId/abstracts/:id` - AbstractDetail
   - `/events/:eventId/abstracts/:id/edit` - AbstractForm

9. **Badge Routes**
   - `/badge-designer/:eventId` - BadgeDesigner
   - `/events/:eventId/registrations/badge-designer` - BadgeDesigner

10. **Settings Routes**
    - `/settings` - SettingsPage
    - `/settings/users` - UserManagement
    - `/settings/global` - GlobalSettings
    - `/settings/email` - EmailTemplates
    - `/settings/payment` - PaymentGateways

## Data Flow

### Service Layer

The application uses a service layer to handle API interactions:

1. **api.js** - Base API configuration
   - Creates axios instance with proper base URL
   - Sets up interceptors for authentication and error handling
   - Configures default headers and timeout

2. **apiService.js** - Core API utility functions
   - Wrapper functions for API requests
   - Error handling and response formatting
   - Authentication token management

3. **Event-specific services:**
   - `eventService.js` - Event management operations
   - `registrationService.js` - Registration operations
   - `resourceService.js` - Resource tracking operations
   - `abstractService.js` - Abstract submission operations
   - `categoryService.js` - Category management
   - `authService.js` - Authentication operations

### Component Data Flow

1. **Loading Data:**
   - Components use React hooks (useState, useEffect) to manage state
   - API calls are made through service objects
   - Loading states are tracked with boolean flags
   - Errors are caught and displayed

2. **Form Submissions:**
   - Form data collected in state
   - Validation performed before submission
   - Service methods called with structured data
   - Success/error messaging displayed to user

3. **Data Refresh:**
   - Components implement refresh functions to reload data
   - Some components use polling for real-time updates
   - URL parameters used to persist filter state

## API Interactions

Key API interactions by module:

### Response Format Standards

All API interactions with the backend follow these standard formats:

#### Success Response Format
```javascript
{
  success: true,
  data: { ... }  // Response data object or array
}
```

#### Paginated Response Format
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

#### Error Response Format
```javascript
{
  success: false,
  message: "Error message",
  errors: [ ... ]  // Optional array of specific errors
}
```

#### Pagination Parameters

All list endpoints support these pagination parameters:

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)
- `sort`: Field to sort by (e.g., "createdAt")
- `order`: Sort order ("asc" or "desc", default: "desc")
- `search`: Search term for text search

Example API call:
```javascript
// In eventService.js
const getEvents = async (params = {}) => {
  try {
    const { page = 1, limit = 10, sort = 'createdAt', order = 'desc', search = '' } = params;
    const response = await apiService.get('/api/events', {
      params: { page, limit, sort, order, search }
    });
    return response.data;
  } catch (error) {
    return { success: false, message: error.message };
  }
};
```

### Event API

- `GET /api/events` - Fetch all events (used by EventList)
- `GET /api/events/:id` - Fetch event details (EventPortal, EventSettings)
- `POST /api/events` - Create new event (EventForm)
- `PUT /api/events/:id` - Update event (EventSettings)
- `GET /api/events/:id/statistics` - Get event statistics (EventPortal)
- `GET /api/events/:id/dashboard` - Get event dashboard data (EventPortal)

### Registration API

- `GET /api/registrations` - Get all registrations (RegistrationList)
- `GET /api/events/:eventId/registrations` - Get event-specific registrations
- `POST /api/registrations` - Create registration (RegistrationForm)
- `PUT /api/registrations/:id` - Update registration (RegistrationForm)
- `GET /api/registrations/:id` - Get registration details
- `POST /api/events/:eventId/registrations/import` - Bulk import (BulkImport)
- `POST /api/registrations/validate` - Validate registration ID (AbstractPortal)

### Resource API

- `GET /api/resources` - Get all resources (ResourceList)
- `GET /api/events/:eventId/resources/food/config` - Get food configuration (FoodTracking)
- `GET /api/events/:eventId/resources/food/recent` - Get recent food scans (FoodTracking)
- `GET /api/events/:eventId/resources/food/statistics` - Get food statistics (FoodTracking)
- `POST /api/events/:eventId/resources/food` - Record food distribution (FoodTracking, ScannerStation)
- `GET /api/events/:eventId/resources/kits/items` - Get kit items (KitBagDistribution)
- `GET /api/events/:eventId/resources/kits/recent` - Get recent kit distributions
- `POST /api/events/:eventId/resources/kits` - Record kit distribution (KitBagDistribution)
- `GET /api/events/:eventId/resources/certificates/types` - Get certificate types (CertificateIssuance)
- `POST /api/events/:eventId/resources/certificates` - Issue certificate (CertificateIssuance)
- `PUT /api/resources/:id/void` - Void a resource issuance

### Category API

- `GET /api/categories` - Get all categories
- `GET /api/events/:eventId/categories` - Get categories for event
- `GET /api/categories/:id` - Get category details
- `POST /api/categories` - Create new category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category
- `PUT /api/categories/:id/resources` - Update category resource permissions

### Abstract API

- `GET /api/abstracts` - Get all abstracts (AbstractList)
- `GET /api/events/:eventId/abstracts` - Get event-specific abstracts (AbstractList)
- `GET /api/abstracts/:id` - Get abstract details (AbstractDetail)
- `POST /api/abstracts` - Create abstract (AbstractForm)
- `PUT /api/abstracts/:id` - Update abstract (AbstractForm)
- `PUT /api/abstracts/:id/review` - Submit review (AbstractDetail)
- `GET /api/events/:eventId/abstracts/download` - Download all abstracts (AbstractList)

### Badge API

- `GET /api/events/:eventId/badges/templates` - Get badge templates (BadgeDesigner, BadgePrintingPage)
- `GET /api/events/:eventId/badges/templates/:id` - Get specific badge template
- `POST /api/events/:eventId/badges/templates` - Create badge template (BadgeDesigner)
- `PUT /api/events/:eventId/badges/templates/:id` - Update badge template (BadgeDesigner)
- `DELETE /api/events/:eventId/badges/templates/:id` - Delete badge template
- `POST /api/events/:eventId/badges/generate` - Generate badges for printing (BadgePrintingPage)
- `POST /api/events/:eventId/badges/preview` - Preview badge for a registration (BadgeDesigner)

### Report API

- `GET /api/reports` - Get all available reports (ReportsPage)
- `GET /api/events/:eventId/reports` - Get reports for event (ReportsPage)
- `POST /api/events/:eventId/reports/generate` - Generate custom report (ReportBuilder)
- `GET /api/events/:eventId/reports/templates` - Get report templates (ReportsPage)
- `POST /api/events/:eventId/reports/templates` - Create report template (ReportBuilder)
- `PUT /api/events/:eventId/reports/templates/:id` - Update report template (ReportBuilder)

### User Management API

- `GET /api/users` - Get all users (UserManagement)
- `POST /api/users` - Create new user (UserManagement)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user (UserManagement)
- `DELETE /api/users/:id` - Delete user (UserManagement)
- `GET /api/roles` - Get all roles (UserManagement)
- `POST /api/roles` - Create new role (UserManagement)
- `PUT /api/roles/:id` - Update role (UserManagement)
- `DELETE /api/roles/:id` - Delete role (UserManagement)

### Email Template API

- `GET /api/email-templates` - Get all email templates (EmailTemplates)
- `GET /api/events/:eventId/email-templates` - Get email templates for event (EmailTemplates)
- `POST /api/events/:eventId/email-templates` - Create email template (EmailTemplates)
- `PUT /api/events/:eventId/email-templates/:id` - Update email template (EmailTemplates)
- `DELETE /api/events/:eventId/email-templates/:id` - Delete email template (EmailTemplates)
- `POST /api/events/:eventId/email-templates/:id/test` - Send test email using template (EmailTemplates)

### Scanner API

- `POST /api/scan/validate` - Validate a QR code scan (ScannerStation)
- `POST /api/scan/checkin` - Check in an attendee via QR scan (ScannerStation)
- `GET /api/events/:eventId/scan/recent` - Get recent scans for event (ScannerStation)

### Authentication API

- `POST /api/auth/login` - User login (LoginPage)
- `POST /api/auth/register` - User registration (RegisterPage)
- `POST /api/auth/forgot-password` - Request password reset (ForgotPasswordPage)
- `POST /api/auth/reset-password` - Reset password

## Environment Variables

### Environment Variable Usage

In Vite applications, environment variables must be accessed using `import.meta.env` instead of `process.env`:

```javascript
// Incorrect usage (found in current code)
const API_URL = process.env.API_URL || 'http://localhost:5000/api';

// Correct usage for Vite applications
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
```

### Environment Variable Fixes Needed

The following services need to be updated to use `import.meta.env` instead of `process.env`:

- `abstractService.js` (line 5)
- `categoryService.js` (line 12)
- `registrationService.js` (line 8)
- `resourceService.js` (line 7)

All environment variables in the frontend must be prefixed with `VITE_` to be accessible in the client code.

### Required Environment Variables

Frontend environment variables should be defined in a `.env` file at the project root:

```
VITE_API_URL=http://localhost:5000/api
VITE_APP_TITLE=Onsite Atlas
```

## API Error Handling

To ensure consistent error handling across the application, all service methods should follow this pattern:

```javascript
const functionName = async (params) => {
  try {
    const response = await apiService.get('/endpoint', { params });
    return response.data;
  } catch (error) {
    // Standard error handling
    if (error.response) {
      // The server responded with an error status code
      return {
        success: false,
        message: error.response.data.message || 'Server error',
        errors: error.response.data.errors
      };
    } else if (error.request) {
      // The request was made but no response was received
      return {
        success: false,
        message: 'No response from server. Please check your connection.'
      };
    } else {
      // Error in setting up the request
      return {
        success: false,
        message: error.message || 'Unknown error occurred'
      };
    }
  }
};
```

## Identified Issues

### 1. Missing/Incomplete Components

- **ResourceConfiguration.jsx**: Implementation is incomplete, causing import errors. Needs to be completed with proper form fields and API integration.
- **CertificateIssuance.jsx**: Component needs completion and proper API integration. Currently has basic UI but lacks functionality.
- **SettingsPage.jsx**: Component is mostly a shell with minimal functionality.
- **UserManagement.jsx**: Uses mock data instead of real API integration.
- **GlobalSettings.jsx**: Basic implementation with mock data, needs proper API endpoints.
- **EmailTemplates.jsx**: Email template editor needs polishing and proper API integration.
- **PaymentGateways.jsx**: Payment gateway configuration is incomplete.

### 2. API Integration Issues

- **Environment Variable References**: Several service files use `process.env` which is not available in Vite applications (should be `import.meta.env`):
  - `abstractService.js` (line 5)
  - `categoryService.js` (line 12)
  - `registrationService.js` (line 8)
  - `resourceService.js` (line 7)

- **Inconsistent Error Handling**: Different services handle errors differently:
  - `eventService.js` returns `{ success: false, message: error.message }`
  - `registrationService.js` throws errors directly
  - `abstractService.js` returns `{ error: error.message }`
  - Need to standardize error response format

- **Missing API Endpoints**: Several components expect endpoints that aren't implemented:
  - Badge template save and load endpoints
  - Report generation endpoints
  - User management endpoints
  - Email template endpoints

- **Mock Data Toggle**: `eventService.js` has a DEV_MODE toggle that isn't consistently used across other services

### 3. UI/UX Issues

- **Loading States**: 
  - EventPortal doesn't show loading indicators for all sections
  - ResourceList has no loading state for refresh
  - AbstractDetail has loading state but no visual indicator

- **Error Displays**: 
  - RegistrationForm doesn't show field-specific errors
  - EventSettings swallows API errors
  - KitBagDistribution error states are incomplete

- **Form Validation**: 
  - AbstractForm validation is inconsistent with other forms
  - RegistrationForm has some validation but misses complex validations
  - EventForm lacks required field validation
  - CategoryForm has minimal validation

- **Mobile Responsiveness**:
  - BadgeDesigner doesn't scale properly on mobile
  - EventPortal tabs overflow on smaller screens
  - Table-based views need proper responsive design

### 4. Navigation Problems

- **Tab Navigation**: 
  - EventPortal tab persistence doesn't always work
  - EventSettings tabs reset on certain operations
  - Abstract tabs don't retain state when navigating back

- **URL Parameter Handling**: 
  - Inconsistent approach to URL parameters
  - EventList filters don't persist in URL
  - Registration filters sometimes get lost on refresh
  - AbstractList pagination isn't reflected in URL

- **Deep Linking Issues**:
  - Direct links to specific tabs don't work consistently
  - Some routes require context that isn't loaded when directly accessed

### 5. Mock Data Dependencies

Several components still using mock data instead of real API calls:
- **Dashboard.jsx**: Using mock statistics and events
- **Timeline.jsx**: Using hardcoded timeline data
- **ReportBuilder.jsx**: All data is mocked
- **ReportsPage.jsx**: Report templates and data are mocked
- **CategoryList.jsx**: Using mockCategories
- **CategoryDetail.jsx**: Using mockCategory and mockPermissions
- **CategoryForm.jsx**: Using mockEvents for dropdown
- **CategoryResources.jsx**: Using mockResourceTypes
- **BadgeDesigner.jsx**: Using mock templates and preview data
- **BadgePrintingPage.jsx**: Using mock templates and registration data
- **UserManagement.jsx**: Using mockUsers and mockRoles
- **GlobalSettings.jsx**: Using mockSettings

### 6. Authentication System

- **Token Management**: 
  - Token storage mechanism uses localStorage which has security implications
  - No token refresh mechanism implemented
  - Expired tokens aren't properly handled

- **Authorization Controls**:
  - Role-based access control is incomplete
  - Protected routes don't properly check permissions
  - No route guards for admin-only pages

- **Registration System**:
  - RegisterPage.jsx is incomplete
  - No email verification process

### 7. Data Handling Issues

- **Event Statistics Endpoint Failures**:
  - The event statistics endpoint (`/api/events/:id/statistics`) fails with 500 errors
  - Backend issue: Resource model was missing or improperly referenced
  - Frontend doesn't gracefully handle this failure
  
- **Inconsistent Data Structures**:
  - Event data structure varies between endpoints
  - Registration data isn't consistently formatted
  - Resource tracking data has inconsistent nesting

- **Error States**:
  - Many components don't handle API error states properly
  - Empty states are often not designed or implemented

### 8. QR Scanner Integration

- **ScannerStation Issues**:
  - Import problems with QR scanner library
  - Camera selection doesn't persist
  - Error handling for camera access is incomplete

- **Permission Issues**:
  - Camera permission requests aren't properly handled
  - No fallback for when permissions are denied

### 9. Performance Problems

- **Large Component Renders**:
  - EventPortal renders too much at once
  - BadgeDesigner has performance issues with large templates
  - RegistrationList doesn't virtualize long lists

- **Data Fetching**:
  - Multiple redundant API calls in some components
  - No caching strategy for frequently accessed data
  - No pagination for large datasets in some views

### 10. Code Quality Issues

- **Console Logs**:
  - Excessive console.log statements throughout codebase
  - Debug code left in production components

- **Component Structure**:
  - Some components are too large (EventPortal is 1133 lines)
  - Logic and UI concerns aren't properly separated
  - Inconsistent use of hooks across components

- **Prop Validation**:
  - Missing prop validation in many components
  - Insufficient type checking 