# Project Timeline

## Discovered During Work
*(Tasks added here are those identified during development that were not part of the initial plan)*

---

## Planned Tasks

### Phase 1: Foundation (Ongoing)
- [x] Project requirements gathering
- [x] System architecture design
- [x] Database schema design
- [x] UI/UX strategy
- [x] Implementation planning
- [ ] Project structure setup (Backend & Frontend)
- [ ] Core component library (Frontend - Basic UI elements)
- [ ] Backend API development (Initial core routes, e.g., auth, basic event management)
- [ ] MongoDB Connection & Basic Models

### Phase 2: Event & Registration (Next Up)
- [ ] Event creation and management (Full CRUD for Events)
- [ ] Registration system (Backend logic for single registration)
- [ ] QR code generation for registrations
- [ ] Badge printing functionality (Basic template)
- [ ] **Improve Bulk Registration Import (Backend & Frontend)** - *Added <today_date>*
    - Description: Address timeout issues, implement asynchronous processing, add progress bar on the frontend, and optimize import speed.
    - Status: To Do
    - Assigned: AI

### Phase 3: Resource Management
- [ ] Food tracking (Backend models & API, basic UI)
- [ ] Kit bag distribution (Backend models & API, basic UI)
- [ ] Certificate management (Backend models & API, basic UI)
- [ ] Scanner interfaces (Basic UI for resource scanning)

### Phase 4: Advanced Features
- [ ] Abstract submission system (Backend models & API, basic UI)
- [ ] Global search functionality (Basic implementation)
- [ ] Dashboard and reporting (Initial metrics)
- [ ] Digital certificate distribution (Email integration placeholder)

### Phase 5: Polish & Deployment
- [ ] UI/UX refinement across implemented features
- [ ] Performance optimization
- [ ] Comprehensive Testing (Unit, Integration, E2E)
- [ ] AWS deployment setup

---

*Note: `<today_date>` will be replaced by the actual date when this task is formally started.*

- 2024-06-09: Populate category for reviewer-assigned abstracts in backend and display category in reviewer dashboard.
- [x] 2024-06-09: Implement backend and frontend support for filtering abstracts by review score (minScore, maxScore) in export. Added UI for export filters (mode, category, topic, score) and updated backend endpoint to support score filtering.
- [x] 2024-06-09: Add reviewer filtering to abstract export (backend and frontend). Reviewer dropdown in export UI, backend supports reviewer query param.
- [x] 2024-06-09: Update backend controller to accept eventId from both params and query, and ensure robust category/sub-topic name resolution for registrant abstract detail endpoint
  - Controller now robustly handles eventId from both params and query, and category/sub-topic resolution is aligned with getAbstractByIdForEvent logic.
- [x] Update getEventReviewers to support both legacy managedEvents and new eventRoles structure

## Post-Event
- [ ] Digital certificate generation
- [ ] Email distribution to attendees
- [ ] Comprehensive reporting
- [ ] Data export and archiving

### Discovered During Work
*   **(Ongoing) Bug: Abstract Category/Sub-Topic Not Displaying** - Investigating why category and sub-topic names are not appearing in `AbstractDetail.jsx`. Current focus is on backend controller `registrant.abstract.controller.js` log visibility and data lookup logic. (Date: Current Date)
- Refactor all event-scoped user queries to use eventRoles for consistency 