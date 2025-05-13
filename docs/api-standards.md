# Onsite Atlas API Standards

## Standardized API Response Format

All API responses in the Onsite Atlas application follow a standardized format to ensure consistency across the application.

### Success Response Format

```json
{
  "success": true,
  "message": "Operation successful",
  "data": [
    // Response data here
  ]
}
```

### Error Response Format

```json
{
  "success": false,
  "message": "Error message",
  "errors": [
    "Detailed error 1",
    "Detailed error 2"
  ]
}
```

### Paginated Response Format

```json
{
  "success": true,
  "message": "Items retrieved successfully",
  "data": [
    // Array of items
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "totalPages": 10,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

## Frontend Data Handling

### Response Processing Utilities

The frontend includes utilities for handling the standardized API responses:

```javascript
// Extract data from response
const data = responseHandler.extractData(response, defaultValue);

// Check if response was successful
if (responseHandler.isSuccess(response)) {
  // Handle success
}

// Get message from response
const message = responseHandler.getMessage(response, 'Default message');

// Get errors from response
const errors = responseHandler.getErrors(response);
```

### Response Transformation

The API service automatically transforms all responses to follow the standardized format:

1. If the response already has a `success` field, it's assumed to be in the standard format
2. If not, the response is wrapped in a standard success structure

## Backend Implementation

### Response Formatting Middleware

The backend uses a response formatting middleware that intercepts all responses and ensures they follow the standard format.

### Success Response Helper

```javascript
// Using the sendSuccess helper
sendSuccess(res, 200, 'Items retrieved successfully', items);
```

### Error Response Helper

```javascript
// Using the sendError helper
sendError(res, 400, 'Invalid input', ['Field X is required']);
```

### Paginated Response Helper

```javascript
// Using the sendPaginated helper
sendPaginated(res, 200, 'Items retrieved successfully', items, page, limit, total);
```

## Guidelines for Developers

1. Always use the provided helper functions for sending responses from the backend
2. Always check for response success on the frontend before accessing data
3. Handle error responses appropriately, displaying messages to the user
4. Use the response utilities in the frontend for processing API responses

## Benefits

- Consistent error handling
- Simplified frontend data processing
- Reduced code duplication
- Better maintainability
- Improved debugging 