# API Error Tracking

This document tracks API errors encountered during development and the solutions implemented to handle them.

## Current Issues

### 1. Event Statistics Endpoint Failure (500 Error)

**Error:**
```
GET http://localhost:5000/api/events/67d9714...b5/statistics 500 (Internal Server Error)
Error: Cannot read properties of undefined (reading 'countDocuments')
    at [...]/server/src/controllers/event.controller.js:259:26
```

**Affected Components:**
- EventPortal.jsx
- ReportsPage.jsx
- Dashboard.jsx

**Root Cause:**
The server-side endpoint was attempting to use `countDocuments` on the Resource model, which was missing from the project.

**Server-Side Fixes:**
1. **Created Resource Model**:
   - Added new `Resource.js` model file with proper schema
   - Updated `models/index.js` to export the new Resource model

2. **Enhanced Error Handling in Controller**:
   - Added try/catch blocks to handle errors gracefully
   - Added null checks for Resource model before using it
   - Provided default values for statistics when collection is unavailable
   - Restructured response format to match client expectations

**Client-Side Solutions:**
1. **Fallback Data Fetching:**
   - Implemented fallback logic to fetch individual statistics when the combined endpoint fails
   - Added methods like `fetchIndividualStatistics()` to request data piece by piece

2. **Graceful Error Handling:**
   - Added comprehensive error handling with informative user messages
   - Set up empty state defaults so UI doesn't break when data is missing
   - Displaying partial data when some API calls succeed while others fail

3. **Loading States:**
   - Improved loading indicators to show which specific data is being loaded
   - Added inline loading for individual sections that may take longer to load

**Status: FIXED** ✅

### 2. ScannerStation Component Import Issues

**Error:**
Pre-transform error at line 37 regarding the placement of import statements and failure to resolve import for `react-qr-reader`.

**Solution:**
- Need to fix the component by moving import statements to the top of the file
- Verify the `react-qr-reader` package is properly installed
- Update npm dependencies if needed

### 3. Event Details Endpoint Failure (500 Error)

**Error:**
```
GET http://localhost:5000/api/events/67d9714cb0821a0dd28018b5 500 (Internal Server Error)
Error fetching event with ID 67d9714cb0821a0dd28018b5: AxiosError {message: 'Request failed with status code 500'...}
```

**Affected Components:**
- EventPortal.jsx
- AbstractDetail.jsx (potentially)
- Any component that fetches event by ID

**Root Cause:**
The getEventById endpoint in the event controller lacked proper error handling and MongoDB ID validation.

**Server-Side Fixes:**
1. **Enhanced Error Handling:**
   - Added try/catch blocks to handle potential errors gracefully
   - Added proper logging to trace issues
   - Implemented structured error responses

2. **Input Validation:**
   - Added validation for MongoDB ObjectID format
   - Improved response status codes and messages

**Status: FIXED** ✅

## Resolved Issues

### 1. Environment Variable References

**Error:**
References to `process.env` in Vite applications which should be `import.meta.env`.

**Solution:**
- Fixed all services to use `import.meta.env.VITE_API_URL` instead of `process.env`
- Standardized the API URL reference across all service files

### 2. Inconsistent Error Handling

**Error:**
Different approaches to error handling across services leading to inconsistent error messages and behavior.

**Solution:**
- Standardized error response format across all services:
  ```js
  {
    success: false,
    message: error.response?.data?.message || 'Default error message',
    data: null
  }
  ```
- Added fallback default values for empty responses
- Improved error logging with more context 