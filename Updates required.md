# Updates Required

This document tracks all planned upgrades and additional functionality for the registration system. Each section details the feature, where it should be implemented, and how it should work.

---

## 1. Email Confirmation for Public Registration

**What:**
- Send a confirmation email to the registrant after successful public registration.
- Optionally, require the registrant to confirm their email before the registration is considered valid/active.

**Where:**
- **Backend:**
  - `server/src/controllers/registration.controller.js` (public registration endpoint)
  - `server/src/utils/sendEmail.js` (email sending logic)
  - Possibly a new email template in `server/src/emails/`
- **Frontend:**
  - `client/src/pages/PublicPortals/RegistrationPortal.jsx` (show confirmation message, handle pending/confirmed status)

**How:**
- After creating a registration, generate a unique confirmation token and store it with the registration.
- Send an email to the registrant with a confirmation link containing the token.
- Add a new endpoint to handle confirmation (e.g., `/api/registrations/confirm/:token`).
- When the link is clicked, mark the registration as confirmed.
- Optionally, only allow confirmed registrations to be considered "active" for event participation.

**Dependencies/Considerations:**
- Email delivery reliability (use a robust provider)
- Token expiration and security
- UI feedback for pending/confirmed status

---

## 2. Payment Gateway Integration

**What:**
- Integrate a payment gateway (e.g., Stripe, Razorpay, PayPal) to collect registration fees during public registration.
- Only mark registration as complete/active after successful payment.

**Where:**
- **Frontend:**
  - `client/src/pages/PublicPortals/RegistrationPortal.jsx` (add payment step, show payment UI)
  - Possibly new payment components/services
- **Backend:**
  - `server/src/controllers/registration.controller.js` (handle payment status, webhook for payment confirmation)
  - New payment service module (e.g., `server/src/services/paymentService.js`)

**How:**
- After form validation, show payment UI before final submission.
- On successful payment, call the backend to create the registration and mark as paid.
- Listen for payment gateway webhooks to confirm payment status.
- Store payment status and transaction details with the registration.
- Only send confirmation email after payment is confirmed.

**Dependencies/Considerations:**
- Choose a payment provider (Stripe, Razorpay, etc.)
- Handle payment failures, retries, refunds
- Secure handling of payment data (PCI compliance)

---

## 3. Per-Event Custom Registration Forms

**What:**
- Allow each event to define its own registration form fields, order, and required/optional status.
- Support custom fields, field types, and validation per event.

**Where:**
- **Admin Panel:**
  - `client/src/pages/Events/settings/RegistrationTab.jsx` (form builder UI)
- **Frontend:**
  - `client/src/pages/PublicPortals/RegistrationPortal.jsx` (render form dynamically based on event config)
- **Backend:**
  - `server/src/models/Event.js` (store form config in event schema)
  - `server/src/controllers/event.controller.js` (expose form config via API)

**How:**
- Admin configures form fields, order, and validation in the admin panel.
- Save form config in the event's `registrationSettings`.
- Public registration portal fetches and renders the form based on this config.
- Validate submitted data against the event's form config on the backend.

**Dependencies/Considerations:**
- UI/UX for form builder (drag-and-drop, field options)
- Backward compatibility for existing events
- Validation and error handling for dynamic fields

---

## 4. Future Upgrades

- Add anti-spam/CAPTCHA to public registration
- SMS confirmation/notifications
- Multi-language support for forms and emails
- Advanced analytics and reporting for registrations
- ... (add more as needed) 