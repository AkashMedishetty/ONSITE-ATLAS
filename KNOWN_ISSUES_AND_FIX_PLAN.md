# Known Issues & Fix Plan

## Table of Contents
1. [Event Portal Tab Re-rendering](#event-portal-tab-re-rendering)
2. [Sponsor Tab: Add Preview](#sponsor-tab-add-preview)
3. [Certificate Printing in Scanning Station](#certificate-printing-in-scanning-station)DONE
4. [Resources Tab: Open Scanner Button Not Working](#resources-tab-open-scanner-button-not-working)DONE
5. [Resource Scanning Issues](#resource-scanning-issues)DONE
6. [Resource Dashboard/UI Not Updating](#resource-dashboardui-not-updating)
7. [Resource Settings Fetch/Update Issues](#resource-settings-fetchupdate-issues)DONE
8. [Certificate Printing: Workshop & Abstract Connection](#certificate-printing-workshop-abstract-connection)DONE
9. [Food Day 1 Scanning Issues](#food-day-1-scanning-issues)DONE
10. [Resource Void Option in Registration List Preview](#resource-void-option-in-registration-list-preview)DONE
11. [Disable Resource for Single Registration](#disable-resource-for-single-registration)Not Required too much hassle
12. [Category-Based Scanning](#category-based-scanning)Not Required 
13. [Registrant Portal Routing Issues](#registrant-portal-routing-issues)NEED TO CHECK
14. [Abstract Portal Login Issues](#abstract-portal-login-issues)DONE
15. [General Planning & Progress Tracking](#general-planning--progress-tracking)
16. [Fixed Issues](#fixed-issues)
17. [Certificate Template Upload & Printing: PDF-to-Image Conversion and Preview](#certificate-template-upload--printing-pdf-to-image-conversion-and-preview)DONE 
18. [Entitlement Syncing & Legacy Data Issues](#entitlement-syncing--legacy-data-issues)DONE

---

## 1. Event Portal Tab Re-rendering
**Problem:**
- `EventPortal.jsx` is re-rendering every time a tab is changed, causing unnecessary reloads and state resets.

**Proposed Fix:**
- Refactor tab logic to use memoization or React Router `<Outlet>` for nested tab content.
- Only re-render the active tab's content.

---

## 2. Sponsor Tab: Add Preview
**Problem:**
- No preview for each sponsor in the Sponsors tab.

**Proposed Fix:**
- Add a preview component/modal for each sponsor entry in the Sponsors tab list.

---

## 3. Certificate Printing in Scanning Station
**Problem:**
- Certificate printing is not available/working in the scanning station.

**Proposed Fix:**
- Integrate certificate printing logic into the scanning station UI and backend.

---

## 4. Resources Tab: Open Scanner Button Not Working
**Problem:**
- The "Open Scanner" button in the Resources tab does not trigger the scanner UI.

**Proposed Fix:**
- Debug the button's onClick handler and ensure it opens the scanner modal/component.

---

## 5. Resource Scanning Issues
**Problem:**
- Scanning is not updating the UI in the EventPortal dashboard and the Resources dashboard.

**Proposed Fix:**
- Ensure state is updated after a scan (possibly via context or a refresh callback).
- Add real-time or polling updates if needed.

---

## 6. Resource Settings Fetch/Update Issues
**Problem:**
- Resource settings are not being fetched or updated correctly.

**Proposed Fix:**
- Audit API calls for fetching/updating resource settings.
- Fix state management and ensure UI reflects backend changes.

---

## 7. Certificate Printing: Workshop & Abstract Connection
**Problem:**
- Certificate printing is not correctly connected to Workshop and Abstract modules.

**Proposed Fix:**
- Integrate certificate logic with Workshop and Abstract data models and UI.

---

## 8. Food Day 1 Scanning Issues
**Problem:**
- Scanning for Food Day 1 is not adding date/timestamp and allows rescanning.

**Proposed Fix:**
- Add timestamp logic on scan.
- Prevent duplicate scans for the same day/meal.

---

## 9. Resource Void Option in Registration List Preview
**Problem:**
- No option to void a resource from the registration list preview.

**Proposed Fix:**
- Add a "Void" button/action in the registration list preview for resources.

---

## 10. Disable Resource for Single Registration
**Problem:**
- Need to disable a resource for a single registration (e.g., due to special case).

**Proposed Fix:**
- Add a per-registration resource disable/override option in the UI and backend.

---

## 11. Category-Based Scanning
**Problem:**
- Category-based scanning needs testing and may not be working as expected.

**Proposed Fix:**
- Test and debug category-based scanning logic.
- Ensure permissions and UI reflect category rules.

---

## 12. Registrant Portal Routing Issues
**Problem:**
- After logging in, the registrant portal shows "Page Not Found" due to routing issues.
    
**Proposed Fix:**
- Audit and fix routing logic in the registrant portal after login.
- Ensure correct redirect and route definitions.

**Status:** ✅ Fixed
**Fix Summary:**
- Event context and redirect logic were refactored to ensure the correct event ID is always present after login.
- Loading and error states were improved in the layout and context providers.
- Now, after login, the registrant is always routed to the correct dashboard with the event context set.

---

## 13. Abstract Portal Login Issues
**Problem:**
- Abstract portal is not allowing login (likely due to backend or token issues).

**Proposed Fix:**
- Ensure backend allows public lookup for registration ID (see recent middleware fix).
- Test end-to-end login flow and fix any remaining issues.

**Status:** ✅ Fixed
**Fix Summary:**
- The login request now uses a fresh Axios instance with no token for the initial lookup.
- The backend and middleware were updated to allow public lookup for registration ID.
- After successful login, a token is returned and used for all subsequent requests.
- Circular token dependency is resolved and login works as expected.

---

## 14. General Planning & Progress Tracking

| Issue | Status | Owner | Notes |
|-------|--------|-------|-------|
| EventPortal tab re-rendering | ✅  Fixed |Too much of a hassle to fix now   |  |
| Sponsor tab preview | ⬜ Not Started |  |  |
| Certificate printing in scanning station | ✅  Fixed |  |  |
| Open Scanner button in Resources | ✅  Fixed |  |  |
| Resource scanning UI update and abstarcts status as well in the dashbaord | ⬜ Not Started |  |  |
| Resource settings fetch/update | ✅  Fixed |  |  |
| Certificate printing (Workshop/Abstract) | ✅  Fixed |  |  |
| Food Day 1 scanning | ✅  Fixed |  |  |
| Resource void in registration preview | ✅  Fixed |  |  |
| Disable resource for single registration | ⬜ Not Started |  |  |
| Category-based scanning | ✅  Fixed  |  |  |
| Registrant portal routing | ✅ Fixed |  | See below |
| Abstract portal login | ✅ Fixed |  | See below |
| Entitlement syncing/legacy data | ✅ Fixed |  | Backend patch: always cleans and syncs entitlements for all categories. |

---

## 15. Fixed Issues

### Registrant Portal Routing Issues
- **Status:** Fixed
- **Summary:** Event context and redirect logic were refactored. Registrants are now routed to the correct dashboard after login, with event context set and no 404 errors.

### Abstract Portal Login Issues
- **Status:** Fixed
- **Summary:** Public registration ID lookup is now allowed without a token. After successful login, a token is returned and used for all further requests. Circular dependency is resolved and login works as expected.

## Next Steps
- Assign owners for each issue.
- Prioritize based on business/operational needs.
- Track progress in this file and update as fixes are made.

---

## Certificate Template Upload & Printing: PDF-to-Image Conversion and Preview

**Problem:**
- PDF uploaded as a certificate template is not shown as a background in the admin UI for overlaying fields.
- PDFKit backend cannot use a PDF as a background image, resulting in errors ("Unknown image format").

**Fix Plan:**
1. **Backend:**
   - On PDF upload, convert the first page of the PDF to a high-resolution PNG (or JPG) using a library like `pdf-poppler` or `pdf2image`.
   - Store both the original PDF and the generated image.
   - Return the image URL in the API response for use in the admin UI.
2. **Frontend (Admin UI):**
   - Use the PNG/JPG as the background for the certificate overlay preview.
   - Lock the preview area to A4 landscape proportions (297mm x 210mm).
   - Warn the admin if the uploaded file is not A4 landscape.
   - Allow the admin to set printable area/margins visually.
3. **Onsite Printing:**
   - When printing onsite, open a modal with a blank A4 landscape overlay (no background), rendering only the fields at the configured positions.
   - Use the browser's print dialog for WYSIWYG output on preprinted certificates.
4. **Digital Certificate Download:**
   - For digital download, use PDFKit to generate a PDF with the PNG/JPG as the background and overlay fields at the saved positions.
   - Use the highest quality image (PNG/JPG) for best print resolution.
5. **Resolution & Quality:**
   - Ensure the backend generates the PNG/JPG at 300 DPI or better for print quality.
   - Use whichever (PNG/JPG or original PDF) gives the best result for digital download.

**Status:** ⬜ Not Started 

---

## 18. Entitlement Syncing & Legacy Data Issues
**Problem:**
- Categories could have stale, missing, or legacy-format entitlements for meals, kits, or certificates, especially after resource changes.
- This caused scanner and UI bugs, and required manual data migration.

**Fix Plan:**
- Patch the backend to always clean and sync entitlements for all categories whenever permissions are updated.
- Remove legacy/invalid entitlements and add missing ones for all current resources, defaulting to entitled: true.
- Ensure all resource IDs are ObjectIds and only valid resources are present in entitlements.
- Add debug logging for all steps.

**Status:** ✅ Fixed (2024-06-09)
**Fix Summary:**
- The backend `updateCategoryPermissions` endpoint now:
  - Fetches the current valid meals, kits, and certificates from ResourceSetting for the event.
  - Cleans up all entitlements, removing any that do not match current resources.
  - Adds missing entitlements for all current resources, defaulting to entitled: true.
  - Ensures all IDs are ObjectIds and only valid resources are present in entitlements.
  - Adds debug logging for all steps.
- This ensures robust, future-proof entitlement management and prevents legacy/invalid entitlements from persisting.
- No further manual migration is required after this patch. 