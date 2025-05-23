## [2024-06-09] Abstracts Excel Export Enhancement (In Progress)
- Implemented Excel export for abstracts in the download endpoint.
- Excel file includes event name, topic/category, reviewer name, and review date in both content and file name.
- Supports single-row and multi-row export modes, with file naming reflecting filters and mode.
- Updated API docs and controller logic.

## [2024-07-26] Registrant Portal Enhancements
- **Date:** 2024-07-26
  - **Task:** Resolve button nesting issue in `ScheduleManagement.jsx` Accordion.
    - **Status:** Done
  - **Task:** Registrant Portal: Investigate and fix `AbstractsList.jsx` (undefined `eventId`, 404 error).
    - **Status:** In Progress (awaiting clarification on event ID handling)
  - **Task:** Registrant Portal: Investigate and fix `RegistrantDashboard.jsx` (API timeout, remove mock/static data).
    - **Status:** In Progress (backend timeout identified, frontend static data to be reviewed)
  - **Task:** `ScheduleManagement.jsx` UI Enhancements (Phase 2 - further layout improvements).
    - **Status:** To Do (marked for later) 

## Discovered During Work (or New Tasks) - [Add Today's Date]

### Registrant Portal Dashboard Enhancements
- **Download Badge Button:** Fix functionality.
- **Download Certificate Button:** Integrate feature.
- **Payment/Invoice Download:** Integrate placeholder/links.
- **Support Tickets Integration:**
    - Registrant Portal: View/Create tickets section.
    - Admin Portal: Manage tickets functionality (Separate Task).
- **Schedule View:** Integrate event schedule display.
- **Event Notifications/Announcements:**
    - Registrant Portal: Display announcements section.
    - Admin Portal: Manage announcements functionality (Separate Task).
- **Workshop Status:** Integrate display.
- **Profile Page Enhancements:**
    - Display all relevant registrant data.
    - Add data editing functionality.

### Documentation
- Create/update documentation tracking these dashboard features, hurdles, and TODOs.

- [x] 2024-06-08: Created new registration resource modal endpoint and controller (`registrationResourceModal.controller.js`, `registrationResourceModal.routes.js`) to provide enriched resource usage for a registration, without affecting existing logic. 