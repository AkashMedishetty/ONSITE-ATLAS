# Onsite Atlas Project Issues

*Timestamp: March 26, 2023 - 14:30 UTC*

## API Integration Issues

1. **Mock Data Usage**
   - `client/src/pages/Events/categories/CategoriesTab.jsx` uses extensive mock data instead of real API calls:
     - Uses mockCategories, mockRegistrations, mockFoodSettings, mockKitSettings, and mockCertificateSettings
     - Simulates API calls with setTimeout
     - No actual API integration for CRUD operations
   - `client/src/pages/Events/EventPortal.jsx` statistics section uses hardcoded values
   - `client/src/pages/Dashboard.jsx` uses sample data rather than actual API integration
   - `client/src/pages/Timeline.jsx` implements visualization with hardcoded event data
   - `client/src/pages/Registration/BulkImport.jsx` uses mock validation instead of API calls
   - `client/src/pages/Resources/ResourceList.jsx` has commented out API calls, using static data

2. **Environment Variable References**
   - Multiple service files incorrectly use `process.env` instead of Vite's `import.meta.env`:
     - `client/src/services/abstractService.js` (line 5)
     - `client/src/services/categoryService.js` (line 12)
     - `client/src/services/registrationService.js` (line 8)
     - `client/src/services/resourceService.js` (line 7)
     - `client/src/services/eventService.js` (several instances)

3. **Inconsistent API Response Handling**
   - `client/src/services/eventService.js` returns `{ success: false, message: error.message }`
   - `client/src/services/registrationService.js` throws errors directly
   - `client/src/services/abstractService.js` returns `{ error: error.message }`
   - `client/src/services/resourceService.js` has mixed error handling patterns
   - No standardized error handling approach across services

4. **Mixed API URL Formats**
   - Some endpoints use `/api/events/:id/resources` format
   - Others use `/api/resources?eventId=:id` format
   - Inconsistent between service implementations and API controller expectations
   - Resource endpoints particularly problematic with inconsistent URL structures

5. **Missing API Implementations**
   - Several backend routes defined in `server/src/routes` lack controller implementations
   - Some API endpoints referenced in frontend don't exist in backend routes
   - Abstract download endpoint referenced but not implemented
   - Badge template endpoints inconsistent between frontend and backend

## Component Implementation Issues

1. **Placeholder Functions**
   - `client/src/pages/Events/categories/CategoriesTab.jsx`:
     - `handleDeleteCategory()` logs but doesn't call an API
     - `handleExportRegistrations()` only logs "Exporting registrations data"
     - `handleSaveConfig()` only logs "Category configuration saved successfully"
     - Checkboxes in the config modal have no onChange handlers
   - `client/src/pages/Resources/ResourceConfiguration.jsx`:
     - Form submission handlers don't make actual API calls
     - Save functions log success but don't persist changes
   - `client/src/pages/BadgePrinting/BadgeDesigner.jsx`:
     - Design save function is a placeholder
     - Print function doesn't integrate with any printing API

2. **Missing/Incomplete Components**
   - `client/src/pages/Resources/CertificateIssuance.jsx` lacks implementation 
   - `client/src/pages/Events/badges/BadgeDesignerTab.jsx` is referenced but not fully implemented
   - `client/src/pages/Resources/ResourceConfiguration.jsx` lacks proper API integration
   - `client/src/pages/Settings/UserManagement.jsx` has UI but no backend connectivity
   - `client/src/pages/Reports/ReportBuilder.jsx` is mostly placeholder UI

3. **Component Props Issues**
   - `client/src/components/common/Table.jsx` doesn't properly validate column configurations
   - `client/src/components/common/Modal.jsx` has inconsistent usage of onClose vs onCancel props
   - `client/src/components/common/Select.jsx` doesn't handle disabled state properly
   - `client/src/components/common/Input.jsx` inconsistent handling of validation errors
   - `client/src/components/common/Tabs.jsx` doesn't maintain state between renders

4. **Import Issues**
   - Circular dependencies between components in `client/src/components/layout`
   - Missing exports in `client/src/components/common/index.js`
   - Import paths use inconsistent patterns (relative vs absolute)
   - Unused imports in multiple components
   - Importing entire libraries instead of specific components (e.g., importing all of Framer Motion)

5. **Duplicate Components**
   - Multiple button implementations across the codebase
   - Separate modal implementations instead of using the common component
   - Repeated form validation logic instead of using a shared utility
   - Duplicate table implementation in ResourceList and AbstractList

## UI/UX Issues

1. **Loading States**
   - `client/src/pages/Events/EventPortal.jsx` lacks consistent loading indicators
   - `client/src/pages/Resources/ResourceList.jsx` doesn't show loading state during data refresh
   - `client/src/pages/Abstracts/AbstractDetail.jsx` has incomplete loading state handling
   - `client/src/pages/Registration/RegistrationList.jsx` doesn't indicate loading during filtering
   - Initial data loading not visually indicated in many components

2. **Error Handling Display**
   - `client/src/pages/Registration/RegistrationForm.jsx` doesn't display field-specific errors
   - `client/src/pages/Events/EventSettings.jsx` silently fails on API errors
   - `client/src/pages/Resources/KitBagDistribution.jsx` has incomplete error handling UI
   - Global error handling is inconsistent
   - No retry mechanisms for failed API calls

3. **Tab Navigation**
   - `client/src/pages/Events/EventPortal.jsx` doesn't maintain tab state on page refresh
   - `client/src/pages/Events/EventSettings.jsx` resets tab selection after save operations
   - URL parameters don't sync with active tab state
   - Deep linking to specific tabs doesn't work
   - Inconsistent tab implementation between components

4. **Responsive Design Issues**
   - `client/src/pages/BadgePrinting/BadgeDesigner.jsx` has fixed width elements breaking mobile layout
   - Tables throughout the application lack proper responsive handling
   - Side navigation in `client/src/components/layout/DashboardLayout.jsx` doesn't collapse properly on small screens
   - Form layouts break on mobile views
   - No mobile-specific optimizations for scanner interfaces

5. **Accessibility Issues**
   - Missing aria attributes on interactive elements
   - Color contrast issues in `client/src/components/common/Alert.jsx`
   - Form inputs lack proper labeling in multiple components
   - No keyboard navigation support in complex interfaces
   - Missing focus indicators

## Data Structure Issues

1. **Inconsistent Data Models**
   - Event object structure varies between components
   - Registration data has different formats in list vs detail views
   - Resource tracking uses different field names in frontend vs backend
   - Categories have inconsistent property naming
   - Date fields use different formats across the application

2. **Frontend-Backend Schema Mismatches**
   - `server/src/models/Category.js` uses camelCase while API responses use snake_case
   - `client/src/services/registrationService.js` expects different field names than provided by API
   - Date formats inconsistent between frontend display and backend storage
   - Nested object structures don't match between frontend expectations and backend responses
   - ID field naming inconsistent (_id vs id)

3. **QR Code Implementation Issues**
   - `client/src/components/common/QRCodeGenerator.jsx` doesn't handle errors properly
   - `client/src/pages/Resources/ScannerStation.jsx` has camera initialization problems
   - QR code format inconsistent between generation and scanning components
   - No error recovery for scanning failures
   - Scanner doesn't work on some mobile devices

4. **Data Transformation Issues**
   - Missing data transformation for backend to frontend in several services
   - Datetime handling inconsistent across components
   - Number formatting varies between components
   - No standardized approach to data normalization
   - Inconsistent handling of null/undefined values

## Performance Issues

1. **Render Efficiency**
   - `client/src/pages/Events/EventPortal.jsx` renders child components unnecessarily
   - `client/src/pages/Registration/RegistrationList.jsx` renders full table without virtualization
   - `client/src/pages/BadgePrinting/BadgeDesigner.jsx` has performance issues with canvas rendering
   - Excessive re-renders due to missing memoization
   - State updates trigger complete re-renders instead of partial updates

2. **API Call Optimization**
   - Multiple redundant API calls in `client/src/pages/Events/EventPortal.jsx`
   - `client/src/pages/Resources/FoodTracking.jsx` makes separate calls for data that could be combined
   - No caching implementation for frequently accessed reference data
   - Missing debounce on search inputs causing excessive API calls
   - No batch processing for bulk operations

3. **Bundle Size Issues**
   - Large dependencies imported in full rather than using tree-shaking
   - Unused component imports throughout the application
   - SVG icons imported as full files rather than optimized
   - No code splitting implemented
   - Large CSS frameworks imported in their entirety

4. **State Management**
   - Prop drilling in several component hierarchies
   - Excessive useState hooks in `client/src/pages/Registration/BulkImport.jsx`
   - Context API used inefficiently in `client/src/contexts/EventContext.jsx`
   - No global state management for shared data
   - Redundant state calculations across components

## Configuration and Build Issues

1. **Environment Configuration**
   - `.env` files contain hardcoded values instead of placeholders
   - Production build not properly configured for API base URL
   - Missing environment validation on application startup
   - No separate development/staging/production configurations
   - Sensitive information in environment files

2. **Build Process**
   - `client/vite.config.js` missing optimization settings
   - No code splitting configuration
   - Development and production builds use same settings
   - No bundle analyzer integration
   - Missing source maps configuration for production debugging

3. **Package Dependencies**
   - Outdated packages with known issues
   - Duplicate dependencies with different versions
   - Missing peer dependencies in `client/package.json`
   - Unused dependencies increasing bundle size
   - Missing types for TypeScript dependencies

## Code Quality Issues

1. **Console Logs**
   - Numerous console.log statements left in production code
   - Debugging code comments throughout components
   - Alert and confirmation dialogs used for debugging
   - Commented out code blocks that should be removed
   - Development debug flags left enabled

2. **Code Structure**
   - Overly large component files (EventPortal.jsx is over 1000 lines)
   - Mixed concerns in components (UI, data fetching, business logic)
   - Inconsistent naming conventions between files and components
   - Lack of code organization in larger components
   - Duplicated utility functions

3. **Documentation**
   - Missing or outdated JSDoc comments
   - Inconsistent commenting style
   - README files with outdated information
   - No component API documentation
   - Missing inline documentation for complex logic

---

*Note: Due to technical limitations in accessing the complete codebase, this analysis may not cover all issues. A more comprehensive analysis would require direct access to all source files.* 