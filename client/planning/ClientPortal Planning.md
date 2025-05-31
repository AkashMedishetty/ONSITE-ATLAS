# ClientPortal Planning

## Overview
The Client Portal is for the event's organising committee. It provides a dashboard, registration management (with import/export), abstract and sponsor views, and extensive analytics. It is a restricted, read-only admin-like portal with no edit capabilities for registrations.

---

## 1. Backend Implementation

### 1.1. Models
- **eventClient** (new collection)
  - Fields: `_id`, `event`, `clientId` (OC-<eventPrefix>-###), `name`, `email`, `phone`, `plainPassword`, `passwordHash`, `status`, `createdAt`, `updatedAt`
  - Index: unique on `clientId` and `event`
- **Update Event model** to reference eventClients if needed.

### 1.2. Auth
- JWT-based login for event clients (like sponsors/registrants)
- Login ID: `OC-<eventPrefix>-###` (auto-generated, 3 digits, per event)
- Store both plain and hashed password (update both on change)
- Auth middleware: `protectClient` (like `protectSponsor`)

### 1.3. API Endpoints
- `/api/client-portal-auth/login` (POST)
- `/api/client-portal-auth/me/dashboard` (GET)
- `/api/client-portal-auth/me/registrants` (GET, POST, bulk-import, export)
- `/api/client-portal-auth/me/abstracts` (GET)
- `/api/client-portal-auth/me/sponsors` (GET)
- `/api/client-portal-auth/me/categories` (GET)
- `/api/client-portal-auth/me/payments` (GET)
- `/api/client-portal-auth/me/workshops` (GET)
- `/api/client-portal-auth/me/reports` (GET)
- `/api/client-portal-auth/me/logout` (POST)
- Admin endpoints to manage event clients (add, update, reset password, etc.)

### 1.4. Bulk Import/Export
- Use the same logic as admin import/export (see RegistrationsTab/BulkImportWizard)
- Allow all registration types (pre-registered, onsite, imported, sponsored, complementary)
- Registration type must be imported/settable by the committee

---

## 2. Frontend Implementation

### 2.1. Structure
- Create `client/src/pages/ClientPortal/` for all portal pages
- Create `ClientPortalRoutes.jsx` and `ClientPortalLayout.jsx` (follow RegistrantPortal structure)
- Add a new link in `EventPortal.jsx` for the Client Portal

### 2.2. Routing
- `/client-portal/login` (login page)
- `/client-portal/dashboard` (dashboard overview)
- `/client-portal/registrations` (list, add, import, export; no edit)
- `/client-portal/abstracts` (view, review info)
- `/client-portal/sponsors` (view sponsor data)
- `/client-portal/reports` (analytics, payments, workshops, etc.)

### 2.3. Features
- **Dashboard:**
  - Show all registration types, payments, workshops, abstracts, sponsors, etc. in detail
- **Registrations:**
  - List with filters: category, status, registration type, etc.
  - Add new, bulk import (admin logic), export (admin logic)
  - No edit/delete for registrations
- **Abstracts:**
  - List and review info (read-only)
- **Sponsors:**
  - List and details (read-only)
- **Reports:**
  - Detailed analytics (charts, tables)
- **Auth:**
  - Login/logout, context persistence

### 2.4. UI/UX
- Use the same design system as other portals
- Dashboard should be visually rich and detailed
- All pages in `ClientPortal` folder

---

## 3. Admin Integration
- Add a new tab in admin to manage event clients (add, update, reset password, etc.)
- Store event client data in `eventClient` collection
- Generate login ID as `OC-<eventPrefix>-###`
- Show credentials to admin for distribution

---

## 4. Integration Points
- Use existing registration, abstract, sponsor, and payment APIs (with client auth)
- Reuse admin bulk import/export logic for registrations
- Use similar context/auth logic as RegistrantPortal

---

## 5. Next Steps
1. Create `eventClient` model and migration script
2. Implement client auth middleware and endpoints
3. Build admin UI for event client management
4. Scaffold `ClientPortal` frontend (routes, layout, dashboard)
5. Implement registration list/import/export (reuse admin logic)
6. Implement abstracts, sponsors, and reports pages
7. Add portal link in `EventPortal.jsx`
8. Test end-to-end

---

# End of Plan 