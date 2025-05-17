# Announcements Feature Overview

This document provides a summary of the "Announcements" feature implementation within the event management system.

## 1. Purpose

The Announcements feature allows event administrators to create, manage, and display important updates or messages to event registrants. These announcements can be time-sensitive (with optional deadlines) and are displayed on the registrant's dashboard.

## 2. Directory Structure & Key Files

### Backend (`server/src/`)
- **Model:** `models/Announcement.js`
- **Controller:** `controllers/announcementController.js`
- **Routes:** `routes/announcementRoutes.js`
- **Main Server File (for mounting routes):** `index.js`
- **Modified Controller (for registrant dashboard):** `controllers/registrantPortalController.js`

### Frontend (`client/src/`)
- **Service:** `services/announcementService.js`
- **Admin Portal UI:**
    - `pages/Events/EventPortal.jsx` (Modified to include Announcements tab)
    - `pages/Events/announcements/AnnouncementsTab.jsx` (New component for managing announcements)
- **Registrant Portal UI:**
    - `pages/RegistrantPortal/RegistrantDashboard.jsx` (Modified to display announcements)

## 3. Backend Implementation (Phase 1 - Completed)

### 3.1. `Announcement.js` (Model)
- **Fields:**
    - `eventId` (ObjectId, ref: 'Event', required)
    - `title` (String, required, trim)
    - `content` (String, required)
    - `deadline` (Date, optional)
    - `isActive` (Boolean, default: `true`)
    - `postedBy` (ObjectId, ref: 'User', required)
    - `timestamps` (createdAt, updatedAt)
- **Index:** Compound index on `eventId`, `isActive`, and `createdAt` for efficient querying.
- **Swagger Documentation:** Added for the model schema.
- *Review:* The model is well-defined, capturing essential information. The `eventId` ensures announcements are event-specific, which is crucial for the multi-tenant architecture.

### 3.2. `announcementController.js` (Controller)
- **`createAnnouncement`:**
    - **Input:** `eventId`, `title`, `content`, `deadline`, `isActive` (from request body).
    - `postedBy` is derived from the authenticated user (`req.user.id`).
    - **Logic:** Validates `eventId` existence, creates and saves the new announcement.
    - **Output:** Returns 201 status with the created announcement data.
    - *Review:* Good use of `req.user.id` for `postedBy`. `eventId` validation is important.
- **`getAnnouncementsByEvent`:**
    - **Input:** `eventId` (from params), `isActive`, `limit`, `page` (from query).
    - **Logic:** Validates `eventId`, filters by `isActive` (if provided), implements basic pagination, populates `postedBy` (name, email), and sorts by `createdAt` descending.
    - **Output:** Returns 200 status with count, total, pagination info, and announcement data.
    - *Review:* Efficiently fetches announcements for a specific event. Pagination and population are good practices.
- **Placeholders:** `getAnnouncementById`, `updateAnnouncement`, `deleteAnnouncement` were added.
- **Swagger Documentation:** Added for controller actions and associated routes.

### 3.3. `announcementRoutes.js` (Routes)
- Router created with `mergeParams: true` to correctly access `eventId` from the parent router.
- **`POST /events/:eventId/announcements`**:
    - Maps to `createAnnouncement`.
    - Protected by placeholder `protect` and `authorize('admin', 'event_staff')` middleware.
- **`GET /events/:eventId/announcements`**:
    - Maps to `getAnnouncementsByEvent`.
    - Protected by placeholder `protect` middleware (allows broader access, e.g., for registrants to view).
- **Placeholders:** Routes for single announcement operations (`/:announcementId`) were commented out.
- *Review:* Routes are event-specific. `mergeParams` is correctly used. Role-based authorization for creation is sensible.

### 3.4. `server/src/index.js` (Mounting Routes)
- `announcementRoutes` imported and mounted under `/api/events/:eventId/announcements`.
- *Review:* Standard and correct way to integrate new routes.

### 3.5. `registrantPortalController.js` (Update for Dashboard)
- **`getDashboardData` modified:**
    - Imports `Announcement` model.
    - Fetches up to 10 active announcements for the `queryEventId`, sorted by `createdAt` descending.
    - Populates `postedBy` with `name`.
    - Includes these announcements in the `data.announcements` array of the JSON response.
    - Added check for `eventId` from query vs. token.
- *Review:* This directly integrates announcements into the registrant's view, which is the end goal for this part of the feature.

## 4. Frontend - Event Portal (Admin Side - Phase 2 - Completed)

### 4.1. `announcementService.js` (Service)
- **Functions Created:**
    - `createAnnouncement(eventId, announcementData)`: `POST /events/:eventId/announcements`
    - `getAnnouncementsByEvent(eventId, params)`: `GET /events/:eventId/announcements`
    - Placeholders for `getAnnouncementById`, `updateAnnouncement`, `deleteAnnouncement` (noting route adjustments needed for event-specificity).
- Includes basic error handling and assumes a base `api` instance.
- *Review:* Provides a clear abstraction for API calls. The notes about future route adjustments for update/delete are important.

### 4.2. `EventPortal.jsx` (UI Integration)
- Imported `FiMegaphone` icon.
- Added "Announcements" to `eventNavItems`.
- `handleSectionNavigation` updated to navigate to `/events/:id/announcements`.
- `renderAllTabContents` updated to render `AnnouncementsTab` component, passing `eventId`.
- *Review:* Seamless integration into the existing event portal navigation.

### 4.3. `AnnouncementsTab.jsx` (Management Component)
- **State:** Manages `announcements`, `loading`, `error`, `showModal`, `isEditing`, `currentAnnouncement`, `formState`.
- **Data Fetching:** `useEffect` + `useCallback` for `fetchAnnouncements` (calls `announcementService.getAnnouncementsByEvent`).
- **UI:**
    - "Create New Announcement" button.
    - Table: Displays title, content snippet, deadline, status (Active/Inactive), posted by, created at, actions.
    - Action buttons: Edit, Toggle Active (placeholder), Delete (placeholder).
    - Loading, error, and no-data states.
- **Modal (Create/Edit):**
    - Form fields: Title, Content (using `SimpleRichTextEditor` placeholder), Deadline, IsActive.
    - `handleSubmit`: Calls `announcementService.createAnnouncement` or `announcementService.updateAnnouncement`.
        - **Important:** Logs a `TODO` and `console.warn` that `updateAnnouncement` currently uses a generic route (`/announcements/:announcementId`) and needs to be updated to an event-specific one (`/events/:eventId/announcements/:announcementId`).
    - Uses toasts for notifications.
- **Placeholder Functions:** `handleToggleActive` and `handleDelete` are placeholders, also noting the need for event-specific backend routes and service updates with `console.warn`.
- **Dependencies:** `react-bootstrap`, `react-icons/fa`, `toast`, `formatDate`.
- *Review:* A comprehensive component for announcement management. The placeholders and warnings about event-specific routes for update/delete are crucial and correctly identified as needing attention. The use of a `SimpleRichTextEditor` is a good starting point.

## 5. Frontend - Registrant Portal Display (Phase 3 - Completed)

### 5.1. `RegistrantDashboard.jsx`
- Imported `FaBullhorn` icon.
- `dashboardData` state initialized with `announcements: []`.
- `fetchDashboardData` updated to correctly assign `apiData.announcements || []`.
- **New "Latest Announcements" Card/Section:**
    - Renders if `announcements` array is not empty.
    - Displays title, content, "Posted by" metadata, and deadline (if present) for each announcement.
- Added new styles for the announcement card and its elements.
- *Review:* Effectively displays announcements to registrants, fulfilling a key requirement. The presentation is clear.

## 6. Thoughts, Comments & Overall Review

- **Well-Phased Implementation:** The feature has been broken down logically into backend, admin frontend, and registrant frontend phases.
- **Event-Specific Context:** The consistent use of `eventId` in backend models, controllers, and routes (especially for creation and listing) is critical for the multi-tenant architecture and has been handled well so far.
- **Clear TODOs:** The frontend `AnnouncementsTab.jsx` includes explicit `console.warn` messages and TODOs regarding the need to make update/delete operations (and their corresponding service calls and backend routes) fully event-specific (e.g., `/events/:eventId/announcements/:announcementId`). This is the most important next step for CRUD completion.
- **User Experience:**
    - Admin side: Provides a functional interface for creating and listing announcements.
    - Registrant side: Clearly presents announcements on the dashboard.
- **Code Structure:** New components and services are well-placed.
- **Swagger Documentation:** Initiated for backend, needs to be completed for new CRUD endpoints.

## 7. Next Steps: Refinements & Full CRUD (Phase 4 - To Do)

The immediate next steps involve completing the CRUD (Create, Read, Update, Delete) functionality:

1.  **Backend:**
    *   Implement controller methods in `announcementController.js`:
        *   `getAnnouncementById(req, res)`
        *   `updateAnnouncement(req, res)`
        *   `deleteAnnouncement(req, res)`
    *   Ensure these methods operate within the context of an `eventId` and `announcementId`.
    *   Define and protect routes in `announcementRoutes.js` for these actions:
        *   `GET /events/:eventId/announcements/:announcementId`
        *   `PUT /events/:eventId/announcements/:announcementId`
        *   `DELETE /events/:eventId/announcements/:announcementId`
    *   Update Swagger documentation for these new endpoints.

2.  **Frontend (`client/src/services/announcementService.js`):**
    *   Implement service functions:
        *   `getAnnouncementById(eventId, announcementId)`
        *   `updateAnnouncement(eventId, announcementId, updatedData)`
        *   `deleteAnnouncement(eventId, announcementId)`
    *   Ensure these functions call the new event-specific backend routes.

3.  **Frontend (`client/src/pages/Events/announcements/AnnouncementsTab.jsx`):**
    *   Update `handleSubmit` (for editing), `handleToggleActive`, and `handleDelete` to use the new event-specific service methods.
    *   Remove `console.warn` messages once updates are complete.
    *   Potentially add a "View" functionality if detailed view is needed beyond table, though edit modal might suffice.

This structured approach will ensure the Announcements feature is robust, secure, and aligns with the event-specific architecture of the application. 