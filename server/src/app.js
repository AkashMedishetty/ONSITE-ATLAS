const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const fileUpload = require('express-fileupload');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const routes = require('./routes');
const { errorConverter, errorHandler } = require('./middleware/error');
const { protect } = require('./middleware/auth.middleware');
const config = require('./config/config');
const path = require('path');
const mongoose = require('mongoose');
const logger = require('./utils/logger');

// Initialize express app
const app = express();

// Set security HTTP headers
app.use(helmet({
  contentSecurityPolicy: false // Disable for development
}));

// Set up rate limiting
// For 1500 concurrent users on a 4-core system:
// - Global rate limit: 500 requests per minute per IP
// - Stricter limits for authentication and abstract submission endpoints
const globalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 500, // 500 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Too many requests, please try again later'
  }
});

// Stricter rate limit for authentication routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Too many authentication attempts, please try again after 15 minutes'
  }
});

// Apply global rate limiter to all routes
app.use(globalLimiter);

// Apply stricter rate limit to authentication endpoints
app.use('/api/auth', authLimiter);
app.use('/api/registrant-portal/login', authLimiter);
app.use('/api/registrant-portal/forgot-password', authLimiter);
app.use('/api/registrant-portal/reset-password', authLimiter);

// Parse JSON request body
app.use(express.json({ limit: '10mb' }));

// Parse URL-encoded request body
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(cookieParser());

// Add File Upload Middleware
app.use(fileUpload());

// Sanitize request data
app.use(xss());
app.use(mongoSanitize());

// Enable gzip compression
app.use(compression());

// Enable CORS
app.use(cors({
  origin: 'http://localhost:5173', // Specify frontend origin
  credentials: true, // Allow cookies/auth headers
  exposedHeaders: ['Content-Disposition'] // Expose Content-Disposition header
}));

// Request logging
if (config.env !== 'test') {
  app.use(morgan('dev'));
}

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API routes
app.use('/api', routes);

// Add badge template routes explicitly here
try {
  console.log('Loading badge template routes in app.js...');
  const badgeTemplateRoutes = require('./routes/badge-templates.routes.js'); 
  app.use('/api/badge-templates', badgeTemplateRoutes);
  console.log('Badge template routes registered at /api/badge-templates');
} catch (error) {
  console.error('ERROR LOADING BADGE TEMPLATE ROUTES in app.js:', error);
}

// Add direct routes for resources and categories to handle various client path formats
const resourceRoutes = require('./routes/resources.routes');
const categoryRoutes = require('./routes/categories.routes');
const eventRoutes = require('./routes/event.routes');
const dashboardRoutes = require('./routes/dashboard.routes');

// Mount eventRoutes to handle all /api/events paths
// app.use('/api/events', eventRoutes); // Commented out potential conflict

// Direct route registration for key API endpoints that need to be accessible at the root level
app.use('/api/resources', resourceRoutes);
app.use('/api/categories', categoryRoutes);

// Add protected direct routes
app.use('/api/events/:id/dashboard', protect, (req, res, next) => {
  const { getEventDashboard } = require('./controllers/dashboard.controller');
  return getEventDashboard(req, res, next);
});

app.use('/api/events/:id/statistics', protect, (req, res, next) => {
  const { getEventStatistics } = require('./controllers/event.controller');
  return getEventStatistics(req, res, next);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Server is running',
    uptime: process.uptime(),
    timestamp: Date.now()
  });
});

// Handle 404
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Not found'
  });
});

// Convert errors to ApiError
// app.use(errorConverter);

// Handle errors
app.use(errorHandler);

module.exports = app; 