# Onsite Atlas

A comprehensive conference management system designed for onsite registration, badge printing, resource tracking, and abstract management.

## Recent Updates

### API Standardization

We've implemented a standardized API response format across the application to ensure consistency between frontend and backend:

- All API responses now follow a consistent format: `{ success, message, data }`
- Server-side middleware automatically formats all responses
- Client-side utilities simplify response handling
- See `docs/api-standards.md` for detailed documentation

## Features

- User authentication and role-based access control
- Event creation and management
- Attendee registration with QR code generation
- Badge design and printing
- Resource tracking (meals, kits, certificates)
- Abstract submission and management
- Comprehensive reporting and analytics
- Responsive dashboard interface
- **Email Attachments:** Admins can now attach multiple files (PDF, images, etc.) when sending emails to event participants. Attachments are tracked in email history for audit, and can be viewed/downloaded from the history tab. (Validation for file types and size limits coming soon.)
- **Admin Event Client Management:**
  - Manage organizing committee clients per event via the Client tab in the EventPortal
  - Full CRUD (create, edit, delete, reset password) for event clients
  - Password is always set to the mobile number (plain and hashed)
  - Advanced features (bulk import/export, filtering, audit logs) planned

## Tech Stack

### Frontend
- React with Vite
- Tailwind CSS for styling
- React Router for navigation
- Framer Motion for animations

### Backend
- Node.js with Express
- MongoDB (Atlas) for database
- JWT for authentication
- Various utility libraries

## Project Structure

```
onsite-atlas/
├── client/             # Frontend React application
│   ├── public/         # Static assets
│   │   └── index.html  # HTML template
│   ├── src/            # Source code
│   │   ├── components/ # Reusable components
│   │   ├── pages/      # Page components
│   │   ├── layouts/    # Layout components
│   │   ├── hooks/      # Custom React hooks
│   │   ├── utils/      # Utility functions
│   │   ├── context/    # React context providers
│   │   ├── services/   # API service functions
│   │   ├── styles/     # Global styles
│   │   ├── App.jsx     # Main application component
│   │   └── main.jsx    # Entry point
│   ├── package.json    # Dependencies and scripts
│   └── vite.config.js  # Vite configuration
│
├── server/             # Backend Express application
│   ├── src/            # Source code
│   │   ├── config/     # Configuration files
│   │   ├── controllers/# Route controllers
│   │   ├── middleware/ # Custom middleware
│   │   ├── models/     # Mongoose models
│   │   ├── routes/     # API routes
│   │   ├── services/   # Business logic
│   │   ├── utils/      # Utility functions
│   │   └── index.js    # Entry point
│   ├── .env            # Environment variables
│   └── package.json    # Dependencies and scripts
│
├── project_docs/       # Project documentation
│   ├── timeline.md     # Development timeline
│   └── schema.md       # Database schema
│
└── README.md           # This file
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/your-username/onsite-atlas.git
   ```

2. Install server dependencies:
   ```
   cd server
   npm install
   ```

3. Install client dependencies:
   ```
   cd ../client
   npm install
   ```

4. Create `.env` file in the server directory with the following variables:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/onsite-atlas
   JWT_SECRET=your_jwt_secret
   NODE_ENV=development
   ```

5. Create `.env` file in the client directory:
   ```
   VITE_API_URL=http://localhost:5000/api
   ```

### Running the Application

1. Start the server:
   ```
   cd server
   npm run dev
   ```

2. Start the client:
   ```
   cd client
   npm run dev
   ```

3. Access the application at `http://localhost:5173`

## Documentation

- API Documentation: `docs/api-documentation.md`
- API Standards: `docs/api-standards.md`
- Frontend Documentation: `docs/frontend-documentation.md`

## Core Workflows

### Event Setup
1. Admin creates new event with details
2. Configures registration settings and ID format
3. Creates attendee categories with permissions
4. Sets up resource definitions and permissions

### Registration Process
1. Attendees register via public link or are imported via Excel
2. System generates Registration ID and QR code
3. Staff can register walk-ins at the event
4. Badges can be printed with custom templates

### Resource Distribution
1. Staff selects specific resource type at scanning station
2. Attendee badge QR is scanned
3. System validates category permissions
4. Transaction is recorded with timestamp

### Abstract Submission
1. Author accesses submission portal
2. Authenticates with Registration ID
3. Submits or edits abstract content
4. Admins review and manage submissions

## Development Status

See [project_docs/timeline.md](project_docs/timeline.md) for current development status and timeline.

## License

This project is licensed under the MIT License.

## Abstracts Excel Export

You can now export abstracts for an event as Excel files via the download endpoint:

`GET /api/events/:eventId/abstracts/download?exportMode=excel-single` or `exportMode=excel-multi`

- `excel-single`: All reviews for an abstract are in a single cell as JSON.
- `excel-multi`: Each review gets its own row.
- You can filter by `category` or `topic` using query parameters.
- The Excel file name will include the event name, category/topic, and export mode.
- Columns include event name, topic, category, reviewer name, and review date. 