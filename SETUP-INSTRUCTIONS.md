# Onsite Atlas Setup Instructions

Follow these instructions to set up and run the Onsite Atlas conference management system locally.

## Prerequisites

- Node.js (v14 or later)
- npm or yarn
- MongoDB Atlas account (or local MongoDB instance)

## Project Structure

The project is organized into two main parts:

1. **Client** - Frontend React application with Vite
2. **Server** - Backend Express API with MongoDB

## Setup Steps

### 1. Clone the Repository (if you haven't already)

```bash
git clone <repository-url>
cd onsite-atlas
```

### 2. Server Setup

Navigate to the server directory:

```bash
cd server
```

Install dependencies:

```bash
npm install
```

Configure environment variables:
- The project includes a `.env` file with MongoDB connection details and JWT secrets
- If you prefer to use your own MongoDB database, update the `MONGODB_URI` in the `.env` file

Start the server:

```bash
npm run dev
```

The server should start on port 5000 with a connection to MongoDB Atlas.

### 3. Client Setup

Open a new terminal window and navigate to the client directory:

```bash
cd client
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The client should start on port 5173. You can access the application by opening `http://localhost:5173` in your browser.

## Troubleshooting

### MongoDB Connection Issues

If you encounter MongoDB connection issues, ensure:
1. The MongoDB URI in `.env` is correct
2. Your IP address is whitelisted in MongoDB Atlas Network Access settings
3. The username and password in the connection string are correct

### CORS Issues

If you encounter CORS issues when connecting the frontend to the backend, check:
1. The server's CORS configuration in `server/src/index.js`
2. The API URLs used in the frontend services

### React Component Errors

If you encounter React component errors:
1. Check the console for specific error messages
2. Make sure all required dependencies are installed
3. Verify import paths are correct

## Project Structure Details

### Client Structure

```
client/
├── src/
│   ├── components/  # Reusable UI components
│   ├── layouts/     # Layout components
│   ├── pages/       # Page components
│   ├── utils/       # Utility functions
│   ├── services/    # API service functions
│   ├── contexts/    # React context providers
│   ├── App.jsx      # Main application component
│   └── main.jsx     # Entry point
```

### Server Structure

```
server/
├── src/
│   ├── config/      # Configuration files (database, etc.)
│   ├── controllers/ # Route controllers
│   ├── middleware/  # Custom middleware
│   ├── models/      # Mongoose models
│   ├── routes/      # API routes
│   ├── services/    # Business logic
│   ├── utils/       # Utility functions
│   └── index.js     # Entry point
```

## Available API Endpoints

- Authentication: `/api/auth`
- Events: `/api/events`
- Categories: `/api/categories` and `/api/events/:eventId/categories`
- Abstracts: `/api/abstracts` and `/api/events/:eventId/abstracts`

For the full API documentation, check the server README or swagger documentation.

## Recent Fixes

1. Fixed React DOM prop warnings:
   - Added `BadgeTemplate` component to handle badge printing functionality
   - Updated import in `BadgePrintingPage.jsx` to use `BadgeTemplate` instead of `Badge`

2. Fixed "badgeFields.includes is not a function" error:
   - Updated `BadgesTab.jsx` to ensure `badgeFields` is always an array before calling `includes()`

## Next Steps

After setting up the project locally, you can:

1. Create a new event
2. Configure event settings
3. Add categories
4. Test the registration process
5. Explore badge printing functionality

Happy development! 