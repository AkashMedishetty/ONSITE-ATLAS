# ATLAS Conference Management System - Server

This is the backend API server for the ATLAS Conference Management System, a comprehensive platform for managing conferences, events, registrations, and more.

## Features

- User authentication and authorization
- Event creation and management
- Registration processing
- Workshop management
- Abstract submission and review
- Dashboard analytics
- Report generation
- Financial tracking

## Tech Stack

- Node.js
- Express.js
- MongoDB with Mongoose
- JWT Authentication
- Winston for logging
- Joi for validation
- AWS S3 for file storage
- Stripe for payment processing
- Nodemailer for email notifications

## Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file in the server directory with the following variables:
   ```
   NODE_ENV=development
   PORT=5000
   MONGODB_URL=mongodb://localhost:27017/atlas_conference
   JWT_SECRET=your_jwt_secret
   JWT_ACCESS_EXPIRATION_MINUTES=30
   JWT_REFRESH_EXPIRATION_DAYS=30
   EMAIL_FROM=noreply@your-domain.com
   SMTP_HOST=smtp.your-email-provider.com
   SMTP_PORT=587
   SMTP_USERNAME=your-email@example.com
   SMTP_PASSWORD=your-password
   ```

4. Start the development server:
   ```
   npm run dev
   ```

## API Documentation

The API is organized around the following resources:

- `/api/auth` - Authentication endpoints
- `/api/users` - User management
- `/api/events` - Event management
- `/api/events/:eventId/registrations` - Registration management
- `/api/dashboard` - Dashboard data
- `/api/analytics` - Analytics data
- `/api/reports` - Report generation

## Folder Structure

```
server/
├── src/
│   ├── config/       # Configuration files
│   ├── controllers/  # Request handlers
│   ├── middleware/   # Express middleware
│   ├── models/       # Mongoose models
│   ├── routes/       # API routes
│   ├── services/     # Business logic
│   ├── utils/        # Utility functions
│   ├── validations/  # Joi validation schemas
│   ├── app.js        # Express app setup
│   └── server.js     # Server entry point
├── .env              # Environment variables (create this)
├── package.json      # Dependencies and scripts
└── README.md         # This file
```

## Development

- Run `npm run lint` to check code style
- Run `npm run lint:fix` to automatically fix linting issues
- Run `npm test` to run tests

## License

This project is licensed under the MIT License. 