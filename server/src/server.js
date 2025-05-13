#!/usr/bin/env node

// Force Node.js to run this module to completion by exporting
// from the main module instead of just declaring variables
module.exports = {};

console.log('===== SERVER MODULE LOADED =====');

// Add clustering support for utilizing all CPU cores
const cluster = require('cluster');
const os = require('os');
const numCPUs = os.cpus().length;

// Determine if clustering should be enabled (can be controlled via env var)
const CLUSTERING_ENABLED = process.env.CLUSTERING_ENABLED !== 'false';

// If clustering is enabled and this is the master process
if (CLUSTERING_ENABLED && cluster.isMaster) {
  console.log(`Master process ${process.pid} is running`);
  console.log(`Server will utilize ${numCPUs} CPU cores`);
  
  // Fork workers based on number of CPUs
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
  
  // Handle worker exit and restart them
  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died (${signal || code}). Restarting...`);
    cluster.fork();
  });
  
  // Keep the master process alive
  setInterval(() => {
    console.log(`Master ${process.pid} is monitoring ${Object.keys(cluster.workers).length} workers`);
  }, 60000);
} else {
  // Worker process or clustering disabled - run the server
  try {
    console.log('Importing dependencies...');
    const mongoose = require('mongoose');
    const app = require('./app');
    const config = require('./config/config');
    const logger = require('./config/logger');
    const connectDB = require('./config/database');
    console.log('All dependencies imported successfully');

    console.log('===== SERVER INITIALIZATION STARTED =====');

    // Make these variables global to prevent garbage collection
    global.server = null;
    global.shutdownInProgress = false;

    // Connect to database and start server
    const startServer = async () => {
      console.log('startServer function called');
      
      try {
        // Connect to MongoDB
        console.log('Connecting to MongoDB...');
        const dbConnection = await connectDB();
        
        if (dbConnection) {
          console.log('Database connection successful');
        } else {
          console.log('Database connection failed, running in limited functionality mode');
        }

        console.log('Creating HTTP server...');
        // Start Express server
        global.server = app.listen(config.port, () => {
          console.log(`Server running on port ${config.port} in ${config.env} mode`);
          console.log(`Health check available at: http://localhost:${config.port}/health`);
          logger.info(`Server started on port ${config.port} in ${config.env} mode`);
        });

        console.log('HTTP server created, setting up error handlers...');
        
        // Handle server errors
        global.server.on('error', (error) => {
          console.error('Server error:', error);
          logger.error(`Server error: ${error.message}`);
        });

        console.log('Server error handlers set up');
        
        // Keep Node.js process alive
        process.stdin.resume();
        console.log('Process stdin resumed to keep process alive');
        
        // Handle unhandled promise rejections
        process.on('unhandledRejection', (reason, promise) => {
          console.error('Unhandled Rejection at:', promise, 'reason:', reason);
          logger.error(`Unhandled Rejection: ${reason}`);
          // Don't exit the process, just log the error
        });
        
        console.log('All event handlers have been set up');
        
        return global.server; // Return the server instance
      } catch (error) {
        console.error(`Server startup error: ${error.message}`);
        logger.error(`Server startup error: ${error.message}`);
        
        // Start the server anyway, even if database connection failed
        console.log('Starting server despite error...');
        global.server = app.listen(config.port, () => {
          console.log(`Server running in LIMITED MODE on port ${config.port} in ${config.env} mode`);
          console.log(`Health check available at: http://localhost:${config.port}/health`);
          logger.info(`Server started in LIMITED MODE on port ${config.port} in ${config.env} mode`);
        });
        
        return global.server;
      }
    };

    // This function helps ensure the server process stays alive
    function keepAlive() {
      if (global.shutdownInProgress) return;
      
      // Schedule next keepAlive call
      const timeout = setTimeout(keepAlive, 1000 * 10); // Every 10 seconds for debugging
      timeout.unref(); // Allow process to exit if this is the only thing keeping it alive during shutdown
      console.log('[KEEPALIVE] Keep-alive function called');
    }

    // Start keepAlive immediately
    console.log('Starting keep-alive mechanism...');
    keepAlive();

    // Keep the server running with a timer that never completes
    console.log('Setting up heartbeat interval...');
    const heartbeatTimer = setInterval(() => {
      if (!global.shutdownInProgress) {
        console.log("[DEBUG] Server heartbeat");
      }
    }, 15000).unref(); // Every 15 seconds, allow clean shutdown
    global.heartbeatTimer = heartbeatTimer;

    // Preserve reference to server instance
    global.serverInstance = null;

    // Make sure this main execution doesn't complete - keep process alive
    console.log('Setting up primary keep-alive timer...');
    const keepAliveTimer = setInterval(() => {
      // Do nothing; this just keeps the event loop active
      console.log('[MAIN TIMER] Server is still running');
    }, 20000); // Run every 20 seconds for debugging
    global.keepAliveTimer = keepAliveTimer;

    // Keep a reference to key objects to prevent garbage collection
    global.keepAliveReferences = { app, mongoose };

    // Start the server and store the instance
    console.log('Calling startServer function...');
    startServer()
      .then(instance => {
        global.serverInstance = instance;
        console.log('Server initialization complete and running');
        
        // Heartbeat logging
        const heartbeatInterval = setInterval(() => {
          const memoryUsage = process.memoryUsage();
          console.log(`[HEARTBEAT] Server is running. Memory usage: ${Math.round(memoryUsage.rss / 1024 / 1024)}MB`);
        }, 30000); // Log every 30 seconds
        
        // Store reference to prevent garbage collection
        global.heartbeatInterval = heartbeatInterval;
        
        // Export the server instance to prevent garbage collection
        module.exports.server = global.serverInstance;
        
        console.log('Server startup process completed');
      })
      .catch(error => {
        console.error('Failed to start server:', error);
      });

    console.log('Main module execution continues past server initialization');

    // Handle graceful shutdown
    const exitHandler = () => {
      console.log('Exit handler called');
      global.shutdownInProgress = true;
      
      if (global.server) {
        global.server.close(() => {
          logger.info('Server closed');
          
          // Clean up timers
          clearInterval(global.keepAliveTimer);
          clearInterval(global.heartbeatInterval);
          clearInterval(global.heartbeatTimer);
          
          process.exit(1);
        });
      } else {
        process.exit(1);
      }
    };

    const unexpectedErrorHandler = (error) => {
      console.error('Unexpected error occurred:', error);
      logger.error(error);
      exitHandler();
    };

    // Listen for termination signals
    process.on('SIGTERM', () => {
      console.log('SIGTERM received');
      logger.info('SIGTERM received');
      global.shutdownInProgress = true;
      
      if (global.server) {
        global.server.close(() => {
          console.log('Server closed after SIGTERM');
          process.exit(0);
        });
      } else {
        process.exit(0);
      }
    });

    process.on('SIGINT', () => {
      console.log('SIGINT received');
      logger.info('SIGINT received');
      global.shutdownInProgress = true;
      
      if (global.server) {
        global.server.close(() => {
          console.log('Server closed after SIGINT');
          process.exit(0);
        });
      } else {
        process.exit(0);
      }
    });

    // Only exit on critical errors
    process.on('uncaughtException', unexpectedErrorHandler);

    // Add server to exports to prevent garbage collection
    module.exports.serverInstance = global.serverInstance;

    console.log('===== SERVER INITIALIZATION FINISHED =====');
  } catch (error) {
    console.error('CRITICAL ERROR DURING SERVER INITIALIZATION:', error);
    throw error; // Re-throw to ensure it's visible
  }
} 