## Registrant Dashboard Features (Ongoing Development)

This section details the features planned or currently under development for the main registrant dashboard.

| Feature                   | Status      | Notes / Hurdles / TODOs |
|---------------------------|-------------|-------------------------|
| **Download Badge**        | To Do       | Fix existing button functionality. Needs API endpoint `/api/v1/registrants/badge/:eventId/:registrantId` (confirm endpoint). |
| **Download Certificate**  | To Do       | Needs API endpoint `/api/v1/registrants/certificate/:eventId/:registrantId` (confirm endpoint). |
| **Payment/Invoice**       | To Do       | Add placeholder buttons/links. Backend payment system not yet configured. API? `/api/v1/registrants/invoice/:eventId/:registrantId`? |
| **Support Tickets**       | To Do       | Requires UI section and API integration (`/api/v1/support-tickets`). Admin portal functionality needed separately. |
| **Schedule View**         | To Do       | Requires UI section and API integration (`/api/v1/events/:eventId/schedule`). Consider interaction features later. |
| **Notifications/Announcements** | To Do | Requires UI section and API integration (`/api/v1/events/:eventId/announcements`). Admin portal functionality needed separately. |
| **Workshop Status**       | To Do       | Requires UI section and API integration (`/api/v1/registrants/workshops/:eventId/:registrantId`). |
| **Profile Page Edit**     | To Do       | Enhance profile page (`RegistrantProfile.jsx`?) to show all data and allow edits via API (`/api/v1/registrants/profile/:registrantId` - PUT/PATCH). |

*(This table will be updated as development progresses)* 