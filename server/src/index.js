const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const logger = require('./utils/logger');
const connectDB = require('./config/database');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const mongoose = require('mongoose');
const seedDatabase = require('./utils/seedData');
const requestLogger = require('./middleware/requestLogger');
const { responseFormatter } = require('./middleware/response.middleware');
const fileUpload = require('express-fileupload');
const announcementRoutes = require('./routes/announcementRoutes.js');

// Load environment variables
dotenv.config();

console.log('Starting Onsite Atlas API server...');
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`PORT: ${process.env.PORT || 5000}`);

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);
app.use(responseFormatter);

// Add file upload middleware
app.use(fileUpload({
  useTempFiles: true,
  tempFileDir: '/tmp/',
  createParentPath: true,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max file size
  abortOnLimit: true
}));

// Welcome route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Onsite Atlas API' });
});

// Health check route
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Routes
console.log('Setting up routes...');
try {
  // Debug routes (no authentication required)
  console.log('Loading debug routes...');
  app.use('/api/debug', require('./routes/debug.routes'));
  
  // Public routes for event landing pages and short URLs
  console.log('Loading public routes...');
  app.use('/api/public', require('./routes/public.routes'));
  
  console.log('Loading auth routes...');
  const authRoutes = require('./routes/auth.routes');
  app.use('/api/auth', authRoutes);
  
  // Registrant portal routes
  console.log('Loading registrant portal routes...');
  const registrantPortalRoutes = require('./routes/registrantPortalRoutes');
  app.use('/api/registrant-portal', registrantPortalRoutes);
  
  console.log('Loading events routes...');
  const eventRoutes = require('./routes/events.routes');
  app.use('/api/events', eventRoutes);

  // Mount category routes under events
  console.log('Loading category routes (under events)...');
  const categoryRoutes = require('./routes/categories.routes');
  app.use('/api/events/:eventId/categories', categoryRoutes);

  // Mount categories routes separately for direct access
  console.log('Loading category routes (direct access)...');
  app.use('/api/categories', categoryRoutes);

  // Mount abstract routes under events
  console.log('Loading abstract routes (under events)...');
  const abstractRoutes = require('./routes/abstracts.routes');
  app.use('/api/events/:eventId/abstracts', abstractRoutes);

  // Mount abstract routes separately for direct access
  console.log('Loading abstract routes (direct access)...');
  app.use('/api/abstracts', abstractRoutes);
  
  // Mount abstract workflow routes under events
  console.log('Loading abstract workflow routes (under events)...');
  const abstractWorkflowRoutes = require('./routes/abstractWorkflowRoutes');
  app.use('/api/events/:eventId/abstract-workflow', abstractWorkflowRoutes);

  // Mount abstract workflow routes separately for direct access
  console.log('Loading abstract workflow routes (direct access)...');
  app.use('/api/abstract-workflow', abstractWorkflowRoutes);

  // Registration and resource routes
  console.log('Loading registration routes...');
  const registrationRoutes = require('./routes/registration.routes');
  app.use('/api/registrations', registrationRoutes);
  
  // Add event-specific registration routes
  console.log('Loading event-specific registration routes...');
  app.use('/api/events/:eventId/registrations', registrationRoutes);
  
  console.log('Loading resource routes...');
  const resourceRoutes = require('./routes/resources.routes');
  app.use('/api/resources', resourceRoutes);
  
  console.log('Loading timeline route...');
  app.use('/api/timeline', require('./routes/timeline.routes'));
  
  // Mount additional routes
  console.log('Loading additional routes...');
  const badgeTemplateRoutes = require('./routes/badgeTemplate.routes');
  app.use('/api/badge-templates', badgeTemplateRoutes);

  // Add email routes
  console.log('Loading email routes...');
  const emailRoutes = require('./routes/email.routes');
  app.use('/api', emailRoutes);

  // Add payment routes
  console.log('Loading payment routes...');
  const paymentRoutes = require('./routes/payments.routes');
  app.use('/api/payments', paymentRoutes);
  
  // Add landing page routes
  console.log('Loading landing page routes...');
  const landingPageRoutes = require('./routes/landingPages.routes');
  app.use('/api/landing-pages', landingPageRoutes);
  
  // Add custom field routes
  console.log('Loading custom field routes...');
  const customFieldRoutes = require('./routes/customField.routes');
  app.use('/api/custom-fields', customFieldRoutes);
  
  // Add admin settings routes
  console.log('Loading admin settings routes...');
  const adminSettingsRoutes = require('./routes/adminSettings.routes');
  app.use('/api/admin-settings', adminSettingsRoutes);
  
  // Debug route to list all registered routes
  app.get('/api/routes-debug', (req, res) => {
    const routes = [];
    app._router.stack.forEach(middleware => {
      if (middleware.route) {
        // Routes registered directly on the app
        routes.push({
          path: middleware.route.path,
          method: Object.keys(middleware.route.methods)[0].toUpperCase()
        });
      } else if (middleware.name === 'router') {
        // Router middleware
        middleware.handle.stack.forEach(handler => {
          if (handler.route) {
            const path = handler.route.path;
            const method = Object.keys(handler.route.methods)[0].toUpperCase();
            routes.push({
              path: middleware.regexp.toString().includes('/api') ? '/api' + path : path,
              method
            });
          }
        });
      }
    });
    
    res.json({
      success: true,
      count: routes.length,
      routes: routes
    });
  });
  
  console.log('All routes loaded successfully.');
} catch (error) {
  console.error('Error loading routes:', error);
}

// 404 handler
app.use(notFound);

// Error handling middleware
app.use(errorHandler);

// Set port and start server
const PORT = process.env.PORT || 5000;

// Start server function
const startServer = async () => {
  console.log('Starting server...');
  try {
    // Connect to MongoDB Atlas
    console.log('Connecting to MongoDB Atlas...');
    
    try {
      await connectDB();
      console.log('MongoDB Atlas connection successful');
      
      // Seed the database with initial data
      if (process.env.NODE_ENV !== 'production') {
        await seedDatabase();
      }
      
      // Start server
      console.log('Starting HTTP server on port ' + PORT);
      const server = app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
        console.log('\nAPI endpoints available at:');
        console.log(`http://localhost:${PORT}/api/auth`);
        console.log(`http://localhost:${PORT}/api/events`);
        console.log(`http://localhost:${PORT}/api/registrant-portal`);
      });
      
      // Handle unhandled promise rejections
      process.on('unhandledRejection', (err) => {
        console.error(`Unhandled Rejection: ${err.message}`);
        logger.error(`Unhandled Rejection: ${err.message}`);
        console.error(err.stack);
        
        // Close server & exit process
        server.close(() => {
          console.error('Server closed due to unhandled promise rejection');
          process.exit(1);
        });
      });
      
    } catch (dbError) {
      console.error(`Fatal: Database connection failed: ${dbError.message}`);
      logger.error(`Fatal: Database connection failed: ${dbError.message}`);
      process.exit(1); // Exit with error code
    }
  } catch (error) {
    console.error(`Fatal error starting server: ${error.message}`);
    logger.error(`Fatal error starting server: ${error.message}`);
    process.exit(1);
  }
};

// Start the server
console.log('About to call startServer()...');
startServer().catch(err => {
  console.error('Unexpected error in startServer:', err);
  console.error(err.stack);
});
console.log('After startServer call (note: startServer is async)...');

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Promise Rejection: ${err.message}`);
  console.error(err.stack);
  logger.error(`Unhandled Promise Rejection: ${err.message}`);
  logger.error(err.stack);
  // Don't exit the process on unhandled rejections
  // Just log them instead
});

// Keep the main thread alive
console.log('Main thread continues...');
setInterval(() => {
  // This keeps the Node.js process running
}, 1000);

module.exports = app; 