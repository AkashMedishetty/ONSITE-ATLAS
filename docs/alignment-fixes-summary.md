# Frontend-Backend Alignment Fixes

This document outlines all the fixes needed to ensure proper alignment between the frontend and backend of the Onsite Atlas application.

## 1. Missing API Endpoints Implementation

The following API endpoints referenced in the frontend services need to be implemented in the backend:

### Badge Endpoints
- `GET /api/events/:eventId/badges/templates` - Get badge templates for event
- `GET /api/events/:eventId/badges/templates/:id` - Get specific badge template
- `POST /api/events/:eventId/badges/templates` - Create badge template
- `PUT /api/events/:eventId/badges/templates/:id` - Update badge template
- `DELETE /api/events/:eventId/badges/templates/:id` - Delete badge template
- `POST /api/events/:eventId/badges/generate` - Generate badges for printing
- `POST /api/events/:eventId/badges/preview` - Preview badge for a registration

### Report Endpoints
- `GET /api/reports` - Get all available reports
- `GET /api/events/:eventId/reports` - Get reports for event
- `POST /api/events/:eventId/reports/generate` - Generate custom report
- `GET /api/events/:eventId/reports/templates` - Get report templates
- `POST /api/events/:eventId/reports/templates` - Create report template
- `PUT /api/events/:eventId/reports/templates/:id` - Update report template

### User Management Endpoints
- `GET /api/users` - Get all users
- `POST /api/users` - Create new user
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `GET /api/roles` - Get all roles
- `POST /api/roles` - Create new role
- `PUT /api/roles/:id` - Update role
- `DELETE /api/roles/:id` - Delete role

### Email Template Endpoints
- `GET /api/email-templates` - Get all email templates
- `GET /api/events/:eventId/email-templates` - Get email templates for event
- `POST /api/events/:eventId/email-templates` - Create email template
- `PUT /api/events/:eventId/email-templates/:id` - Update email template
- `DELETE /api/events/:eventId/email-templates/:id` - Delete email template
- `POST /api/events/:eventId/email-templates/:id/test` - Send test email using template

### Scanner Endpoints
- `POST /api/scan/validate` - Validate a QR code scan
- `POST /api/scan/checkin` - Check in an attendee via QR scan
- `GET /api/events/:eventId/scan/recent` - Get recent scans for event

## 2. Resource Model Export Fix

The Resource model is not properly exported in `models/index.js`, causing the statistics endpoint to fail. This should be fixed:

```javascript
// Original
module.exports = {
  User: require('./User'),
  Event: require('./Event'),
  Registration: require('./Registration'),
  Category: require('./Category'),
  Abstract: require('./Abstract')
};

// Fixed
module.exports = {
  User: require('./User'),
  Event: require('./Event'),
  Registration: require('./Registration'),
  Category: require('./Category'),
  Resource: require('./Resource'),  // This was missing
  Abstract: require('./Abstract')
};
```

## 3. Standardize API Response Formats

All API responses should follow these standard formats:

### Success Response
```javascript
{
  success: true,
  data: { ... }  // Response data object or array
}
```

### Paginated Response
```javascript
{
  success: true,
  data: [
    { ... },  // Array of items
    { ... }
  ],
  pagination: {
    page: 1,         // Current page number
    limit: 10,       // Items per page
    totalPages: 5,   // Total number of pages
    totalItems: 48   // Total number of items
  }
}
```

### Error Response
```javascript
{
  success: false,
  message: "Error message",
  errors: [ ... ]  // Optional array of specific errors
}
```

## 4. Frontend Environment Variable Fixes

Frontend services should use `import.meta.env` instead of `process.env` since the application is built with Vite.

The following files need to be updated:
- `abstractService.js` (line 5)
- `categoryService.js` (line 12)
- `registrationService.js` (line 8)
- `resourceService.js` (line 7)

Example fix:
```javascript
// Incorrect
const API_URL = process.env.API_URL || 'http://localhost:5000/api';

// Correct
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
```

## 5. Standardize Error Handling in Frontend Services

All API service methods should handle errors consistently:

```javascript
const functionName = async (params) => {
  try {
    const response = await apiService.get('/endpoint', { params });
    return response.data;
  } catch (error) {
    // Standard error handling
    if (error.response) {
      return {
        success: false,
        message: error.response.data.message || 'Server error',
        errors: error.response.data.errors
      };
    } else if (error.request) {
      return {
        success: false,
        message: 'No response from server. Please check your connection.'
      };
    } else {
      return {
        success: false,
        message: error.message || 'Unknown error occurred'
      };
    }
  }
};
```

## 6. Standardize Error Handling in Backend Controllers

Create utility functions for consistent error responses:

```javascript
// utils/responses.js
exports.errorResponse = (res, message, statusCode = 400, errors = null) => {
  const response = {
    success: false,
    message
  };
  
  if (errors) {
    response.errors = errors;
  }
  
  return res.status(statusCode).json(response);
};

exports.successResponse = (res, data, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    data
  });
};

exports.paginatedResponse = (res, data, page, limit, total) => {
  const totalPages = Math.ceil(total / limit);
  
  return res.status(statusCode).json({
    success: true,
    data,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages,
      totalItems: total
    }
  });
};
```

## 7. MongoDB Connection Configuration Fixes

Create a centralized database connection file:

```javascript
// config/database.js
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      useFindAndModify: false
    });
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
```

## 8. Consistent Validation in Controllers

Implement a middleware approach for validation:

```javascript
// middleware/validate.js
const Joi = require('joi');
const { errorResponse } = require('../utils/responses');

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.context.key,
        message: detail.message
      }));
      
      return errorResponse(res, 'Validation failed', 400, errors);
    }
    
    next();
  };
};

module.exports = validate;
```

## 9. Authentication System Fixes

Update token verification to properly check expiration:

```javascript
// middleware/auth.js
const jwt = require('jsonwebtoken');
const { errorResponse } = require('../utils/responses');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  try {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token) {
      return errorResponse(res, 'Not authorized to access this route', 401);
    }
    
    // Verify token and check expiration
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if token is expired
    const currentTime = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < currentTime) {
      return errorResponse(res, 'Token has expired', 401);
    }
    
    // Get user from token
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return errorResponse(res, 'User not found', 401);
    }
    
    req.user = user;
    next();
  } catch (error) {
    return errorResponse(res, 'Authentication error', 401);
  }
};
```

## 10. Pagination Implementation

Implement consistent pagination across all list endpoints:

```javascript
// controllers/eventController.js
exports.getEvents = async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = 'createdAt', order = 'desc', search = '' } = req.query;
    
    // Convert page and limit to numbers
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    
    // Build query
    const query = {};
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    
    // Set sort order
    const sortOrder = order === 'asc' ? 1 : -1;
    const sortOptions = { [sort]: sortOrder };
    
    // Execute query with pagination
    const events = await Event.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum);
    
    // Get total count for pagination
    const total = await Event.countDocuments(query);
    
    return paginatedResponse(res, events, pageNum, limitNum, total);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};
```

This summary outlines all the key fixes needed to ensure proper alignment between the frontend and backend components of the Onsite Atlas application. 