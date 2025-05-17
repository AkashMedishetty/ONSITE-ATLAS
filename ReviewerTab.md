# Reviewer Tab Documentation

This document outlines the functionality and implementation details for the Reviewer Tab accessible at `http://localhost:5173/portal/reviewer/681adfda4f873eaa0c7cc89b?event=681adfda4f873eaa0c7cc89b`.

## Overview

[To be filled in with a general description of the Reviewer Tab's purpose and main features.]

### Mobile Friendliness

The Reviewer Tab is designed to be mobile-friendly. It utilizes Tailwind CSS, a utility-first CSS framework, which allows for responsive design. The layout components, such as `ReviewerPortalLayout.jsx`, use responsive classes (e.g., `container mx-auto`, `sm:p-6`, `lg:p-8`, `flex flex-col`) to adapt to various screen sizes, ensuring a good user experience on mobile devices.

## Components

[To be filled in with details about the UI components used in this tab.]

### Dashboard Organization (Tabbed Interface)

The Reviewer Dashboard (`ReviewerDashboardPage.jsx`) displays assigned abstracts using a nested tabbed interface for better organization.

**Main Tabs:**

1.  **Pending Review (Default Tab):**
    *   **Criteria:** Abstracts with `myReviewStatus` such as 'pending', 'not-reviewed', 'under-review', or no status set. This tab is intended for abstracts awaiting their initial review.
    *   **Purpose:** Shows abstracts awaiting the reviewer's first look.

2.  **Revisions:**
    *   **Purpose:** This main tab acts as a container for abstracts that are in any stage of the revision process (either awaiting author changes or awaiting the reviewer's re-assessment).
    *   **Badge Count:** Displays the total count of abstracts across both its sub-tabs, but *only if* there are abstracts in the "Re-Review" sub-category. If "Re-Review" is empty, this main tab shows no count.
    *   **Sub-Tabs (displayed when "Revisions" main tab is active):**
        *   **Awaiting Author (Default Sub-Tab):**
            *   **Criteria:** Abstracts for which the reviewer has set `myReviewStatus` to 'revision-requested' or 'revise'. These are abstracts that have been sent back to authors, and the reviewer is waiting for the author to make changes and resubmit.
            *   **Purpose:** Tracks abstracts currently with authors for revision. (This sub-tab does not display a count badge).
        *   **Re-Review:** (Formerly "Needs My Re-Review")
            *   **Criteria:** Abstracts that were previously sent for revision by the current reviewer, and the author has since updated and resubmitted the abstract. These are identified by a specific `myReviewStatus` like 'revised_awaiting_rereview' or 'resubmitted_for_review' (this relies on the backend setting such a status when an author resubmits a revision for this specific reviewer).
            *   **Purpose:** Shows abstracts that have been revised by authors and are now back in the reviewer's queue for a second assessment. (This sub-tab displays a count badge if it contains abstracts).

3.  **Review Completed:**
    *   **Criteria:** Abstracts for which the reviewer has made a final decision, i.e., `myReviewStatus` of 'accepted', 'approved', or 'rejected'.
    *   **Purpose:** Shows abstracts for which the reviewer has completed their part of the review process.

Each main tab button can display a count of abstracts it contains as a small circular badge, if the count is greater than zero (with the specific conditional logic for the "Revisions" tab mentioned above). 
Within the "Revisions" main tab, only the "Re-Review" sub-tab displays a badge count if it contains abstracts. The "Awaiting Author" sub-tab does not display a count.
Clicking a main tab changes the primary content area. If the "Revisions" main tab is selected, its sub-tabs become visible, allowing further filtering of the displayed abstracts.

### UI Enhancements (July 2024)
The Reviewer Dashboard UI in `ReviewerDashboardPage.jsx` has been significantly updated for a more modern and user-friendly experience:

*   **Overall Page Layout:**
    *   The page now has a light gray background (`bg-gray-50`) for better visual comfort.
    *   The main title "Reviewer Dashboard" is larger and styled for better prominence.
    *   Action buttons (Export CSV, Download ZIP, Logout) have updated styling including icons, rounded corners, shadows, and consistent hover/focus states.
*   **Tab Navigation:**
    *   Tab buttons have a new style: the active tab is indicated by a colored bottom border and bolder text (e.g., `border-indigo-600 text-indigo-700`).
    *   Inactive tabs have a transparent border that gains a gray border on hover, providing clear visual feedback.
    *   Circular badges for counts are consistently styled and positioned next to the tab title.
*   **Abstract Display:**
    *   Abstracts are now displayed as individual cards with shadows and rounded corners (`bg-white shadow-lg rounded-lg`), improving separation and focus.
    *   Each card has increased padding and a more refined internal layout for abstract details (title, category, event, submission date, status).
    *   The abstract title is larger and more prominent.
    *   The "View / Review" link at the bottom of each card is styled for better visibility and includes an arrow icon.
*   **Search Functionality:**
    *   The search bar is positioned to the right of the tabs, featuring a magnifying glass icon.
    *   It has rounded corners and clear focus styling, matching the overall aesthetic.
*   **Empty/Loading States:**
    *   Messages for "No abstracts assigned", "No results found" (during search), and error states have been restyled to be more visually appealing and informative, often using icons and card-like containers.

These changes aim to improve the clarity, usability, and visual appeal of the reviewer dashboard.

### Global Search Functionality

The Reviewer Dashboard (`ReviewerDashboardPage.jsx`) now includes a global search input field. This allows reviewers to quickly find specific abstracts.

*   **Location:** The search input is located on the same line as the tab navigation (Pending Review, Revision Requested, Review Completed), positioned to the right. It features a magnifying glass icon on the left side for better visual indication.
*   **Functionality:**
    *   The search is performed on the abstracts within the **currently active tab**.
    *   It filters abstracts by matching the search term (case-insensitive) against the `abstract.title`.
    *   As the reviewer types into the search field, the list of abstracts in the active tab updates dynamically.
*   **No Results:** If the search term does not match any abstracts in the current tab, a message like "No abstracts found matching "{searchTerm}" in the "{categoryTitle}" category." is displayed.

### Download Assigned Abstract Files (ZIP)

Reviewers can download a ZIP archive containing all supplementary files (e.g., PDFs, documents) associated with the abstracts assigned to them for the current event.

*   **Location:** A "Download Files (ZIP)" button, featuring a download icon, is located next to the "Logout" button on the dashboard.
*   **Functionality:**
    *   Clicking the button initiates the download process.
    *   The button will show a "Downloading..." state while the ZIP file is being prepared and downloaded.
    *   The feature relies on a backend endpoint to gather the assigned abstracts for the reviewer, collect their associated files, and package them into a ZIP archive.
    *   The button is disabled if there are no abstracts assigned to the reviewer or if another data loading process is active.
*   **Notifications:** Toast messages will indicate the success or failure of the download.

### Export Abstract Details (CSV)

Reviewers can also export the metadata of abstracts assigned to them into a CSV file. This includes details like titles, authors, submission dates, and their review statuses.

*   **Location:** An "Export Details (CSV)" button, featuring a document icon, is located next to the "Download Files (ZIP)" button on the dashboard.
*   **Functionality:**
    *   Clicking this button initiates the CSV export process.
    *   The button will show an "Exporting..." state while the CSV file is being generated and downloaded.
    *   This feature relies on a backend endpoint to gather the necessary abstract details for the reviewer, format them as CSV, and send the file.
    *   The button is disabled if there are no abstracts assigned or if another data loading/exporting process is active.
*   **Notifications:** Toast messages will indicate the success or failure of the CSV export.

## Data Flow

[To be filled in with an explanation of how data is fetched, displayed, and updated.]

### Abstract Review Navigation

When a reviewer is on the reviewer dashboard (`ReviewerDashboardPage.jsx`), they see a list of assigned abstracts. Each abstract in the list acts as a link.

1.  **Action**: The reviewer clicks on an abstract item, which includes the text "View / Review".
2.  **Routing**: This action triggers a navigation event via `react-router-dom`. The application navigates to a URL like `/reviewer/abstract/:abstractId/review`, where `:abstractId` is the unique identifier of the selected abstract. The `eventId` is also passed via route state.
3.  **Page Load**: The routing mechanism loads the `ReviewerAbstractReviewPage.jsx` component.
4.  **Functionality**: This page is responsible for fetching and displaying the full details of the selected abstract. It provides the interface for the reviewer to read the abstract content, download any attachments, and submit or update their review (scores, comments, decision).

## API Endpoints

[To be filled in with a list of relevant API endpoints and their usage.]

### Troubleshooting: Incorrect Redirect to Registrant Login

**Symptom:** When a logged-in reviewer clicks "View / Review" for an abstract, they are incorrectly redirected to the Registrant Login page (`/registrant-portal/auth/login`), which then shows an error about a missing `event` query parameter.

**Cause:** The `abstractService.getAbstractById()` method, which is called by the `ReviewerAbstractReviewPage`, was mistakenly using the `apiRegistrant` client instead of the main `api` client. The `apiRegistrant` client, upon detecting no valid registrant session (because the user is a reviewer), would trigger a 401 error. Its response interceptor for 401 errors then forcibly redirected the user to the registrant login page.

**Resolution:** The `abstractService.getAbstractById()` method in `ONSITE-ATLAS/client/src/services/abstractService.js` was modified to use the main `api` client instance. This ensures that API calls to fetch abstract details for review are authenticated with the reviewer's credentials.

### Troubleshooting: Invalid Category ID on Abstract Submission (AbstractPortal.jsx)

**Symptom:** When submitting a new abstract via `AbstractPortal.jsx`, a "400 Bad Request" error occurs with the message "Validation Error: undefined - Invalid Category ID format".

**Cause:** The `AbstractPortal.jsx` component was using the category *name* (e.g., "Test Research") as the value for the category selection dropdown. This name was then being sent to the backend during abstract creation. The backend API endpoint for creating abstracts expects a valid MongoDB ObjectId string for the `category` field, not the category name.

**Resolution:** The `AbstractPortal.jsx` component, within its `fetchEventData` function, was modified. When processing the categories fetched from the event settings (`eventDetails.data.abstractSettings.categories`), it now attempts to use `category._id` as the `value` for each option in the category dropdown. If a `category._id` is missing (which ideally shouldn't happen if the data structure is correct), it falls back to using the category name and logs a warning to the console. This ensures that, if available, the category's ObjectId is sent to the backend, satisfying the API's validation requirements.

### Backend Update: Global Status Synchronization for Revisions (July 2024)

**Issue:** Previously, when a reviewer marked an abstract for revision (e.g., status `'revise'`), this updated their specific review record (`myReviewStatus` on the frontend), correctly placing it in their "Awaiting Author" or "Re-Review" tab. However, the abstract's *global status* (visible in the Admin Portal) might have remained as "Under review".

**Resolution (Backend):** The backend controller `ONSITE-ATLAS/server/src/controllers/abstract.controller.js`, specifically the `submitIndividualReview` function, has been modified. Now, when a reviewer submits a review with a decision of `'revise'`: 
1. The individual review is saved as before.
2. The controller then checks if the abstract's global status is already `'revision-requested'`. 
3. If not, the global status of the abstract is updated to `'revision-requested'`, and the abstract document is saved again.

This change ensures that a reviewer's action to request revisions is also reflected in the abstract's main status, aiming for better synchronization between the reviewer interface and the Admin Portal view of abstract statuses.

### Troubleshooting: Discrepancy in Displayed Review Status vs. Actual Review Decision

**Symptoms:**
1.  **Reviewer Dashboard:** An abstract (e.g., "yoooon") for which the logged-in reviewer has submitted a "reject" decision (and `isComplete: true` in their review record in MongoDB) is still displayed in the "Pending Review" tab with an "Under review" status badge in `ReviewerDashboardPage.jsx`.
2.  **Admin Portal:** The same abstract, despite having a "reject" decision from at least one reviewer, may still be displayed in the Admin Portal with an overall status of "Under review", rather than reflecting a more conclusive status (e.g., "Rejected" or "Pending final decision").

**Observation Details:**
*   **MongoDB Data:** For the specific abstract, the `reviews` array contains an entry for the logged-in reviewer with `decision: "reject"` and `isComplete: true`. The abstract's overall global `status` field (which the Admin Portal likely uses) might still be "under-review".
*   **Reviewer UI Display:** The abstract appears in a category and with a status badge (e.g., yellow "Under review") that suggests the reviewer's action is still pending or in an interim state, rather than completed. It should ideally be in the "Review Completed" tab with a "Rejected" (red) badge if `myReviewStatus` was correctly set.
*   **Admin Portal UI Display:** The abstract's overall status does not reflect the finality of the reviewer's rejection.

**Analysis:**
*   **For the Reviewer Dashboard:** The `ReviewerDashboardPage.jsx` categorizes abstracts and displays their status based on a field named `myReviewStatus` which is expected to be part of each abstract object returned by the `reviewerService.getAssignedAbstracts` backend API call. If `myReviewStatus` were correctly set to "reject", the frontend logic would place the abstract in the "Review Completed" tab and display the appropriate "Rejected" status.
*   **For the Admin Portal:** The Admin Portal likely displays the abstract's main `status` field from the MongoDB document. If this global `status` is not updated after a reviewer submits a final decision like "reject", the Admin Portal will show outdated information.

**Likely Causes & Recommendations:**

1.  **Backend Logic for `myReviewStatus` (Reviewer Dashboard):**
    *   **Cause:** The backend `reviewerService.getAssignedAbstracts` API endpoint may not be correctly setting the `myReviewStatus` for the specific reviewer. It might be incorrectly propagating the abstract's overall `status` or failing to process the reviewer's specific decision from the `reviews` array.
    *   **Recommendation:** 
        *   Log `assignedAbstracts` data in `ReviewerDashboardPage.jsx` to verify the `myReviewStatus` being received.
        *   Debug the backend logic in `reviewerService.getAssignedAbstracts` (and related controllers) to ensure `myReviewStatus` accurately reflects the authenticated reviewer's most current completed decision.

2.  **Backend Logic for Global Abstract Status (Admin Portal & Overall System):**
    *   **Cause:** The backend controller responsible for handling review submissions (e.g., `submitIndividualReview` in `abstract.controller.js`) may not be adequately updating the abstract's main/global `status` field after a reviewer submits a final decision like "reject" or "accept". While logic exists to update the global status to `revision-requested` for a `'revise'` decision, similar comprehensive logic might be missing for other final decisions.
    *   **Recommendation:**
        *   Extend the backend logic in the relevant controller (e.g., `submitIndividualReview` in `ONSITE-ATLAS/server/src/controllers/abstract.controller.js`).
        *   After a reviewer submits a final decision (`accept`, `reject`):
            *   The system should determine if this individual decision necessitates a change to the abstract's overall global `status`.
            *   This may involve checking if all reviews are complete, or applying specific business rules (e.g., one rejection leads to a global "Rejected" status, or all acceptances lead to "Accepted").
            *   The abstract's main `status` field in MongoDB must be updated accordingly to ensure the Admin Portal and other parts of the system reflect the most current state.

**Overall Goal:** Ensure that both the reviewer-specific status (`myReviewStatus`) and the abstract's global `status` are accurately updated and synchronized by the backend upon review submission, reflecting the decisions made.

## Future Enhancements

[To be filled in with any planned improvements or new features.] 