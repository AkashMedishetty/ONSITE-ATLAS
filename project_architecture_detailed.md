# ONSITE ATLAS - Detailed Architecture Documentation

## Table of Contents
1. [Project Structure](#project-structure)
2. [Core Components and Features](#core-components-and-features)
3. [Frontend Functions and Routes](#frontend-functions-and-routes)
4. [Backend Routes and APIs](#backend-routes-and-apis)
5. [Database Models](#database-models)
6. [Workflow Processes](#workflow-processes)
    - [Event Creation and Management](#event-creation-and-management-workflow)
    - [Registration Process](#registration-process-workflow)
    - [Resource Tracking](#resource-tracking-workflow)
    - [Abstract Submission](#abstract-submission-workflow)
    - [Scanner Station Operations](#scanner-station-operations-workflow)
7. [Authentication and Security](#authentication-and-security)
8. [Deployment and Infrastructure](#deployment-and-infrastructure)
9. [Project Status and Roadmap](#project-status-and-roadmap)

## Project Structure

```
/
├── client/                # Frontend React application
│   ├── src/
│   │   ├── assets/        # Static assets (images, fonts)
│   │   │   └── react.svg
│   │   │
│   │   ├── components/    # Reusable UI components
│   │   │   ├── badges/    # Badge-related components
│   │   │   │   ├── BadgeElementRenderer.jsx
│   │   │   │   ├── BadgeTemplate.jsx
│   │   │   │   └── BadgeTemplateList.jsx
│   │   │   │
│   │   │   ├── common/    # Shared UI components
│   │   │   │   ├── Alert.jsx
│   │   │   │   ├── Badge.jsx
│   │   │   │   ├── BadgeTemplate.jsx
│   │   │   │   ├── Button.jsx
│   │   │   │   ├── Card.jsx
│   │   │   │   ├── Checkbox.jsx
│   │   │   │   ├── ConfirmModal.jsx
│   │   │   │   ├── GlobalSearch.jsx
│   │   │   │   ├── index.js
│   │   │   │   ├── Input.jsx
│   │   │   │   ├── Loading.jsx
│   │   │   │   ├── Modal.jsx
│   │   │   │   ├── Pagination.jsx
│   │   │   │   ├── QRCodeGenerator.jsx
│   │   │   │   ├── QrScanner.jsx
│   │   │   │   ├── SafeCard.jsx
│   │   │   │   ├── Select.jsx
│   │   │   │   ├── Spinner.jsx
│   │   │   │   ├── Switch.jsx
│   │   │   │   ├── Tabs.jsx
│   │   │   │   ├── Textarea.jsx
│   │   │   │   └── Tooltip.jsx
│   │   │   │
│   │   │   ├── layout/    # Layout components
│   │   │   │   ├── DashboardLayout.jsx
│   │   │   │   └── MainLayout.jsx
│   │   │   │
│   │   │   └── QrScanner.jsx
│   │   │
│   │   ├── contexts/      # React context providers
│   │   │   └── (empty directory)
│   │   │
│   │   ├── layouts/       # Page layout components
│   │   │   ├── AuthLayout.jsx
│   │   │   ├── DashboardLayout.jsx
│   │   │   └── MainLayout.jsx
│   │   │
│   │   ├── pages/         # Page components
│   │   │   ├── Abstracts/   # Abstract management pages
│   │   │   │   ├── AbstractDetail.jsx
│   │   │   │   ├── AbstractForm.jsx
│   │   │   │   ├── AbstractList.jsx
│   │   │   │   ├── AbstractSubmissionForm.jsx
│   │   │   │   └── index.js
│   │   │   │
│   │   │   ├── Auth/        # Authentication pages
│   │   │   │   ├── ForgotPasswordPage.jsx
│   │   │   │   ├── LoginPage.jsx
│   │   │   │   └── RegisterPage.jsx
│   │   │   │
│   │   │   ├── BadgePrinting/ # Badge printing pages
│   │   │   │   ├── BadgeDesigner.css
│   │   │   │   ├── BadgeDesigner.jsx
│   │   │   │   ├── BadgeDesignerPart2.jsx
│   │   │   │   ├── BadgePrintingPage.jsx
│   │   │   │   └── index.js
│   │   │   │
│   │   │   ├── Categories/  # Category management pages
│   │   │   │   ├── CategoryDetail.jsx
│   │   │   │   ├── CategoryForm.jsx
│   │   │   │   ├── CategoryList.jsx
│   │   │   │   ├── CategoryResources.jsx
│   │   │   │   └── index.js
│   │   │   │
│   │   │   ├── Events/      # Event management pages
│   │   │   │   ├── EventForm.jsx
│   │   │   │   ├── EventList.jsx
│   │   │   │   ├── EventPortal.jsx
│   │   │   │   ├── EventSettings.jsx
│   │   │   │   ├── index.js
│   │   │   │   │
│   │   │   │   ├── Registration/  # Event registration subdirectory
│   │   │   │   │   └── (empty directory)
│   │   │   │   │
│   │   │   │   ├── abstracts/  # Event abstracts subdirectory
│   │   │   │   │   └── AbstractsTab.jsx
│   │   │   │   │
│   │   │   │   ├── categories/  # Event categories subdirectory
│   │   │   │   │   ├── CategoriesTab.jsx
│   │   │   │   │   ├── CategoryResourcesConfig.jsx
│   │   │   │   │   └── backup/
│   │   │   │   │       └── CategoriesTab.jsx.bak
│   │   │   │   │
│   │   │   │   ├── dashboard/  # Event dashboard subdirectory
│   │   │   │   │   └── (empty directory)
│   │   │   │   │
│   │   │   │   ├── registrations/  # Event registrations subdirectory
│   │   │   │   │   ├── RegistrationDetail.jsx
│   │   │   │   │   ├── RegistrationEdit.jsx
│   │   │   │   │   └── RegistrationsTab.jsx
│   │   │   │   │
│   │   │   │   ├── resources/  # Event resources subdirectory
│   │   │   │   │   └── ResourcesTab.jsx
│   │   │   │   │
│   │   │   │   ├── settings/  # Event settings subdirectory
│   │   │   │   │   ├── AbstractsTab.jsx
│   │   │   │   │   ├── BadgesTab.jsx
│   │   │   │   │   ├── CategoriesTab.jsx
│   │   │   │   │   ├── EmailTab.jsx
│   │   │   │   │   ├── GeneralTab.jsx
│   │   │   │   │   ├── PaymentTab.jsx
│   │   │   │   │   ├── README.md
│   │   │   │   │   ├── RegistrationTab.jsx
│   │   │   │   │   ├── ResourcesTab.jsx
│   │   │   │   │   ├── SettingsTab.jsx
│   │   │   │   │   ├── TestTab.jsx
│   │   │   │   │   └── index.js
│   │   │   │   │
│   │   │   │   └── tabs/  # Event tabs subdirectory
│   │   │   │       └── EmailsTab.jsx
│   │   │   │
│   │   │   ├── PublicPortals/ # Public-facing portals
│   │   │   │   ├── AbstractPortal.jsx
│   │   │   │   └── RegistrationPortal.jsx
│   │   │   │
│   │   │   ├── Registration/ # Registration management pages
│   │   │   │   ├── BulkImport.jsx
│   │   │   │   ├── RegistrationForm.jsx
│   │   │   │   ├── RegistrationList.jsx
│   │   │   │   └── index.js
│   │   │   │
│   │   │   ├── Registrations/ # Registration list pages
│   │   │   │   └── BulkImportWizard.jsx
│   │   │   │
│   │   │   ├── Reports/     # Reporting pages
│   │   │   │   ├── ReportBuilder.jsx
│   │   │   │   ├── ReportsPage.jsx
│   │   │   │   └── index.js
│   │   │   │
│   │   │   ├── Resources/   # Resource management pages
│   │   │   │   ├── CertificateIssuance.jsx
│   │   │   │   ├── CertificatePrinting.jsx
│   │   │   │   ├── CertificatePrintingScanner.jsx
│   │   │   │   ├── FoodTracking.jsx
│   │   │   │   ├── KitBagDistribution.jsx
│   │   │   │   ├── ResourceConfiguration.jsx
│   │   │   │   ├── ResourceList.jsx
│   │   │   │   ├── ScannerStation.jsx
│   │   │   │   └── index.js
│   │   │   │
│   │   │   ├── Settings/    # System settings pages
│   │   │   │   ├── EmailTemplates.jsx
│   │   │   │   ├── GlobalSettings.jsx
│   │   │   │   ├── PaymentGateways.jsx
│   │   │   │   ├── SettingsPage.jsx
│   │   │   │   └── UserManagement.jsx
│   │   │   │
│   │   │   ├── dashboard/   # Dashboard components
│   │   │   │   └── DashboardTab.jsx
│   │   │   │
│   │   │   ├── event/       # Event-specific pages
│   │   │   │   ├── RegistrationDetail.css
│   │   │   │   ├── RegistrationDetail.js
│   │   │   │   └── tabs/
│   │   │   │       └── RegistrationsTab.js
│   │   │   │
│   │   │   ├── Dashboard.jsx
│   │   │   ├── FoodTracking.jsx
│   │   │   └── Timeline.jsx
│   │   │
│   │   ├── routes/        # Route definitions
│   │   │   └── (empty directory)
│   │   │
│   │   ├── services/      # API service functions
│   │   │   ├── abstractService.js
│   │   │   ├── api.js
│   │   │   ├── apiService.js
│   │   │   ├── authService.js
│   │   │   ├── badgeTemplateService.js
│   │   │   ├── categoryService.js
│   │   │   ├── certificateService.js
│   │   │   ├── emailService.js
│   │   │   ├── eventService.js
│   │   │   ├── foodService.js
│   │   │   ├── index.js
│   │   │   ├── kitService.js
│   │   │   ├── printService.js
│   │   │   ├── registrationService.js
│   │   │   ├── resourceService.js
│   │   │   └── utils.js
│   │   │
│   │   ├── utils/         # Utility functions
│   │   │   ├── dateUtils.js
│   │   │   ├── mockDataGenerator.js
│   │   │   └── responseHandler.js
│   │   │
│   │   ├── App.css
│   │   ├── App.js
│   │   ├── App.jsx
│   │   ├── api-error-tracking.md
│   │   ├── index.css
│   │   ├── main.jsx
│   │   └── tracking-mock-data-removal.md
│   │
│   ├── public/            # Static public files
│   │   └── vite.svg
│   │
│   ├── .env
│   ├── .env.production
│   ├── .gitignore
│   ├── README.md
│   ├── eslint.config.js
│   ├── index.html
│   ├── package-lock.json
│   ├── package.json
│   ├── postcss.config.cjs
│   ├── tailwind.config.cjs
│   └── vite.config.js
│
├── server/                # Backend Node.js application
│   ├── src/
│   │   ├── config/        # Configuration files
│   │   │   └── database.js
│   │   │
│   │   ├── controllers/   # Route controllers
│   │   │   ├── abstract.controller.js
│   │   │   ├── auth.controller.js
│   │   │   ├── badgeTemplate.controller.js
│   │   │   ├── category.controller.js
│   │   │   ├── email.controller.js
│   │   │   ├── event.controller.js
│   │   │   ├── registration.controller.js
│   │   │   ├── registrationResource.controller.js
│   │   │   ├── resource.controller.js
│   │   │   └── timeline.controller.js
│   │   │
│   │   ├── docs/          # API documentation
│   │   │   └── database-schema.md
│   │   │
│   │   ├── middleware/    # Express middleware
│   │   │   ├── async.js
│   │   │   ├── auth.js
│   │   │   ├── auth.middleware.js
│   │   │   ├── errorHandler.js
│   │   │   ├── requestLogger.js
│   │   │   ├── response.middleware.js
│   │   │   ├── validate.js
│   │   │   ├── validation.middleware.js
│   │   │   └── validator.js
│   │   │
│   │   ├── models/        # MongoDB models
│   │   │   ├── Abstract.js
│   │   │   ├── BadgeTemplate.js
│   │   │   ├── Category.js
│   │   │   ├── Certificate.js
│   │   │   ├── Event.js
│   │   │   ├── Registration.js
│   │   │   ├── Resource.js
│   │   │   ├── ResourceSetting.js
│   │   │   ├── User.js
│   │   │   └── index.js
│   │   │
│   │   ├── routes/        # API route definitions
│   │   │   ├── abstracts.routes.js
│   │   │   ├── auth.routes.js
│   │   │   ├── badgeTemplate.routes.js
│   │   │   ├── categories.routes.js
│   │   │   ├── debug.routes.js
│   │   │   ├── email.routes.js
│   │   │   ├── event.routes.js
│   │   │   ├── events.routes.js
│   │   │   ├── index.js
│   │   │   ├── registration.routes.js
│   │   │   ├── registrationResource.routes.js
│   │   │   ├── registrations.routes.js
│   │   │   ├── resources.routes.js
│   │   │   └── timeline.routes.js
│   │   │
│   │   ├── services/      # Business logic services
│   │   │   └── emailService.js
│   │   │
│   │   ├── utils/         # Utility functions
│   │   │   ├── ApiError.js
│   │   │   ├── errorResponse.js
│   │   │   ├── excelHelper.js
│   │   │   ├── idGenerator.js
│   │   │   ├── inMemoryDb.js
│   │   │   ├── logger.js
│   │   │   ├── qrGenerator.js
│   │   │   ├── responseFormatter.js
│   │   │   └── seedData.js
│   │   │
│   │   ├── validation/    # Input validation
│   │   │   ├── abstract.schemas.js
│   │   │   └── custom.validations.js
│   │   │
│   │   └── index.js       # Main server entry point
│   │
│   ├── uploads/           # File uploads storage
│   ├── .env
│   ├── README.md
│   ├── fix-auth.js
│   ├── package-lock.json
│   └── package.json
│
├── docs/                  # Project documentation
│   ├── alignment-fixes-summary.md
│   ├── api-standards.json
│   ├── api-standards.md
│   ├── backend-documentation.md
│   ├── frontend-documentation.md
│   └── model-fixes.js
│
├── SCHEMA/                # Database schema definitions
│   ├── test.categories.json
│   ├── test.events.json
│   ├── test.registrations.json
│   ├── test.resources.json
│   └── test.resourcesettings.json
│
├── UI REFERNCE PHOTOS/    # UI reference materials
│
├── project_docs/          # Additional project documentation
│   ├── abstract_system_summary.md
│   ├── project.md
│   ├── schema.md
│   └── timeline.md
│
├── ISSUES.md
├── README.md
├── SETUP-INSTRUCTIONS.md
├── handover.md
├── package-lock.json
├── package.json
└── reference.md
```

## Core Components and Features

### Project Overview
ONSITE ATLAS is a comprehensive conference management system designed to streamline onsite registration processes and efficiently track attendees throughout events. The platform handles the entire lifecycle of events, from creation and configuration through registration to resource distribution tracking (food, kit bags, certificates) and abstract submission management.

### Key System Components

#### 1. Event Management System
- **Event Creation and Configuration**: Create and configure events with custom settings, dates, venues, and branding.
- **Event Dashboard**: Real-time analytics dashboard showing registrations, resource usage, and key metrics.
- **Event Portal**: Centralized hub for managing all aspects of an individual event.
- **Event Settings**: Configure registration forms, badge templates, abstract submission settings, and resource definitions.

#### 2. Category Management System
- **Category Definition**: Create and manage attendee categories (VIP, Speaker, Attendee, etc.).
- **Permission Management**: Assign permissions for resources (meals, kit bags, certificates) to specific categories.
- **Visual Differentiation**: Define colors and badge templates for visual differentiation between categories.

#### 3. Registration System
- **Custom Registration Forms**: Configure event-specific registration forms with dynamic fields.
- **Registration ID Generation**: Automatic generation of custom registration IDs with configurable prefixes.
- **QR Code Integration**: Generate QR codes for attendee identification and resource validation.
- **Bulk Import/Export**: Import registrations from Excel files and export registration data.
- **Check-in Management**: Track attendee check-ins and status.

#### 4. Badge System
- **Badge Designer**: Visual editor for creating custom badge templates.
- **Badge Printing**: Print physical badges individually or in batches.
- **Badge Templates**: Manage multiple badge designs for different categories.
- **QR Code Placement**: Configure QR code position and size on badges.

#### 5. Resource Tracking System
- **Food Tracking**: Configure meals per day, track consumption, and validate attendee access.
- **Kit Bag Distribution**: Manage kit item inventory, track distribution, and validate entitlements.
- **Certificate Management**: Issue different certificate types, track distribution, and generate digital versions.
- **Scanner Stations**: Dedicated interfaces for scanning QR codes at resource distribution points.
- **Resource Usage Reports**: Track resource distribution statistics and identify exceptions.

#### 6. Abstract Submission System
- **Submission Portal**: Public portal for abstract submission with authentication.
- **Abstract Management**: Review, approve, or reject abstracts with detailed workflow.
- **Abstract Editor**: Rich text editor for abstract content with word counting.
- **Bulk Download**: Download all abstracts in various formats with custom naming conventions.

#### 7. Reporting and Analytics
- **Registration Analytics**: Track registration trends, demographics, and categories.
- **Resource Utilization Reports**: Monitor consumption patterns and inventory levels.
- **Custom Report Builder**: Build custom reports with selected metrics and filters.
- **Export Capabilities**: Export reports in various formats (Excel, PDF, CSV).

#### 8. User Management and Authentication
- **Role-based Access Control**: Different access levels for admins, managers, and staff.
- **User Management**: Create and manage user accounts with specific permissions.
- **Authentication Flow**: Secure login, password reset, and session management.

#### 9. Global Search
- **Universal Search**: Search across all entities (registrations, abstracts, events).
- **Quick Actions**: Perform common actions directly from search results.
- **Filtering and Sorting**: Refine search results with advanced filters.

## Frontend Functions and Routes

### Frontend Route Structure

The frontend uses React Router for navigation with the following route structure:

```
/ - Dashboard
    - Main application dashboard with overview statistics and quick navigation
    - Shows events count, recent registrations, and system status

/login - Login Page
    - User authentication with email/password
    - "Remember me" functionality 
    - Password reset link

/register - Registration Page
    - New user registration form
    - Role selection (pending admin approval)
    - Terms and conditions acceptance

/forgot-password - Reset Password Page
    - Email submission for password reset
    - Reset link generation and email delivery

/events - Event List
    - Tabular view of all events with filtering and sorting
    - Quick stats showing event status, registration counts
    - Actions: create, edit, view, archive

/events/new - New Event Form
    - Multi-step form for creating a new event
    - Sections: basic info, venue, registration settings, resource configuration

/events/:id/edit - Edit Event Form
    - Edit existing event details
    - Same structure as creation form with pre-populated data

/events/:id/settings - Event Settings
    - Tab-based settings interface for event configuration
    - Tabs: General, Registration, Categories, Badges, Abstracts, Resources, Emails, Payment

/categories - Category List
    - List of all attendee categories across events
    - Filter by event, search by name
    - Create, edit, delete actions

/categories/new - New Category Form
    - Form to create new attendee category
    - Fields: name, description, color, permissions

/categories/:id/edit - Edit Category Form
    - Edit existing category details
    - Same fields as creation form

/categories/:id/resources - Resource Management for Category
    - Configure which resources are available for this category
    - Matrix UI for meal, kit, certificate permissions

/registrations - Global Registration List
    - Cross-event view of all registrations
    - Advanced filtering, searching, and bulk actions
    - Quick badge printing and check-in actions

/registrations/new - New Registration Form
    - Create new registration with event selection
    - Dynamic form based on event's registration settings
    - Category selection and custom fields

/registrations/:id/edit - Edit Registration Form
    - Edit existing registration details
    - Same structure as creation form with pre-populated data

/registrations/import - Bulk Import
    - Upload Excel file for bulk registration import
    - Template download, validation, and import confirmation

/resources - Global Resource List
    - Overview of all resource types across events
    - Usage statistics and inventory status
    - Quick access to scanner interfaces

/resources/scanner - Scanner Station
    - Main scanner interface selection page
    - Choose resource type and scanning method

/resources/configuration - Resource Configuration
    - Global resource settings configuration
    - Default templates and scanner behaviors

/abstracts - Global Abstract List
    - Cross-event view of all abstract submissions
    - Filter by event, status, author
    - Bulk download and status change actions

/abstracts/:id - Abstract Detail
    - Detailed view of single abstract submission
    - Review interface with status changing and comments
    - Author information and submission metadata

/abstracts/new - New Abstract Form
    - Submit new abstract directly through admin interface
    - Rich text editor with word counting
    - Author and affiliation management

/events/:id - Event Portal
    - Central dashboard for specific event management
    - Registration statistics, resource usage charts
    - Quick access to all event-specific functions
    - Tabs for different management areas

/events/:eventId/registrations - Event-specific Registration List
    - List of registrations for specific event only
    - Category filtering, search by name/email/ID
    - Check-in functionality and badge printing

/events/:eventId/registrations/new - New Registration (Event-specific)
    - Create registration for this specific event
    - Pre-selected event with dynamic form fields
    - Immediate badge printing option

/events/:eventId/registrations/:registrationId - Registration Detail
    - Detailed view of specific registration
    - Resource usage history
    - Status management and notes
    - Actions: edit, delete, check-in, print badge

/events/:eventId/registrations/:registrationId/edit - Edit Registration
    - Edit registration for specific event
    - Update contact information, category, custom fields

/events/:eventId/registrations/import - Import Registrations
    - Event-specific bulk import interface
    - Pre-configured for this event's registration fields

/events/:eventId/registrations/bulk-import - Bulk Import Wizard
    - Step-by-step wizard for larger imports
    - Field mapping, validation, and error resolution

/events/:eventId/registrations/badges - Badge Printing
    - Batch badge printing interface for event
    - Filter registrations to print
    - Print queue management

/events/:eventId/registrations/badge-designer - Badge Template Designer
    - Visual editor to design badge templates
    - Drag-and-drop field placement
    - Preview with sample data

/events/:eventId/abstracts - Event-specific Abstract List
    - List of abstracts for specific event
    - Status filtering and management
    - Bulk actions for review processing

/events/:eventId/abstracts/new - New Abstract (Event-specific)
    - Submit abstract for specific event
    - Pre-configured with event abstract settings

/events/:eventId/abstracts/:id - Abstract Detail
    - Event-specific abstract detail view
    - Review interface and status management

/events/:eventId/abstracts/:id/edit - Edit Abstract
    - Edit abstract submission for specific event
    - Update content, authors, keywords

/events/:eventId/resources - Event-specific Resource List
    - Overview of resource usage for this event
    - Usage statistics and distribution patterns

/events/:eventId/resources/scanner - Scanner Station
    - Event-specific scanner interface selection
    - Pre-configured for this event's resources

/events/:eventId/resources/scanner/:resourceType - Resource Type Scanner
    - Dedicated scanner interface for specific resource type
    - Real-time validation and feedback
    - Auto-submission mode

/events/:eventId/resources/food - Food Tracking
    - Meal selection interface
    - QR scanning for food distribution
    - Real-time validation and usage tracking

/events/:eventId/resources/kitbag - Kit Bag Distribution
    - Kit item selection interface
    - QR scanning for kit distribution
    - Inventory tracking and validation

/events/:eventId/resources/certificate - Certificate Issuance
    - Certificate type selection
    - QR scanning for certificate issuance
    - Print or digital delivery options

/events/:eventId/resources/certificate-printing - Certificate Printing
    - Batch certificate printing interface
    - Template selection and customization
    - Print queue management

/events/:eventId/resources/configuration - Resource Configuration
    - Event-specific resource settings
    - Configure meals, kit items, certificate types
    - Category permission assignment

/portal/register/:eventId - Public Registration Portal
    - Public-facing registration form
    - Mobile-responsive design
    - Payment integration (if enabled)
    - Confirmation page with QR code

/portal/abstract/:eventId - Public Abstract Submission Portal
    - Public-facing abstract submission interface
    - Registration ID authentication
    - Rich text editor with guidelines
    - Draft saving and submission confirmation
    
/events/:eventId/landing-pages - Landing Page Manager
    - List of landing pages for an event
    - Create, edit, preview, and publish landing pages
    - Clone and customize existing landing pages

/events/:eventId/landing-pages/new - New Landing Page
    - Create a new landing page from scratch or template
    - Configure SEO settings and page structure

/events/:eventId/landing-pages/:id/edit - Landing Page Editor
    - Drag-and-drop editor for landing page design
    - Component library for adding page elements
    - Inline editing of text and media content

/events/:eventId/landing-pages/:id/preview - Landing Page Preview
    - Preview landing page as it will appear to users
    - Test different device views (desktop, tablet, mobile)
    - Verify links and functionality

/events/:eventId/workshops - Workshop Manager
    - List of workshops for an event
    - Create, edit, and manage workshop details
    - Track registration and capacity

/events/:eventId/workshops/new - New Workshop
    - Create a new workshop with details
    - Configure pricing, capacity, and category restrictions

/events/:eventId/workshops/:id - Workshop Details
    - View workshop details and attendee list
    - Check-in attendees and manage attendance
    - Export attendee information

/events/:eventId/pricing - Pricing Manager
    - Configure pricing tiers (early bird, normal, onsite)
    - Set category-specific pricing
    - Manage discount codes

/events/:slug/landing - Public Landing Page
    - Public view of a published landing page
    - Registration forms and payment processing
    - Event information and branding

/go/:shortCode - Short URL Redirect
    - Short URL redirection for event landing pages
    - Tracking and analytics for link usage

/registrations/payment/:id - Payment Portal
    - Secure payment processing interface
    - Multiple payment gateway options
    - Order summary and receipt generation

/settings/payment-gateways - Payment Gateway Settings
    - Configure payment gateway integrations
    - Manage API keys and credentials
    - Set default payment options

## API Documentation

The system provides a comprehensive API for integrating with various components. Below are the key API endpoints by feature:

### Landing Page Builder API

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

### Payment Gateway API

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

*No authentication required, but validation is performed based on the event and other factors
**Public access with a token or authenticated access for admins

### Advanced Pricing System API

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

### Workshop Management API

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------------|
| GET | `/api/events/:eventId/workshops` | List workshops | No |
| POST | `/api/events/:eventId/workshops` | Create workshop | Yes |
| GET | `/api/events/:eventId/workshops/:id` | Get workshop by ID | No |
| PUT | `/api/events/:eventId/workshops/:id` | Update workshop | Yes |
| DELETE | `/api/events/:eventId/workshops/:id` | Delete workshop | Yes |
| GET | `/api/events/:eventId/workshops/:id/availability` | Get availability | No |
| POST | `/api/events/:eventId/workshops/:id/register` | Register for workshop | No* |
| GET | `/api/events/:eventId/workshops/:id/attendees` | Get attendees | Yes |
| POST | `/api/events/:eventId/workshops/:id/check-in/:registrationId` | Check in | Yes |
| GET | `/api/events/:eventId/workshops/:id/export-attendees` | Export attendees | Yes |
| GET | `/api/events/:eventId/workshops/reports` | Get reports | Yes |

*No authentication required, but validation is performed based on the event and other factors

### Data Models

#### Landing Page Model
```javascript
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

#### Payment Gateway Model
```javascript
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
```

#### Payment Model
```javascript
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
```

#### Invoice Template Model
```javascript
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

#### PricingTier Model
```javascript
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
```

#### CategoryPrice Model
```javascript
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
```

#### Workshop Model
```javascript
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
```






### Frontend Service Functions
#### Event Service (eventService.js)
| Function | Description | Parameters | Return Value |
|----------|-------------|------------|--------------|
| createEvent | Create new event | eventData | Promise with created event |
| fetchEvents / getEvents | Get list of events | filters, pagination | Promise with events array |
| getEventById | Get specific event | eventId | Promise with event object |
| updateEvent | Update event details | eventId, eventData | Promise with updated event |
| deleteEvent | Delete/archive event | eventId | Promise with status |
| getEventDashboard | Get dashboard statistics | eventId | Promise with dashboard data |
| getEventStatistics | Get event analytics | eventId, period | Promise with statistics |
| getEventPortalUrl | Get public portal URL | eventId | Promise with URL string |
| updateEventStatus | Change event status | eventId, status | Promise with updated event |
| duplicateEvent | Create copy of event | eventId, newEventData | Promise with new event |
| getEventSettings | Get event settings | eventId, settingType | Promise with settings |
| updateEventSettings | Update event settings | eventId, settingType, data | Promise with updated settings |
| getRegistrationSettings | Get registration form config | eventId | Promise with settings |
| updateRegistrationSettings | Update registration form | eventId, settings | Promise with updated settings |
| getAbstractSettings | Get abstract config | eventId | Promise with settings |
| updateAbstractSettings | Update abstract settings | eventId, settings | Promise with updated settings |
| getBadgeSettings | Get badge configuration | eventId | Promise with settings |
| updateBadgeSettings | Update badge settings | eventId, settings | Promise with updated settings |
| generateBadges | Generate badge templates | eventId, options | Promise with badge data |
#### Authentication Service (authService.js)
| Function | Description | Parameters | Return Value |
|----------|-------------|------------|--------------|
| login | Authenticate user with credentials | email, password | Promise with user data and token |
| register | Create new user account | userData | Promise with created user |
| logout | Remove user session | None | Void, removes localStorage |
| getCurrentUser | Get logged in user info | None | User object from localStorage |
| isAuthenticated | Check if user is authenticated | None | Boolean |
| refreshToken | Refresh authentication token | refreshToken | Promise with new token |
| requestPasswordReset | Request password reset email | email | Promise with status |
| resetPassword | Reset password with token | token, newPassword | Promise with status |
| changePassword | Change password for logged in user | oldPassword, newPassword | Promise with status |
| getUsers | Get all system users | filters | Promise with users array |
| getRoles | Get all available roles | None | Promise with roles array |
| createUser | Create new user by admin | userData | Promise with created user |
| updateUserStatus | Activate/deactivate user | userId, status | Promise with updated user |
| getUserById | Get specific user details | userId | Promise with user object |
| updateUser | Update user information | userId, userData | Promise with updated user |
| deleteUser | Delete user account | userId | Promise with status |
#### Registration Service (registrationService.js)
| Function | Description | Parameters | Return Value |
|----------|-------------|------------|--------------|
| getRegistrations | Get registrations list | eventId, filters, pagination | Promise with registrations array |
| getRegistration | Get single registration | eventId, registrationId | Promise with registration object |
| createRegistration | Create new registration | eventId, registrationData | Promise with created 
registration |
| updateRegistration | Update registration | eventId, registrationId, data | Promise with updated 
registration |
| deleteRegistration | Delete registration | eventId, registrationId | Promise with status |
| checkInRegistration | Check in attendee | eventId, registrationId | Promise with updated registration |
| checkOutRegistration | Check out attendee | eventId, registrationId | Promise with updated registration |
| bulkImportRegistrations | Import multiple registrations | eventId, fileData | Promise with import results |
| validateRegistrationImport | Validate import file | eventId, fileData | Promise with validation results |
| exportRegistrations | Export registrations | eventId, filters, format | Promise with export data |
| getRegistrationCounts | Get registration stats | eventId, filters | Promise with count statistics |
| printBadge | Generate and print badge | eventId, registrationId, options | Promise with print data |
| getRegistrationByQR | Lookup by QR code | qrCode | Promise with registration object |
| getRegistrationById | Lookup by ID | registrationId | Promise with registration object |
| searchRegistrations | Search across fields | eventId, query | Promise with search results |
| getBulkPrintQueue | Get badges for printing | eventId, registrationIds | Promise with print queue |
| getRegistrationResources | Get resources for registration | eventId, registrationId | Promise with 
resources |
| validateRegistrationAccess | Check resource access | registrationId, resourceType | Promise with validation 
result |#### Resource Service (resourceService.js)
| Function | Description | Parameters | Return Value |
|----------|-------------|------------|--------------|
| getResources | Get resources list | eventId, filters | Promise with resources array |
| getResourceById | Get specific resource | resourceId | Promise with resource object |
| createResource | Record resource usage | eventId, resourceData | Promise with created resource |
| updateResource | Update resource record | resourceId, data | Promise with updated resource |
| deleteResource | Delete resource record | resourceId | Promise with status |
| getFoodSettings | Get meal configuration | eventId | Promise with food settings |
| updateFoodSettings | Update meal settings | eventId, settings | Promise with updated settings |
| getKitSettings | Get kit bag config | eventId | Promise with kit settings |
| updateKitSettings | Update kit settings | eventId, settings | Promise with updated settings |
| getCertificateSettings | Get certificate config | eventId | Promise with certificate settings |
| updateCertificateSettings | Update certificate settings | eventId, settings | Promise with updated settings |
| scanResource | Record resource via scan | eventId, scanData | Promise with scan result |
| validateScan | Validate scan eligibility | eventId, registrationId, resourceType | Promise with validation |
| voidResource | Void a resource record | resourceId, reason | Promise with void result |
| getResourcesForRegistration | Get usage for attendee | eventId, registrationId | Promise with resources |
| getResourceStatistics | Get usage statistics | eventId, resourceType, period | Promise with statistics |
| generateCertificates | Create batch certificates | eventId, registrationIds, type | Promise with generated 
certificates |
| sendCertificatesByEmail | Email digital certificates | eventId, certificateIds | Promise with send results |
| printCertificates | Print physical certificates | eventId, certificateIds | Promise with print data |
| trackMeal | Record meal consumption | eventId, registrationId, mealData | Promise with meal tracking |
| trackKitItem | Record kit distribution | eventId, registrationId, kitData | Promise with kit tracking |
| configureScannerStation | Set up scanner | eventId, stationType, config | Promise with configuration |
| getResourceTypeUsage | Get usage by type | eventId, resourceType | Promise with usage data |#### Abstract Service (abstractService.js)
| Function | Description | Parameters | Return Value |
|----------|-------------|------------|--------------|
| getAbstracts | Get abstracts list | eventId, filters | Promise with abstracts array |
| getAbstractById | Get specific abstract | abstractId | Promise with abstract object |
| createAbstract | Submit new abstract | eventId, abstractData | Promise with created abstract |
| updateAbstract | Update abstract | abstractId, data | Promise with updated abstract |
| deleteAbstract | Delete abstract | abstractId | Promise with status |
| updateAbstractStatus | Change abstract status | abstractId, status, notes | Promise with updated abstract |
| submitAbstract | Submit through portal | eventId, registrationId, data | Promise with submission |
| uploadAbstractFile | Upload supporting file | abstractId, file | Promise with upload result |
| downloadAbstractFile | Download abstract file | abstractId, fileId | Promise with file data |
| downloadAllAbstracts | Get all as package | eventId, format | Promise with download data |
| validateAbstractSubmission | Validate before submit | eventId, abstractData | Promise with validation |
| getAbstractStats | Get submission stats | eventId | Promise with statistics |
| getAbstractsByRegistration | Get user's abstracts | eventId, registrationId | Promise with abstracts |
| searchAbstracts | Search in abstracts | eventId, query | Promise with search results |
| addReviewComment | Add reviewer comment | abstractId, comment | Promise with updated abstract |
| getAbstractCategories | Get abstract categories | eventId | Promise with categories |
| exportAbstractsToExcel | Export to Excel | eventId, filters | Promise with Excel data |
| importAbstractNumbers | Import abstract IDs | eventId, importData | Promise with import results |#### Badge Template Service (badgeTemplateService.js)
| Function | Description | Parameters | Return Value |
|----------|-------------|------------|--------------|
| getBadgeTemplates | Get templates list | eventId | Promise with templates array |
| getBadgeTemplateById | Get specific template | templateId | Promise with template object |
| createBadgeTemplate | Create new template | eventId, templateData | Promise with created template |
| updateBadgeTemplate | Update template | templateId, data | Promise with updated template |
| deleteBadgeTemplate | Delete template | templateId | Promise with status |
| setDefaultTemplate | Set as default | templateId, eventId | Promise with updated template |
| previewBadge | Generate preview | templateId, registrationData | Promise with preview HTML |
| renderBadgeForPrinting | Render for printer | templateId, registrationId | Promise with print HTML |
| getBadgeElements | Get badge elements | templateId | Promise with elements array |
| updateBadgeElement | Update element | templateId, elementId, data | Promise with updated element |
| getBadgeTemplateByCategory | Get for category | eventId, categoryId | Promise with template |
| duplicateTemplate | Copy template | templateId, newName | Promise with new template |
| validateTemplateData | Validate template | templateData | Promise with validation |
| getBadgeDimensions | Get size options | None | Promise with dimensions |
| getBadgeOrientations | Get orientations | None | Promise with orientations |
| renderBatchBadges | Render multiple | eventId, registrationIds, templateId | Promise with batch HTML |#### Category Service (categoryService.js)
| Function | Description | Parameters | Return Value |
|----------|-------------|------------|--------------|
| getCategories | Get categories list | eventId | Promise with categories array |
| getCategoryById | Get specific category | categoryId | Promise with category object |
| createCategory | Create new category | eventId, categoryData | Promise with created category |
| updateCategory | Update category | categoryId, data | Promise with updated category |
| deleteCategory | Delete category | categoryId | Promise with status |
| getCategoryPermissions | Get permissions | categoryId | Promise with permissions |
| updateCategoryPermissions | Update permissions | categoryId, permissions | Promise with updated permissions |
| getCategoryResources | Get resources | categoryId | Promise with resources |
| updateCategoryResources | Update resources | categoryId, resources | Promise with updated resources |
| getCategoryStatistics | Get usage stats | categoryId | Promise with statistics |
| getRegistrationsByCategory | Get registrations | eventId, categoryId | Promise with registrations |
| validateCategorySettings | Validate settings | categoryData | Promise with validation |
| getCategoryColors | Get color options | None | Promise with colors |
| assignCategoryToRegistrations | Bulk assign | eventId, categoryId, registrationIds | Promise with results |







#### Event Model Extension for Pricing
```javascript
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

## Backend Routes and APIs

### Authentication API

#### Routes Configuration (auth.routes.js)
```javascript
router.post('/register', validateBody(authSchema.register), catchAsync(authController.register));
router.post('/login', validateBody(authSchema.login), catchAsync(authController.login));
router.post('/refresh-token', validateBody(authSchema.refreshToken), catchAsync(authController.refreshToken));
router.post('/forgot-password', validateBody(authSchema.forgotPassword), catchAsync(authController.forgotPassword));
router.post('/reset-password', validateBody(authSchema.resetPassword), catchAsync(authController.resetPassword));
router.post('/change-password', auth, validateBody(authSchema.changePassword), catchAsync(authController.changePassword));
router.get('/me', auth, catchAsync(authController.getMe));
router.get('/users', auth, authorize('admin'), catchAsync(authController.getUsers));
router.post('/users', auth, authorize('admin'), validateBody(authSchema.createUser), catchAsync(authController.createUser));
router.get('/users/:id', auth, authorize('admin'), catchAsync(authController.getUserById));
router.put('/users/:id', auth, authorize('admin'), validateBody(authSchema.updateUser), catchAsync(authController.updateUser));
router.delete('/users/:id', auth, authorize('admin'), catchAsync(authController.deleteUser));
router.patch('/users/:id/status', auth, authorize('admin'), validateBody(authSchema.updateUserStatus), catchAsync(authController.updateUserStatus));
router.get('/roles', auth, authorize('admin'), catchAsync(authController.getRoles));
```

#### Controller Functions (auth.controller.js)
| Function | Description | Request | Response |
|----------|-------------|---------|----------|
| register | Register new user | POST with name, email, password | User object with JWT |
| login | Authenticate user | POST with email, password | User object with JWT |
| refreshToken | Refresh expired token | POST with refresh token | New access token |
| forgotPassword | Request password reset | POST with email | Success message |
| resetPassword | Reset password with token | POST with token, password | Success message |
| changePassword | Change logged in user's password | POST with old/new passwords | Success message |
| getMe | Get current user profile | GET with auth token | User object |
| getUsers | Get all system users | GET with filters | Array of users |
| createUser | Create new user (admin) | POST with user details | Created user |
| getUserById | Get user by ID | GET with user ID | User object |
| updateUser | Update user details | PUT with user data | Updated user |
| deleteUser | Delete user account | DELETE with user ID | Success message |
| updateUserStatus | Enable/disable user | PATCH with status | Updated user |
| getRoles | Get available roles | GET | Array of role objects |

### Event API

#### Routes Configuration (event.routes.js)
```javascript
router.get('/', catchAsync(eventController.getEvents));
router.post('/', auth, authorize('admin', 'manager'), validateBody(eventSchema.createEvent), catchAsync(eventController.createEvent));
router.get('/:id', catchAsync(eventController.getEventById));
router.put('/:id', auth, authorize('admin', 'manager'), validateBody(eventSchema.updateEvent), catchAsync(eventController.updateEvent));
router.delete('/:id', auth, authorize('admin'), catchAsync(eventController.deleteEvent));
router.get('/:id/dashboard', auth, catchAsync(eventController.getEventDashboard));
router.get('/:id/statistics', auth, catchAsync(eventController.getEventStatistics));
router.get('/:id/portal-url', auth, catchAsync(eventController.getEventPortalUrl));
router.patch('/:id/status', auth, authorize('admin', 'manager'), validateBody(eventSchema.updateEventStatus), catchAsync(eventController.updateEventStatus));
router.post('/:id/duplicate', auth, authorize('admin', 'manager'), catchAsync(eventController.duplicateEvent));
router.get('/:id/settings/:type', auth, catchAsync(eventController.getEventSettings));
router.put('/:id/settings/:type', auth, authorize('admin', 'manager'), catchAsync(eventController.updateEventSettings));
router.get('/:id/registration-settings', auth, catchAsync(eventController.getRegistrationSettings));
router.put('/:id/registration-settings', auth, authorize('admin', 'manager'), validateBody(eventSchema.registrationSettings), catchAsync(eventController.updateRegistrationSettings));
router.get('/:id/abstract-settings', auth, catchAsync(eventController.getAbstractSettings));
router.put('/:id/abstract-settings', auth, authorize('admin', 'manager'), validateBody(eventSchema.abstractSettings), catchAsync(eventController.updateAbstractSettings));
router.get('/:id/badge-settings', auth, catchAsync(eventController.getBadgeSettings));
router.put('/:id/badge-settings', auth, authorize('admin', 'manager'), validateBody(eventSchema.badgeSettings), catchAsync(eventController.updateBadgeSettings));
router.post('/:id/badges/generate', auth, catchAsync(eventController.generateBadges));
```

#### Controller Functions (event.controller.js)
| Function | Description | Request | Response |
|----------|-------------|---------|----------|
| getEvents | Get all events | GET with filters, pagination | Array of events |
| createEvent | Create new event | POST with event data | Created event |
| getEventById | Get event by ID | GET with event ID | Event object |
| updateEvent | Update event | PUT with event data | Updated event |
| deleteEvent | Delete/archive event | DELETE with event ID | Success message |
| getEventDashboard | Get dashboard data | GET with event ID | Dashboard data |
| getEventStatistics | Get event statistics | GET with event ID, period | Statistics object |
| getEventPortalUrl | Get public portal URL | GET with event ID | URL string |
| updateEventStatus | Change event status | PATCH with status | Updated event |
| duplicateEvent | Create copy of event | POST with event ID, new data | New event |
| getEventSettings | Get settings by type | GET with event ID, setting type | Settings object |
| updateEventSettings | Update settings | PUT with event ID, type, settings | Updated settings |
| getRegistrationSettings | Get registration config | GET with event ID | Settings object |
| updateRegistrationSettings | Update registration config | PUT with settings data | Updated settings |
| getAbstractSettings | Get abstract settings | GET with event ID | Settings object |
| updateAbstractSettings | Update abstract settings | PUT with settings data | Updated settings |
| getBadgeSettings | Get badge settings | GET with event ID | Settings object |
| updateBadgeSettings | Update badge settings | PUT with settings data | Updated settings |
| generateBadges | Generate badge templates | POST with options | Generated badge data |

### Registration API

#### Routes Configuration (registration.routes.js)
```javascript
router.get('/', auth, catchAsync(registrationController.getRegistrations));
router.post('/', auth, validateBody(registrationSchema.createRegistration), catchAsync(registrationController.createRegistration));
router.get('/count', auth, catchAsync(registrationController.getRegistrationsCount));
router.get('/:id', catchAsync(registrationController.getRegistrationById));
router.put('/:id', auth, validateBody(registrationSchema.updateRegistration), catchAsync(registrationController.updateRegistration));
router.delete('/:id', auth, authorize('admin', 'manager'), catchAsync(registrationController.deleteRegistration));
router.post('/bulk-import', auth, upload.single('file'), catchAsync(registrationController.bulkImportRegistrations));
router.get('/export', auth, catchAsync(registrationController.exportRegistrations));
router.patch('/:id/check-in', auth, catchAsync(registrationController.checkInRegistration));
router.post('/validate', validateBody(registrationSchema.validateCode), catchAsync(registrationController.validateRegistrationCode));
router.get('/:id/qrcode', catchAsync(registrationController.getRegistrationQRCode));
router.post('/:id/badge', auth, catchAsync(registrationController.generateBadge));
router.post('/bulk-print', auth, validateBody(registrationSchema.bulkPrint), catchAsync(registrationController.getBulkPrintQueue));
router.post('/search', auth, validateBody(registrationSchema.search), catchAsync(registrationController.searchRegistrations));
router.get('/:id/resources', auth, catchAsync(registrationController.getRegistrationResources));
router.post('/validate-access', validateBody(registrationSchema.validateAccess), catchAsync(registrationController.validateRegistrationAccess));
```

#### Event-Specific Registration Routes (events.routes.js)
```javascript
router.get('/:eventId/registrations', auth, catchAsync(registrationController.getRegistrations));
router.post('/:eventId/registrations', auth, validateBody(registrationSchema.createRegistration), catchAsync(registrationController.createRegistration));
router.get('/:eventId/registrations/count', auth, catchAsync(registrationController.getRegistrationsCount));
router.post('/:eventId/registrations/bulk-import', auth, upload.single('file'), catchAsync(registrationController.bulkImportRegistrations));
router.get('/:eventId/registrations/export', auth, catchAsync(registrationController.exportRegistrations));
router.get('/:eventId/registrations/:registrationId', auth, catchAsync(registrationController.getRegistrationById));
router.put('/:eventId/registrations/:registrationId', auth, validateBody(registrationSchema.updateRegistration), catchAsync(registrationController.updateRegistration));
router.delete('/:eventId/registrations/:registrationId', auth, authorize('admin', 'manager'), catchAsync(registrationController.deleteRegistration));
router.patch('/:eventId/registrations/:registrationId/check-in', auth, catchAsync(registrationController.checkInRegistration));
router.get('/:eventId/registrations/:registrationId/qrcode', catchAsync(registrationController.getRegistrationQRCode));
router.post('/:eventId/registrations/:registrationId/badge', auth, catchAsync(registrationController.generateBadge));
router.post('/:eventId/registrations/bulk-print', auth, validateBody(registrationSchema.bulkPrint), catchAsync(registrationController.getBulkPrintQueue));
router.post('/:eventId/registrations/search', auth, validateBody(registrationSchema.search), catchAsync(registrationController.searchRegistrations));
```

#### Controller Functions (registration.controller.js)
| Function | Description | Request | Response |
|----------|-------------|---------|----------|
| getRegistrations | Get registrations list | GET with filters, pagination | Array of registrations |
| getRegistrationsCount | Get registration stats | GET with event ID | Count statistics |
| getRegistrationById | Get single registration | GET with registration ID | Registration object |
| createRegistration | Create new registration | POST with registration data | Created registration |
| updateRegistration | Update registration | PUT with registration data | Updated registration |
| deleteRegistration | Delete registration | DELETE with registration ID | Success message |
| bulkImportRegistrations | Import from Excel | POST with file | Import results |
| validateRegistrationImport | Validate import file | POST with file | Validation results |
| exportRegistrations | Export to Excel | GET with filters | Excel file |
| checkInRegistration | Check in attendee | PATCH with registration ID | Updated registration |
| validateRegistrationCode | Validate QR/ID | POST with code | Validation result |
| getRegistrationQRCode | Get QR code | GET with registration ID | QR code image |
| generateBadge | Create badge | POST with registration ID | Badge HTML/PDF |
| getBulkPrintQueue | Get badges for printing | POST with registration IDs | Array of badge data |
| searchRegistrations | Search registrations | POST with query | Search results |
| getRegistrationResources | Get resource records | GET with registration ID | Array of resources |
| validateRegistrationAccess | Check resource access | POST with registration, resource | Access result |

### Resource API

#### Routes Configuration (resource.routes.js)
```javascript
router.get('/settings', auth, catchAsync(resourceController.getResourceSettings));
router.put('/settings', auth, authorize('admin', 'manager'), validateBody(resourceSchema.updateSettings), catchAsync(resourceController.updateResourceSettings));
router.get('/', auth, catchAsync(resourceController.getResources));
router.post('/', auth, validateBody(resourceSchema.createResource), catchAsync(resourceController.createResource));
router.get('/:id', auth, catchAsync(resourceController.getResourceById));
router.put('/:id', auth, validateBody(resourceSchema.updateResource), catchAsync(resourceController.updateResource));
router.delete('/:id', auth, authorize('admin', 'manager'), catchAsync(resourceController.deleteResource));
router.post('/scan', validateBody(resourceSchema.scanResource), catchAsync(resourceController.scanResource));
router.post('/validate', validateBody(resourceSchema.validateScan), catchAsync(resourceController.validateScan));
router.put('/:id/void', auth, validateBody(resourceSchema.voidResource), catchAsync(resourceController.voidResource));
router.get('/statistics', auth, catchAsync(resourceController.getResourceStatistics));
router.post('/certificate/generate', auth, validateBody(resourceSchema.generateCertificates), catchAsync(resourceController.generateCertificates));
router.post('/certificate/send-email', auth, validateBody(resourceSchema.sendCertificates), catchAsync(resourceController.sendCertificatesByEmail));
router.post('/certificate/print', auth, validateBody(resourceSchema.printCertificates), catchAsync(resourceController.printCertificates));
router.post('/meal/track', auth, validateBody(resourceSchema.trackMeal), catchAsync(resourceController.trackMeal));
router.post('/kit/track', auth, validateBody(resourceSchema.trackKitItem), catchAsync(resourceController.trackKitItem));
router.post('/scanner/configure', auth, validateBody(resourceSchema.configureScanner), catchAsync(resourceController.configureScannerStation));
router.get('/type/:type/usage', auth, catchAsync(resourceController.getResourceTypeUsage));
```

#### Event-Specific Resource Routes (events.routes.js)
```javascript
router.get('/:eventId/resources', auth, catchAsync(resourceController.getResources));
router.post('/:eventId/resources', auth, validateBody(resourceSchema.createResource), catchAsync(resourceController.createResource));
router.get('/:eventId/resources/settings', auth, catchAsync(resourceController.getResourceSettings));
router.put('/:eventId/resources/settings', auth, authorize('admin', 'manager'), validateBody(resourceSchema.updateSettings), catchAsync(resourceController.updateResourceSettings));
router.post('/:eventId/resources/scan', validateBody(resourceSchema.scanResource), catchAsync(resourceController.scanResource));
router.post('/:eventId/resources/validate', validateBody(resourceSchema.validateScan), catchAsync(resourceController.validateScan));
router.get('/:eventId/resources/statistics', auth, catchAsync(resourceController.getResourceStatistics));
router.post('/:eventId/resources/certificate/generate', auth, validateBody(resourceSchema.generateCertificates), catchAsync(resourceController.generateCertificates));
router.post('/:eventId/resources/certificate/send-email', auth, validateBody(resourceSchema.sendCertificates), catchAsync(resourceController.sendCertificatesByEmail));
router.post('/:eventId/resources/certificate/print', auth, validateBody(resourceSchema.printCertificates), catchAsync(resourceController.printCertificates));
router.post('/:eventId/resources/meal/track', auth, validateBody(resourceSchema.trackMeal), catchAsync(resourceController.trackMeal));
router.post('/:eventId/resources/kit/track', auth, validateBody(resourceSchema.trackKitItem), catchAsync(resourceController.trackKitItem));
router.post('/:eventId/resources/scanner/configure', auth, validateBody(resourceSchema.configureScanner), catchAsync(resourceController.configureScannerStation));
router.get('/:eventId/resources/type/:type/usage', auth, catchAsync(resourceController.getResourceTypeUsage));
```

#### Controller Functions (resource.controller.js)
| Function | Description | Request | Response |
|----------|-------------|---------|----------|
| getResourceSettings | Get resource config | GET with event ID, type | Settings object |
| updateResourceSettings | Update resource config | PUT with settings data | Updated settings |
| getResources | Get resource records | GET with filters | Array of resources |
| getResourceById | Get single resource | GET with resource ID | Resource object |
| createResource | Record resource usage | POST with resource data | Created resource |
| updateResource | Update resource record | PUT with resource data | Updated resource |
| deleteResource | Delete resource record | DELETE with resource ID | Success message |
| scanResource | Record via scanner | POST with scan data | Scan result |
| validateScan | Check scan eligibility | POST with registration, resource | Validation result |
| voidResource | Void resource record | PUT with resource ID, reason | Updated resource |
| getResourceStatistics | Get usage statistics | GET with filters | Statistics object |
| generateCertificates | Create certificates | POST with registrations, type | Generated certificates |
| sendCertificatesByEmail | Email certificates | POST with certificate IDs | Email results |
| printCertificates | Print certificates | POST with certificate IDs | Print data |
| trackMeal | Record meal consumption | POST with meal data | Meal resource record |
| trackKitItem | Record kit distribution | POST with kit data | Kit resource record |
| configureScannerStation | Set scanner config | POST with config data | Scanner configuration |
| getResourceTypeUsage | Get type usage | GET with event ID, type | Usage statistics |

### Abstract API

#### Routes Configuration (abstract.routes.js)
```javascript
router.get('/', auth, catchAsync(abstractController.getAbstracts));
router.post('/', auth, validateBody(abstractSchema.createAbstract), catchAsync(abstractController.createAbstract));
router.get('/:id', catchAsync(abstractController.getAbstract));
router.put('/:id', auth, validateBody(abstractSchema.updateAbstract), catchAsync(abstractController.updateAbstract));
router.delete('/:id', auth, authorize('admin', 'manager'), catchAsync(abstractController.deleteAbstract));
router.put('/:id/status', auth, authorize('admin', 'manager'), validateBody(abstractSchema.updateStatus), catchAsync(abstractController.updateAbstractStatus));
router.post('/:id/file', auth, upload.single('file'), catchAsync(abstractController.uploadAbstractFile));
router.get('/:id/file/:fileId', catchAsync(abstractController.downloadAbstractFile));
router.post('/submit', validateBody(abstractSchema.submitAbstract), catchAsync(abstractController.submitAbstract));
router.post('/validate', validateBody(abstractSchema.validateSubmission), catchAsync(abstractController.validateAbstractSubmission));
router.get('/stats', auth, catchAsync(abstractController.getAbstractStats));
router.get('/user/:registrationId', catchAsync(abstractController.getAbstractsByRegistration));
router.post('/search', auth, validateBody(abstractSchema.search), catchAsync(abstractController.searchAbstracts));
router.post('/:id/review', auth, authorize('admin', 'manager'), validateBody(abstractSchema.addReviewComment), catchAsync(abstractController.addReviewComment));
router.get('/categories', auth, catchAsync(abstractController.getAbstractCategories));
router.get('/export', auth, catchAsync(abstractController.exportAbstractsToExcel));
router.post('/import-numbers', auth, authorize('admin', 'manager'), upload.single('file'), catchAsync(abstractController.importAbstractNumbers));
```

#### Event-Specific Abstract Routes (events.routes.js)
```javascript
router.get('/:eventId/abstracts', auth, catchAsync(abstractController.getAbstracts));
router.post('/:eventId/abstracts', auth, validateBody(abstractSchema.createAbstract), catchAsync(abstractController.createAbstract));
router.get('/:eventId/abstracts/:abstractId', auth, catchAsync(abstractController.getAbstract));
router.put('/:eventId/abstracts/:abstractId', auth, validateBody(abstractSchema.updateAbstract), catchAsync(abstractController.updateAbstract));
router.delete('/:eventId/abstracts/:abstractId', auth, authorize('admin', 'manager'), catchAsync(abstractController.deleteAbstract));
router.put('/:eventId/abstracts/:abstractId/status', auth, authorize('admin', 'manager'), validateBody(abstractSchema.updateStatus), catchAsync(abstractController.updateAbstractStatus));
router.get('/:eventId/abstracts/download', auth, catchAsync(abstractController.downloadAllAbstracts));
router.get('/:eventId/abstracts/stats', auth, catchAsync(abstractController.getAbstractStats));
router.get('/:eventId/abstracts/user/:registrationId', catchAsync(abstractController.getAbstractsByRegistration));
router.post('/:eventId/abstracts/search', auth, validateBody(abstractSchema.search), catchAsync(abstractController.searchAbstracts));
router.get('/:eventId/abstracts/categories', auth, catchAsync(abstractController.getAbstractCategories));
router.get('/:eventId/abstracts/export', auth, catchAsync(abstractController.exportAbstractsToExcel));
router.post('/:eventId/abstracts/import-numbers', auth, authorize('admin', 'manager'), upload.single('file'), catchAsync(abstractController.importAbstractNumbers));
```

#### Controller Functions (abstract.controller.js)
| Function | Description | Request | Response |
|----------|-------------|---------|----------|
| getAbstracts | Get abstracts list | GET with filters | Array of abstracts |
| getAbstract | Get single abstract | GET with abstract ID | Abstract object |
| createAbstract | Create new abstract | POST with abstract data | Created abstract |
| updateAbstract | Update abstract | PUT with abstract data | Updated abstract |
| deleteAbstract | Delete abstract | DELETE with abstract ID | Success message |
| updateAbstractStatus | Change status | PUT with status, notes | Updated abstract |
| uploadAbstractFile | Upload file | POST with file | Upload result |
| downloadAbstractFile | Download file | GET with file ID | File download |
| submitAbstract | Submit via portal | POST with submission data | Submission result |
| downloadAllAbstracts | Download all | GET with event ID, format | ZIP file |
| validateAbstractSubmission | Validate data | POST with abstract data | Validation result |
| getAbstractStats | Get statistics | GET with event ID | Statistics object |
| getAbstractsByRegistration | Get user's abstracts | GET with registration ID | Array of abstracts |
| searchAbstracts | Search abstracts | POST with query | Search results |
| addReviewComment | Add review note | POST with comment | Updated abstract |
| getAbstractCategories | Get categories | GET with event ID | Array of categories |
| exportAbstractsToExcel | Export to Excel | GET with filters | Excel file |
| importAbstractNumbers | Import IDs | POST with file | Import results |

### Badge Template API

#### Routes Configuration (badgeTemplate.routes.js)
```javascript
router.get('/', auth, catchAsync(badgeTemplateController.getBadgeTemplates));
router.post('/', auth, authorize('admin', 'manager'), validateBody(badgeTemplateSchema.createTemplate), catchAsync(badgeTemplateController.createBadgeTemplate));
router.get('/:id', auth, catchAsync(badgeTemplateController.getBadgeTemplateById));
router.put('/:id', auth, authorize('admin', 'manager'), validateBody(badgeTemplateSchema.updateTemplate), catchAsync(badgeTemplateController.updateBadgeTemplate));
router.delete('/:id', auth, authorize('admin', 'manager'), catchAsync(badgeTemplateController.deleteBadgeTemplate));
router.put('/:id/default', auth, authorize('admin', 'manager'), catchAsync(badgeTemplateController.setDefaultTemplate));
router.post('/:id/preview', auth, validateBody(badgeTemplateSchema.previewBadge), catchAsync(badgeTemplateController.previewBadge));
router.post('/:id/render', auth, validateBody(badgeTemplateSchema.renderBadge), catchAsync(badgeTemplateController.renderBadgeForPrinting));
router.get('/:id/elements', auth, catchAsync(badgeTemplateController.getBadgeElements));
router.put('/:id/elements/:elementId', auth, authorize('admin', 'manager'), validateBody(badgeTemplateSchema.updateElement), catchAsync(badgeTemplateController.updateBadgeElement));
router.get('/category/:categoryId', auth, catchAsync(badgeTemplateController.getBadgeTemplateByCategory));
router.post('/:id/duplicate', auth, authorize('admin', 'manager'), validateBody(badgeTemplateSchema.duplicateTemplate), catchAsync(badgeTemplateController.duplicateTemplate));
router.post('/validate', auth, validateBody(badgeTemplateSchema.validateTemplate), catchAsync(badgeTemplateController.validateTemplateData));
router.get('/dimensions', auth, catchAsync(badgeTemplateController.getBadgeDimensions));
router.get('/orientations', auth, catchAsync(badgeTemplateController.getBadgeOrientations));
router.post('/batch-render', auth, validateBody(badgeTemplateSchema.renderBatchBadges), catchAsync(badgeTemplateController.renderBatchBadges));
```

#### Event-Specific Badge Template Routes (events.routes.js)
```javascript
router.get('/:eventId/badges', auth, catchAsync(badgeTemplateController.getBadgeTemplates));
router.post('/:eventId/badges', auth, authorize('admin', 'manager'), validateBody(badgeTemplateSchema.createTemplate), catchAsync(badgeTemplateController.createBadgeTemplate));
router.get('/:eventId/badges/:templateId', auth, catchAsync(badgeTemplateController.getBadgeTemplateById));
router.put('/:eventId/badges/:templateId', auth, authorize('admin', 'manager'), validateBody(badgeTemplateSchema.updateTemplate), catchAsync(badgeTemplateController.updateBadgeTemplate));
router.delete('/:eventId/badges/:templateId', auth, authorize('admin', 'manager'), catchAsync(badgeTemplateController.deleteBadgeTemplate));
router.put('/:eventId/badges/:templateId/default', auth, authorize('admin', 'manager'), catchAsync(badgeTemplateController.setDefaultTemplate));
router.post('/:eventId/badges/:templateId/preview', auth, validateBody(badgeTemplateSchema.previewBadge), catchAsync(badgeTemplateController.previewBadge));
router.post('/:eventId/badges/:templateId/render', auth, validateBody(badgeTemplateSchema.renderBadge), catchAsync(badgeTemplateController.renderBadgeForPrinting));
router.post('/:eventId/badges/batch-render', auth, validateBody(badgeTemplateSchema.renderBatchBadges), catchAsync(badgeTemplateController.renderBatchBadges));
```

#### Controller Functions (badgeTemplate.controller.js)
| Function | Description | Request | Response |
|----------|-------------|---------|----------|
| getBadgeTemplates | Get templates list | GET with event ID | Array of templates |
| getBadgeTemplateById | Get single template | GET with template ID | Template object |
| createBadgeTemplate | Create new template | POST with template data | Created template |
| updateBadgeTemplate | Update template | PUT with template data | Updated template |
| deleteBadgeTemplate | Delete template | DELETE with template ID | Success message |
| setDefaultTemplate | Set as default | PUT with template ID | Updated template |
| previewBadge | Generate preview | POST with registration data | Preview HTML |
| renderBadgeForPrinting | Render for printer | POST with registration ID | Print HTML |
| getBadgeElements | Get elements | GET with template ID | Array of elements |
| updateBadgeElement | Update element | PUT with element data | Updated element |
| getBadgeTemplateByCategory | Get for category | GET with category ID | Template object |
| duplicateTemplate | Copy template | POST with template ID, name | New template |
| validateTemplateData | Validate template | POST with template data | Validation result |
| getBadgeDimensions | Get dimensions | GET | Array of dimensions |
| getBadgeOrientations | Get orientations | GET | Array of orientations |
| renderBatchBadges | Render multiple | POST with registration IDs | Array of badge HTML |

### Category API

#### Routes Configuration (category.routes.js)
```javascript
router.get('/', auth, catchAsync(categoryController.getCategories));
router.post('/', auth, authorize('admin', 'manager'), validateBody(categorySchema.createCategory), catchAsync(categoryController.createCategory));
router.get('/:id', auth, catchAsync(categoryController.getCategoryById));
router.put('/:id', auth, authorize('admin', 'manager'), validateBody(categorySchema.updateCategory), catchAsync(categoryController.updateCategory));
router.delete('/:id', auth, authorize('admin', 'manager'), catchAsync(categoryController.deleteCategory));
router.get('/:id/permissions', auth, catchAsync(categoryController.getCategoryPermissions));
router.put('/:id/permissions', auth, authorize('admin', 'manager'), validateBody(categorySchema.updatePermissions), catchAsync(categoryController.updateCategoryPermissions));
router.get('/:id/resources', auth, catchAsync(categoryController.getCategoryResources));
router.put('/:id/resources', auth, authorize('admin', 'manager'), validateBody(categorySchema.updateResources), catchAsync(categoryController.updateCategoryResources));
router.get('/:id/statistics', auth, catchAsync(categoryController.getCategoryStatistics));
router.get('/:id/registrations', auth, catchAsync(categoryController.getRegistrationsByCategory));
router.post('/validate', auth, validateBody(categorySchema.validateSettings), catchAsync(categoryController.validateCategorySettings));
router.get('/colors', auth, catchAsync(categoryController.getCategoryColors));
router.post('/assign', auth, authorize('admin', 'manager'), validateBody(categorySchema.assignCategory), catchAsync(categoryController.assignCategoryToRegistrations));
```

#### Event-Specific Category Routes (events.routes.js)
```javascript
router.get('/:eventId/categories', auth, catchAsync(categoryController.getCategories));
router.post('/:eventId/categories', auth, authorize('admin', 'manager'), validateBody(categorySchema.createCategory), catchAsync(categoryController.createCategory));
router.get('/:eventId/categories/:categoryId', auth, catchAsync(categoryController.getCategoryById));
router.put('/:eventId/categories/:categoryId', auth, authorize('admin', 'manager'), validateBody(categorySchema.updateCategory), catchAsync(categoryController.updateCategory));
router.delete('/:eventId/categories/:categoryId', auth, authorize('admin', 'manager'), catchAsync(categoryController.deleteCategory));
router.get('/:eventId/categories/:categoryId/permissions', auth, catchAsync(categoryController.getCategoryPermissions));
router.put('/:eventId/categories/:categoryId/permissions', auth, authorize('admin', 'manager'), validateBody(categorySchema.updatePermissions), catchAsync(categoryController.updateCategoryPermissions));
router.get('/:eventId/categories/:categoryId/resources', auth, catchAsync(categoryController.getCategoryResources));
router.put('/:eventId/categories/:categoryId/resources', auth, authorize('admin', 'manager'), validateBody(categorySchema.updateResources), catchAsync(categoryController.updateCategoryResources));
router.get('/:eventId/categories/:categoryId/statistics', auth, catchAsync(categoryController.getCategoryStatistics));
router.get('/:eventId/categories/:categoryId/registrations', auth, catchAsync(categoryController.getRegistrationsByCategory));
router.post('/:eventId/categories/assign', auth, authorize('admin', 'manager'), validateBody(categorySchema.assignCategory), catchAsync(categoryController.assignCategoryToRegistrations));
```

#### Controller Functions (category.controller.js)
| Function | Description | Request | Response |
|----------|-------------|---------|----------|
| getCategories | Get categories list | GET with event ID | Array of categories |
| getCategoryById | Get single category | GET with category ID | Category object |
| createCategory | Create new category | POST with category data | Created category |
| updateCategory | Update category | PUT with category data | Updated category |
| deleteCategory | Delete category | DELETE with category ID | Success message |
| getCategoryPermissions | Get permissions | GET with category ID | Permissions object |
| updateCategoryPermissions | Update permissions | PUT with permissions | Updated permissions |
| getCategoryResources | Get resources | GET with category ID | Resources object |
| updateCategoryResources | Update resources | PUT with resources data | Updated resources |
| getCategoryStatistics | Get usage stats | GET with category ID | Statistics object |
| getRegistrationsByCategory | Get registrations | GET with category ID | Array of registrations |
| validateCategorySettings | Validate settings | POST with category data | Validation result |
| getCategoryColors | Get color options | GET | Array of color options |
| assignCategoryToRegistrations | Bulk assign | POST with category, registrations | Assignment results |

### Email API

#### Routes Configuration (email.routes.js)
```javascript
router.post('/send', auth, authorize('admin', 'manager'), validateBody(emailSchema.sendEmail), catchAsync(emailController.sendEmail));
router.get('/templates', auth, catchAsync(emailController.getEmailTemplates));
router.post('/templates', auth, authorize('admin', 'manager'), validateBody(emailSchema.createTemplate), catchAsync(emailController.createEmailTemplate));
router.put('/templates/:id', auth, authorize('admin', 'manager'), validateBody(emailSchema.updateTemplate), catchAsync(emailController.updateEmailTemplate));
router.delete('/templates/:id', auth, authorize('admin', 'manager'), catchAsync(emailController.deleteEmailTemplate));
router.post('/bulk-send', auth, authorize('admin', 'manager'), validateBody(emailSchema.bulkSend), catchAsync(emailController.sendBulkEmails));
router.get('/settings', auth, catchAsync(emailController.getEmailSettings));
router.put('/settings', auth, authorize('admin'), validateBody(emailSchema.updateSettings), catchAsync(emailController.updateEmailSettings));
router.post('/preview', auth, validateBody(emailSchema.previewEmail), catchAsync(emailController.previewEmail));
router.get('/variables', auth, catchAsync(emailController.getEmailVariables));
router.post('/test', auth, authorize('admin'), validateBody(emailSchema.testEmail), catchAsync(emailController.sendTestEmail));
```

#### Event-Specific Email Routes (events.routes.js)
```javascript
router.post('/:eventId/emails/send', auth, authorize('admin', 'manager'), validateBody(emailSchema.sendEmail), catchAsync(emailController.sendEmail));
router.get('/:eventId/emails/templates', auth, catchAsync(emailController.getEmailTemplates));
router.post('/:eventId/emails/templates', auth, authorize('admin', 'manager'), validateBody(emailSchema.createTemplate), catchAsync(emailController.createEmailTemplate));
router.get('/:eventId/emails/templates/:templateId', auth, catchAsync(emailController.getEmailTemplateById));
router.put('/:eventId/emails/templates/:templateId', auth, authorize('admin', 'manager'), validateBody(emailSchema.updateTemplate), catchAsync(emailController.updateEmailTemplate));
router.delete('/:eventId/emails/templates/:templateId', auth, authorize('admin', 'manager'), catchAsync(emailController.deleteEmailTemplate));
router.post('/:eventId/emails/bulk-send', auth, authorize('admin', 'manager'), validateBody(emailSchema.bulkSend), catchAsync(emailController.sendBulkEmails));
router.post('/:eventId/emails/preview', auth, validateBody(emailSchema.previewEmail), catchAsync(emailController.previewEmail));
```

#### Controller Functions (email.controller.js)
| Function | Description | Request | Response |
|----------|-------------|---------|----------|
| sendEmail | Send single email | POST with email data | Send result |
| getEmailTemplates | Get templates list | GET with event ID | Array of templates |
| getEmailTemplateById | Get single template | GET with template ID | Template object |
| createEmailTemplate | Create new template | POST with template data | Created template |
| updateEmailTemplate | Update template | PUT with template data | Updated template |
| deleteEmailTemplate | Delete template | DELETE with template ID | Success message |
| sendBulkEmails | Send to multiple | POST with recipients, template | Bulk send results |
| getEmailSettings | Get email config | GET | Settings object |
| updateEmailSettings | Update email config | PUT with settings data | Updated settings |
| previewEmail | Generate preview | POST with template, data | Preview HTML |
| getEmailVariables | Get available vars | GET | Array of variables |
| sendTestEmail | Send test message | POST with email data | Test result |
```

## Database Models

### User Model (User.js)
```javascript
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please add a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false
  },
  role: {
    type: String,
    enum: ['admin', 'manager', 'staff'],
    default: 'staff'
  },
  events: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event'
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
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

**Key Methods:**
- `comparePassword(candidatePassword)`: Compare entered password with stored (hashed) password
- `generatePasswordResetToken()`: Create and store token for password reset
- `getSignedJwtToken()`: Generate JWT token for authentication

### Event Model (Event.js)
```javascript
const eventSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Event name is required'],
    trim: true,
    maxlength: [200, 'Event name cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  venue: {
    name: String,
    address: String,
    city: String,
    state: String,
    country: String,
    zipCode: String
  },
  logo: String,
  bannerImage: String,
  registrationSettings: {
    idPrefix: {
      type: String,
      default: 'REG'
    },
    startNumber: {
      type: Number,
      default: 1000
    },
    isOpen: {
      type: Boolean,
      default: true
    },
    allowOnsite: {
      type: Boolean,
      default: true
    },
    customFields: [{
      name: String,
      type: {
        type: String,
        enum: ['text', 'number', 'date', 'select', 'checkbox']
      },
      options: [String],
      isRequired: Boolean
    }]
  },
  categories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
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
    template: String
  }],
  abstractSettings: {
    enabled: {
      type: Boolean,
      default: false
    },
    isOpen: {
      type: Boolean,
      default: false
    },
    deadline: Date,
    maxLength: {
      type: Number,
      default: 500
    },
    allowEditing: {
      type: Boolean,
      default: true
    },
    guidelines: String,
    categories: [{
      name: String,
      description: String
    }],
    notifyOnSubmission: {
      type: Boolean,
      default: false
    },
    allowFiles: {
      type: Boolean,
      default: false
    },
    maxFileSize: {
      type: Number,
      default: 5242880 // 5MB
    }
  },
  badgeSettings: {
    orientation: {
      type: String,
      enum: ['portrait', 'landscape'],
      default: 'portrait'
    },
    size: {
      width: Number,
      height: Number
    },
    unit: {
      type: String,
      enum: ['mm', 'cm', 'in'],
      default: 'mm'
    },
    showLogo: {
      type: Boolean,
      default: true
    },
    logoPosition: String,
    showQR: {
      type: Boolean,
      default: true
    },
    qrPosition: String,
    fields: {
      name: {
        type: Boolean,
        default: true
      },
      organization: {
        type: Boolean,
        default: true
      },
      registrationId: {
        type: Boolean,
        default: true
      },
      category: {
        type: Boolean,
        default: true
      },
      country: {
        type: Boolean,
        default: true
      },
      qrCode: {
        type: Boolean,
        default: true
      }
    },
    fieldConfig: Object,
    colors: Object
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
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

**Key Methods:**
- `getNextRegistrationId()`: Generate the next sequential registration ID using prefix
- `isRegistrationOpen()`: Check if registration is currently open
- `isAbstractSubmissionOpen()`: Check if abstract submission is currently open
- `generatePortalUrl(type)`: Generate URL for public portals (registration, abstract)

### Registration Model (Registration.js)
```javascript
const registrationSchema = new mongoose.Schema({
  registrationId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
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
  personalInfo: {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please add a valid email']
    },
    phone: {
      type: String,
      trim: true
    },
    organization: {
      type: String,
      trim: true
    },
    designation: {
      type: String,
      trim: true
    },
    country: {
      type: String,
      trim: true
    }
  },
  customFields: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  qrCode: String,
  badgePrinted: {
    type: Boolean,
    default: false
  },
  checkIn: {
    isCheckedIn: {
      type: Boolean,
      default: false
    },
    checkedInAt: Date,
    checkedInBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  resourceUsage: {
    meals: [{
      meal: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Resource'
      },
      usedAt: Date,
      issuedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      isVoid: {
        type: Boolean,
        default: false
      },
      voidedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      voidedAt: Date
    }],
    kitItems: [{
      item: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Resource'
      },
      issuedAt: Date,
      issuedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      isVoid: {
        type: Boolean,
        default: false
      },
      voidedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      voidedAt: Date
    }],
    certificates: [{
      certificate: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Resource'
      },
      issuedAt: Date,
      issuedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      isVoid: {
        type: Boolean,
        default: false
      },
      voidedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      voidedAt: Date
    }]
  },
  notes: String,
  registrationType: {
    type: String,
    enum: ['pre-registered', 'onsite', 'imported'],
    default: 'onsite'
  },
  registeredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['active', 'cancelled', 'no-show'],
    default: 'active'
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

**Key Methods:**
- `generateQRCode()`: Generate QR code for registration
- `checkIn(userId)`: Record check-in with timestamp and user
- `getFullName()`: Return concatenated first and last name
- `getResourceUsage()`: Get all resource usage records
- `hasUsedResource(resourceType, resourceId)`: Check if specific resource was used
- `canAccessResource(resourceType)`: Check if category allows access to resource type

### Category Model (Category.js)
```javascript
const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  color: {
    type: String,
    default: '#2A4365' // Default color
  },
  permissions: {
    meals: {
      type: [String],
      default: []
    },
    kitItems: {
      type: [String],
      default: []
    },
    certificates: {
      type: [String],
      default: []
    }
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

**Key Methods:**
- `canAccessResource(resourceType, resourceId)`: Check if category has permission for specific resource
- `hasPermission(resourceType)`: Check if category has permission for resource type
- `getRegistrationCount()`: Get count of registrations in this category

### Abstract Model (Abstract.js)
```javascript
const abstractSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  registration: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Registration',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [300, 'Title cannot exceed 300 characters']
  },
  authors: {
    type: String,
    required: [true, 'Authors information is required'],
    trim: true
  },
  authorAffiliations: {
    type: String,
    trim: true
  },
  topic: {
    type: String,
    trim: true
  },
  content: {
    type: String,
    required: [true, 'Abstract content is required'],
    trim: true
  },
  category: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['draft', 'submitted', 'under-review', 'approved', 'rejected'],
    default: 'draft'
  },
  reviewNotes: {
    type: String,
    trim: true
  },
  submittedAt: Date,
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  attachments: [{
    fileName: String,
    filePath: String,
    fileSize: Number,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }]
});
```

**Key Methods:**
- `getWordCount()`: Count words in abstract content
- `canEdit()`: Check if abstract can be edited based on status
- `submit()`: Submit draft abstract
- `updateStatus(status, notes)`: Update review status with optional notes
- `addAttachment(fileData)`: Add file attachment to abstract

### Resource Model (Resource.js)
```javascript
const resourceSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  registration: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Registration',
    required: true
  },
  type: {
    type: String,
    enum: ['food', 'kitBag', 'certificate'],
    required: true
  },
  resourceId: {
    type: String,
    required: true
  },
  issuedAt: {
    type: Date,
    default: Date.now
  },
  issuedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isVoid: {
    type: Boolean,
    default: false
  },
  voidedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  voidedAt: Date,
  notes: String,
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

**Key Methods:**
- `void(userId, reason)`: Void resource usage with user ID and reason
- `isVoided()`: Check if resource usage is voided
- `getResourceDetails()`: Get specific details based on resource type
- `formatForDisplay()`: Format resource for display in UI

### ResourceSetting Model (ResourceSetting.js)
```javascript
const resourceSettingSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  type: {
    type: String,
    enum: ['food', 'kitBag', 'certificate', 'certificatePrinting'],
    required: true
  },
  isEnabled: {
    type: Boolean,
    default: true
  },
  settings: {
    type: Object,
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
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

**Key Methods:**
- `getTypedSettings()`: Get settings for specific resource type
- `updateSettings(newSettings, userId)`: Update settings with user tracking
- `isValid()`: Validate settings against type-specific schema

### BadgeTemplate Model (BadgeTemplate.js)
```javascript
const badgeTemplateSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Template name is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  templateData: {
    type: Object,
    required: true
  },
  isDefault: {
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

**Key Methods:**
- `setAsDefault()`: Set this template as the default for the event
- `renderHtml(registrationData)`: Generate HTML for badge using registration data
- `duplicate(newName)`: Create a copy of the template with a new name
- `getElements()`: Get all elements from template data

### Certificate Model (Certificate.js)
```javascript
const certificateSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  registration: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Registration',
    required: true
  },
  type: {
    type: String,
    required: true
  },
  certificateNumber: {
    type: String,
    required: true
  },
  issuedAt: {
    type: Date,
    default: Date.now
  },
  issuedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  fileUrl: String,
  emailSent: {
    type: Boolean,
    default: false
  },
  emailSentAt: Date,
  isVoid: {
    type: Boolean,
    default: false
  },
  voidedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  voidedAt: Date,
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

**Key Methods:**
- `generatePdf()`: Generate PDF file for certificate
- `sendByEmail()`: Send certificate to registrant's email
- `void(userId, reason)`: Void certificate with reason
- `regenerate()`: Create a new version of the certificate