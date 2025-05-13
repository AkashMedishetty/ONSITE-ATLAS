# Abstract Management and Review System Documentation

## 1. Overview

This document details the architecture, workflow, and components of the Abstract Management and Review System. It is designed to handle abstract submissions by registrants/authors, review by assigned reviewers, and management by event administrators or staff.

The system focuses on a consistent and secure API interaction model, primarily using two main Axios instances on the frontend for different authentication contexts: a main `api` instance for general authenticated users (admins, staff, reviewers) and an `apiRegistrant` instance for actions performed by event registrants (authors).

## 2. Core Workflows

### 2.1. Abstract Submission Workflow (Author/Registrant)

1.  **Access Portal**: Authors access the submission form via a public portal (`/portal/abstract/:eventId`) or their dedicated registrant portal.
2.  **Fill Form**: Provide title, author details, content, topic, category, and optionally upload an attachment file.
3.  **Submit**:
    *   File (if any) is uploaded via `abstractService.uploadAbstractFile` (uses `apiRegistrant`).
    *   Form data is submitted via `abstractService.createAbstract` (uses `apiRegistrant`).
    *   Email notification sent to author upon successful submission (if enabled).
4.  **Feedback**: UI shows success/error.
5.  **Revision (if requested)**:
    *   Author receives email notification about revision request.
    *   Author accesses their abstract (likely via registrant portal).
    *   Author makes changes and uploads a new file if necessary.
    *   Author resubmits using `abstractService.resubmitRevisedAbstract` (uses `apiRegistrant`).
    *   Status changes to `revised-pending-review`.
    *   Email notification sent to assigned reviewer(s) upon resubmission (if enabled).

### 2.2. Abstract Management Workflow (Admin/Staff)

1.  **Access Dashboard**: Admin/Staff log in and navigate to the event's portal (e.g., `EventPortal.jsx`), which may include an `AbstractManagementDashboard.jsx` or an "Abstracts" tab.
    *   The Event Portal dashboard now also shows a quick link to the "Reviewer Portal" (`/portal/reviewer/:eventId`).
2.  **View Abstracts**: All abstracts for the event are listed, fetched by `abstractService.getAbstractsByEvent` (uses `api`). Can also fetch abstracts for a specific user via `abstractService.getAbstractsByRegistration`.
3.  **Assign Reviewers**:
    *   Admin selects one or more abstracts from the list in the "Abstracts" tab of the `EventPortal.jsx`.
    *   Admin clicks the "Assign Reviewer(s)" button that appears in the bulk action bar.
    *   A modal opens, listing available reviewers for the event (fetched via `eventService.getEventReviewers`).
    *   Admin selects desired reviewers from the modal (e.g., using checkboxes).
    *   Upon confirmation, `abstractService.assignReviewers` is called (uses `api`), which communicates with the backend endpoint `POST /api/events/:eventId/abstracts/assign-reviewers`.
    *   The backend assigns the selected reviewers to all selected abstracts. Abstract statuses are updated to `under-review`.
    *   Email notifications are potentially sent to assigned reviewer(s) (if enabled and handled by backend logic).
4.  **Make Final Decisions**: After reviews, admin can Approve, Reject, or Request Revision using respective functions in `abstractService` (all via `api`).
    *   `approveAbstract`: Changes status to `approved`. Sends email notification to author (if enabled).
    *   `rejectAbstract`: Changes status to `rejected`. Sends email notification to author (if enabled).
    *   `requestRevision`: Changes status to `revision-requested`. Sends email notification to author with reason and deadline (if enabled).

### 2.3. Review Process Workflow (Reviewer)

1.  **Login**: Reviewers log in via `ReviewerLoginPage.jsx` (standard auth; role check on client).
2.  **Receive Assignment Notification**: Reviewer receives an email when assigned a new abstract or when a revised abstract they were assigned is resubmitted.
3.  **View Dashboard**: `ReviewerDashboardPage.jsx` calls `reviewerService.getAssignedAbstracts` (uses `api`) to list their assigned abstracts (status `under-review` or `revised-pending-review`).
    *   **[2024-06-09]** Each abstract now includes its category name, as the backend populates the `category` field for reviewer-assigned abstracts.
4.  **Review Abstract**:
    *   Selects abstract, navigating to `ReviewerAbstractReviewPage.jsx`.
    *   Abstract details are fetched via `abstractService.getAbstractById` (uses `api`).
    *   Attached files downloaded via `abstractService.downloadAbstractAttachment` (uses `api`).
    *   Review (score, comments, decision) submitted via `abstractService.submitIndividualReview` (uses `api`).
    *   Admin may be notified of review submission (if enabled).

## 3. File Structure (Key Components)

```
client/
├── src/
│   ├── components/
│   │   ├── Abstracts/            # UI components specific to abstracts (e.g., forms, list items)
│   │   └── common/               # General reusable UI components (Button, Card, Spinner, etc.)
│   ├── contexts/
│   │   └── AuthContext.js        # Handles user authentication state and login logic
│   ├── pages/
│   │   ├── Abstracts/            # Admin/general user views for abstracts (details, listing)
│   │   │   ├── AbstractDetail.jsx
│   │   │   └── ...
│   │   ├── AbstractManagement/   # Admin dashboard for managing abstracts
│   │   │   └── AbstractManagementDashboard.jsx
│   │   ├── PublicPortals/
│   │   │   └── AbstractPortal.jsx  # Public abstract submission page
│   │   ├── RegistrantPortal/     # Pages for logged-in registrants (abstract submission/management)
│   │   │   └── ...
│   │   └── ReviewerPortal/
│   │       ├── ReviewerLoginPage.jsx
│   │       ├── ReviewerDashboardPage.jsx
│   │       └── ReviewerAbstractReviewPage.jsx
│   ├── services/
│   │   ├── api.js                # Main Axios instance (for admin, staff, reviewer tokens)
│   │   ├── apiRegistrant.js      # Axios instance for registrant-specific tokens
│   │   ├── abstractService.js    # Service for all abstract-related operations
│   │   ├── reviewerService.js    # Service for reviewer-specific operations
│   │   └── abstractSettingsService.js # Service for abstract settings & reviewer lists
│   ├── utils/
│   │   └── authUtils.js          # Utilities for auth headers (getAuthHeader, getRegistrantAuthHeader)
│   └── App.jsx                 # Main app component, router setup
│
server/
├── src/
│   ├── config/
│   │   ├── config.js             # General app configuration
│   │   └── logger.js             # Logging utility
│   ├── controllers/
│   │   ├── abstract.controller.js  # Logic for abstract CRUD, review submission, file ops, decisions
│   │   ├── event.controller.js     # Logic for event CRUD, includes getEventReviewers
│   │   └── user.controller.js      # Logic for user CRUD, includes getAssignedAbstractsForReviewer
│   ├── middleware/
│   │   ├── auth.middleware.js    # Protect routes, user role checks (protect, restrict)
│   │   └── error.js              # Error handling middleware
│   ├── models/
│   │   ├── Abstract.js           # Mongoose schema for Abstracts
│   │   ├── Event.js              # Mongoose schema for Events (contains abstractSettings)
│   │   ├── User.js               # Mongoose schema for Users (role includes 'reviewer')
│   │   └── Registration.js       # Mongoose schema for Registrations
│   ├── routes/
│   │   ├── index.js              # Main router, aggregates all other route files
│   │   ├── abstract.routes.js    # API routes specific to abstract operations
│   │   ├── event.routes.js       # API routes for events, includes abstract settings & reviewer list routes
│   │   └── user.routes.js        # API routes for users, includes fetching assigned abstracts for reviewer
│   ├── uploads/                  # Default directory for storing uploaded files
│   │   └── abstracts/            # Stores uploaded abstract attachments
│   └── app.js                  # Express app setup, middleware (CORS, helmet, etc.), route mounting
```

## 4. Backend System

### 4.1. Models

#### 4.1.1. `Abstract.js` (Mongoose Schema)
*   **Key Fields:**
    *   `event`: ObjectId (ref: 'Event') - Associated event.
    *   `registration`: ObjectId (ref: 'Registration') - Submitting registrant.
    *   `title`: String - Abstract title.
    *   `authors`: String - Author names.
    *   `authorAffiliations`: String.
    *   `category`: ObjectId (ref: 'Category').
    *   `topic`: String.
    *   `content`: String - Main abstract text.
    *   `wordCount`: Number.
    *   `fileUrl`: String - Relative path to the uploaded attachment (e.g., `/uploads/abstracts/EVENT_ID/abstract_ID_timestamp.ext`).
    *   `fileName`: String - Original uploaded name of the attachment.
    *   `fileSize`: Number - Size of the attachment in bytes.
    *   `fileType`: String - Extension of the attachment (e.g., 'pdf', 'docx').
    *   `submissionDate`: Date.
    *   `status`: String (enum: 'draft', 'submitted', 'under-review', 'approved', 'rejected', 'revision-requested', 'pending', 'accepted', 'revised-pending-review'). The 'revised-pending-review' status indicates an author has resubmitted after a revision request.
    *   `reviewDetails`: Object
        *   `assignedTo`: [ObjectId (ref: 'User')] - Array of user IDs assigned as reviewers. (Method `assignReviewers` on model handles population)
        *   `reviews`: Array of review sub-documents:
            *   `reviewer`: ObjectId (ref: 'User').
            *   `score`: Number.
            *   `comments`: String.
            *   `decision`: String (enum: 'accept', 'reject', 'revise', 'undecided').
            *   `isComplete`: Boolean.
            *   `reviewedAt`: Date.
        *   `finalDecision`: String (enum: 'accepted', 'rejected', 'revision-requested', 'pending').
        *   `decisionReason`: String.
        *   `revisionDeadline`: Date (Set when revision is requested).
    *   ... (other fields like `submissionPath`, `submissionType`, `keywords`, `customFields`)
*   **Timestamps:** `createdAt`, `updatedAt`.
*   **Methods**:
    *   `assignReviewers(reviewerIds)`: Instance method to assign an array of reviewer IDs to the abstract and save. Used by the bulk assignment controller.

#### 4.1.2. `Event.js` (Mongoose Schema - Relevant Parts)
*   **Key Fields:**
    *   `name`: String.
    *   `abstractSettings`: Object - Configuration for abstract submissions for this event.
        *   `enabled`: Boolean.
        *   `isOpen`: Boolean.
        *   `deadline`: Date.
        *   `maxLength`: Number (word count).
        *   `allowEditing`: Boolean.
        *   `allowEditingAfterSubmission`: Boolean (Controls if authors can edit 'submitted' abstracts before review).
        *   `fileUploadRequired`: Boolean (Consider adding).
        *   `maxFileSizeMB`: Number (Used for server-side validation during upload).
        *   `allowedFileTypes`: [String] (e.g., ['.pdf', '.docx']) (Used for server-side validation).
    *   `emailSettings`: Object (Defines master email sending toggle and specific notification toggles)
        *   `enabled`: Boolean (Master switch for all event-related emails).
        *   `senderName`: String.
        *   `senderEmail`: String.
        *   `automaticEmails`: Object (Contains flags for specific notifications)
            *   `abstractSubmissionConfirmationToAuthor`: Boolean
            *   `abstractAssignmentToReviewer`: Boolean
            *   `abstractRevisionRequestToAuthor`: Boolean
            *   `abstractResubmissionToReviewer`: Boolean
            *   `abstractDecisionToAuthor`: Boolean (Covers approve/reject)
            *   `reviewSubmittedNotificationToAdmin`: Boolean
    *   ... (other event fields)

#### 4.1.3. `User.js` (Mongoose Schema - Relevant Parts)
*   **Key Fields:**
    *   `name`: String.
    *   `email`: String (unique).
    *   `password`: String.
    *   `role`: String (enum includes 'admin', 'staff', 'user', 'reviewer').
    *   `assignedAbstractsCount`: Number (default: 0) - Hypothetical field to count abstracts assigned for review (used in transactional example).
    *   ... (other user fields)

### 4.2. API Routes & Controllers

#### 4.2.1. Abstract Routes (`server/src/routes/abstracts.routes.js` -> `abstract.controller.js`)
*(Note: These are typically mounted under `/api/events/:eventId/abstracts` or `/api/abstracts`)*

*   **`POST /` or `/events/:eventId/abstracts`**: `createAbstract`
    *   Creates a new abstract. Requires registrant authentication.
*   **`GET /events/:eventId/abstracts/all-event-abstracts`**: `getAbstracts` (admin/staff version)
    *   Fetches all abstracts for an event. Requires admin/staff/reviewer auth.
*   **`GET /events/:eventId/abstracts/by-registration/:registrationId`**: `getAbstractsByRegistration` (NEW)
    *   Fetches all abstracts for a specific registration ID within an event. Primarily for admin/staff lookup. Requires admin/staff auth.
*   **`GET /events/:eventId/abstracts/:id`**: `getAbstract`
    *   Fetches a single abstract by its ID. Requires auth (owner or admin/staff/reviewer).
*   **`PUT /events/:eventId/abstracts/:id`**: `updateAbstract`
    *   Updates an abstract. Requires auth (owner in editable status, or admin/staff).
*   **`DELETE /events/:eventId/abstracts/:id`**: `deleteAbstract`
    *   Deletes an abstract. Requires auth (owner or admin/staff). Includes logic for physical file deletion.
*   **`POST /events/:eventId/abstracts/:id/file`**: `uploadAbstractFile`
    *   Uploads/replaces an attachment for an abstract. Requires registrant (in editable status) or admin/staff auth. Handles deletion of old file.
*   **`GET /events/:eventId/abstracts/:id/download-attachment`**: `downloadAbstractAttachment`
    *   Downloads the attached file for an abstract. Requires auth.
*   **`POST /events/:eventId/abstracts/assign-reviewers`**: `assignReviewersToAbstracts` (NEW)
    *   Assigns multiple reviewers (by `reviewerIds` in body) to multiple abstracts (by `abstractIds` in body). Updates abstract statuses to 'under-review'. Requires admin/staff auth.
*   **`POST /events/:eventId/abstracts/:id/review`**: `submitIndividualReview` (Controller name, might be `submitReview` in service)
    *   Allows an assigned reviewer to submit their review. Requires reviewer auth. May notify admin.
*   **`PUT /events/:eventId/abstracts/:id/status`**: `updateAbstractStatus`
    *   General endpoint for admins to update abstract status. (Specific decision routes like approve/reject are preferred for workflow actions). Requires admin/staff auth.
*   **`PUT /events/:eventId/abstracts/:id/approve`**: `approveAbstract` (Changed from POST to PUT for idempotency)
    *   Admin action to approve an abstract. Updates status and logs decision. Sends email to author. Requires admin/staff auth.
*   **`PUT /events/:eventId/abstracts/:id/reject`**: `rejectAbstract` (Changed from POST to PUT)
    *   Admin action to reject an abstract. Updates status and logs decision. Sends email to author. Requires admin/staff auth.
*   **`PUT /events/:eventId/abstracts/:id/request-revision`**: `requestRevision` (Changed from POST to PUT)
    *   Admin action to request revision. Updates status, logs decision, sets revision deadline. Sends email to author. Requires admin/staff auth.
*   **`POST /events/:eventId/abstracts/:id/resubmit-revision`**: `resubmitRevisedAbstract` (NEW)
    *   Author action to resubmit an abstract after revision request. Updates status to 'revised-pending-review'. Sends email to assigned reviewer(s). Requires registrant owner auth.
*   **`GET /events/:eventId/abstracts/pending-reviews`**: `getPendingReviews` (Controller/method might exist in `Abstract.statics` or controller)
    *   Fetches abstracts pending review. Requires admin/staff/reviewer auth.
*   **`GET /events/:eventId/abstracts/my-reviews`**: `getMyAssignedReviews` (Controller/method might exist in `Abstract.statics` or controller)
    *   Fetches abstracts assigned to current reviewer. Requires reviewer auth.
*   **`GET /events/:eventId/abstracts/statistics`**: `getAbstractStatistics`
    *   Fetches statistics about abstracts for an event. Requires admin/staff auth.
*   **`GET /events/:eventId/abstracts/review-statistics`**: `getStatistics` (for reviews) - (Endpoint may need renaming for clarity or be part of general stats)
    *   Fetches review-specific statistics. Requires admin/staff auth.
*   **`POST /events/:eventId/abstracts/auto-assign-reviewers`**: `autoAssignReviewers`
    *   (Future/Hypothetical) Auto-assigns reviewers. Requires admin/staff auth.
*   **`POST /events/:eventId/abstracts/validate-registration`**: `validateRegistrationId` (Controller might need to be created/verified, or handled client-side/during creation)
    *   Validates a registration ID for abstract submission.
*   **`POST /events/:eventId/abstracts/assign-reviewer`**: `assignAbstractReviewer` (DEPRECATED or for single assignment - review if still needed)
    *   Assigns one or more reviewers (by `userIds` in body) to a *single* abstract. Updates abstract status to 'under-review'. Sends email to reviewer(s). Requires admin/staff auth.

#### 4.2.2. Event Routes (`server/src/routes/event.routes.js` -> `event.controller.js`)

*   **`GET /api/events/:eventId/abstract-workflow/reviewers`**: `getEventReviewers`
    *   Fetches users with the 'reviewer' role (or otherwise designated as reviewers for the event). Used by admin dashboard/abstracts tab to populate reviewer selection modal. Requires admin/staff auth.
*   **`GET /api/events/:eventId/abstractSettings`**: (Controller logic likely in `event.controller.js` or dedicated `abstractSettings.controller.js`)
    *   Fetches abstract settings for an event.
*   **`PUT /api/events/:eventId/abstractSettings`**: (Controller logic likely in `event.controller.js` or dedicated `abstractSettings.controller.js`)
    *   Updates abstract settings for an event.

#### 4.2.3. User Routes (`server/src/routes/user.routes.js` -> `user.controller.js`)

*   **`GET /api/users/me/reviewer/assigned-abstracts`**: `getAssignedAbstractsForReviewer`
    *   Fetches all abstracts assigned to the currently logged-in (via standard token) reviewer. Requires reviewer auth.

### 4.3. Authentication & Authorization

*   Standard user (admin, staff, reviewer) authentication relies on JWT tokens stored in `localStorage` (key: `'token'`) and handled by the `protect` middleware.
*   Registrant authentication relies on a separate JWT token stored in `localStorage` (key: `REGISTRANT_TOKEN_KEY`) and handled by middleware or specific logic within `apiRegistrant.js`.
*   Role-based access control is implemented using the `restrict` middleware (e.g., `restrict('admin', 'staff')`).

### 4.4. Key Backend Changes Made During Session:

1.  **Abstract Attachment Download Path Fix:** Corrected `physicalFilePath` in `abstract.controller.js#downloadAbstractAttachment`. The path now correctly includes the event ID subfolder: `/uploads/abstracts/EVENT_ID/filename.ext`.
2.  **CORS Configuration:** Added `Content-Disposition` to `exposedHeaders` in `server/src/app.js`.
3.  **Get Event Reviewers Endpoint:** Added `getEventReviewers` controller and `GET /api/events/:eventId/abstract-workflow/reviewers` route.
4.  **Assign Reviewer Controller Update:** Modified `abstract.controller.js#assignAbstractReviewer` to accept an array of `reviewerIds` and refactored to use MongoDB transactions for atomic updates. It also (hypothetically) updates a `assignedAbstractsCount` on the `User` model and sends email notifications *after* successful transaction commit.
5.  **Author Revision Workflow - Backend:**
    *   Added status `revised-pending-review` to `Abstract.js` model.
    *   Created `resubmitRevisedAbstract` controller in `abstract.controller.js` (changes status, notifies reviewers).
    *   Added route `POST /api/events/:eventId/abstracts/:id/resubmit-revision`.
6.  **Admin Decision Endpoints (Approve, Reject, Request Revision):** Updated to use PUT method. Implemented email notifications to authors.
7.  **`getAbstractsByRegistration` Endpoint:** Added controller and route for admins/staff to fetch abstracts by a specific registration ID for an event.
8.  **Bulk Reviewer Assignment Endpoint:**
    *   Added `assignReviewersToAbstracts` controller in `abstract.controller.js`.
    *   Added route `POST /api/events/:eventId/abstracts/assign-reviewers`. This controller uses the existing `Abstract.model.assignReviewers()` method and sets abstract status to 'under-review'.
9.  **[2024-06-09] Reviewer Abstracts Now Populate Category Name:**
    *   The backend now populates the `category` field (with its `name`) for each abstract assigned to a reviewer (see `getAssignedAbstractsForReviewer` in `user.controller.js`).
    *   This ensures the reviewer dashboard and review page can display the correct category name for each abstract.
10. **[2024-06-10] Backend Change: Abstract Submission Uniqueness Now Per Category**
    *   The backend now enforces that a registrant can only submit one abstract per (event, category) pair (not per topic).
    *   If a registrant attempts to submit another abstract for the same event and category, they will receive a 400 error: "You have already submitted an abstract for this category".
    *   This affects the POST `/api/events/:eventId/abstracts` endpoint and the reviewer/registrant workflow.

## 5. Frontend System

### 5.1. Main API Service Instances

*   **`client/src/services/api.js`**: Central Axios instance for admin, staff, and reviewer authenticated API calls. Uses a request interceptor to attach the token from `localStorage` (key: `'token'`).
*   **`client/src/services/apiRegistrant.js` (NEW)**: Dedicated Axios instance for registrant-specific authenticated API calls. Uses a request interceptor to attach the token using `getRegistrantAuthHeader()` (from `REGISTRANT_TOKEN_KEY` in `localStorage`).

### 5.2. Key Service Modules & Refactoring

*   **`client/src/services/reviewerService.js`:**
    *   `getAssignedAbstracts`: Refactored to use the main `api` instance.
*   **`client/src/services/abstractSettingsService.js`:**
    *   `getSettings`, `updateSettings`, `getReviewers`: All refactored to use the main `api` instance.
*   **`client/src/services/abstractService.js`:**
    *   **Refactored to use `api` (standard auth):** `getAbstractById`, `updateAbstract`, `updateAbstractStatus`, `downloadAbstracts`, `addReviewComment`, `getAbstractsByRegistration` (admin lookup), `getAbstractsByEvent`, `getAbstractStatistics`, `exportAbstracts`, `validateRegistrationId`, `getPendingReviews`, `getMyAssignedReviews`, `getStatistics` (for reviews), `assignReviewers`, `submitReview`, `approveAbstract`, `rejectAbstract`, `requestRevision`, `downloadAbstractAttachment`, `assignReviewersToAbstracts` (NEW - for bulk assignment).
    *   **Refactored to use `apiRegistrant` (registrant auth):** `getAbstracts` (registrant list), `createAbstract`, `deleteAbstract` (registrant own), `uploadAbstractFile`, `uploadAbstractAttachment`, `uploadAttachment`.
    *   This significantly improves authentication consistency.
*   **`client/src/services/eventService.js`:**
    *   Added `getEventReviewers` function to fetch users suitable for reviewing abstracts for a specific event, calling `GET /api/events/:eventId/abstract-workflow/reviewers`.

### 5.3. Key UI Components & Changes

*   **`client/src/pages/AbstractManagement/AbstractManagementDashboard.jsx`:**
    *   Refactored all direct `axios` calls to use functions from `abstractService.js` or `abstractSettingsService.js`.
    *   Now correctly fetches reviewers using `abstractSettingsService.getReviewers`.
    *   Assigns reviewers using `abstractService.assignReviewers`.
    *   Handles decisions (approve, reject, request revision) via respective `abstractService` methods.
*   **`client/src/pages/ReviewerPortal/ReviewerAbstractReviewPage.jsx`:**
    *   **File Download Fix:** Replaced direct `<a>` tag download with a `handleDownloadAttachedFile` function that calls `abstractService.downloadAbstractAttachment`.
*   **`client/src/pages/Events/EventPortal.jsx`:**
    *   The dashboard section (within `renderDashboard`) now includes a "Reviewer Portal" link in the "External Portals" card.
*   **`client/src/pages/Events/abstracts/AbstractsTab.jsx`:**
    *   Added "Assign Reviewer(s)" button to the bulk action bar.
    *   Implemented a modal for assigning reviewers:
        *   Fetches available reviewers for the event using `eventService.getEventReviewers`.
        *   Allows selection of multiple reviewers.
        *   On confirmation, calls `abstractService.assignReviewersToAbstracts` to perform bulk assignment.
        *   Provides UI feedback (loading states, toasts for success/error).

### 5.4. Key Frontend Changes Made During Session (NEW or to be added):
1.  **Reviewer Assignment UI in `AbstractsTab.jsx`:**
    *   Added "Assign Reviewer(s)" button.
    *   Implemented modal to fetch (via `eventService.getEventReviewers`) and select reviewers.
    *   Integrated `abstractService.assignReviewersToAbstracts` for backend communication.
    *   Added toast notifications for user feedback.
2.  **[2024-06-09] Reviewer Dashboard Displays Category Name:**
    *   The reviewer dashboard (`ReviewerDashboardPage.jsx`) now displays the category name for each assigned abstract, if available.
    *   This is possible because the backend now populates the `category` field for reviewer-assigned abstracts.
3.  **[2024-06-10] Frontend Change: Abstract Submission Uniqueness Per Category**
    *   The abstract submission form now checks, before submitting, if the registrant has already submitted an abstract for the selected category in the current event.
    *   If so, the user is shown an error and cannot submit another abstract for the same category.
    *   This matches the backend rule: only one abstract per (event, category) per registrant.

## 6. Outstanding Issues & Future Considerations

1.  **Physical File Deletion (Further Review):** While `