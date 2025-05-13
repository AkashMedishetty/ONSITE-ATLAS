const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const logger = require('./logger');

let mongod = null;

/**
 * Connect to an in-memory MongoDB instance
 * @returns {Promise<Object>} Mongoose connection
 */
const connectInMemoryDB = async () => {
  try {
    // Create in-memory MongoDB server
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    
    console.log('Connecting to in-memory MongoDB...');
    logger.info('Connecting to in-memory MongoDB...');
    
    // Connect to the in-memory database
    const connection = await mongoose.connect(uri);
    
    console.log(`In-memory MongoDB Connected: ${connection.connection.host}`);
    logger.info(`In-memory MongoDB Connected: ${connection.connection.host}`);
    
    return connection;
  } catch (error) {
    console.error(`Error connecting to in-memory MongoDB: ${error.message}`);
    logger.error(`Error connecting to in-memory MongoDB: ${error.message}`);
    throw error;
  }
};

/**
 * Stop the in-memory MongoDB instance
 */
const stopInMemoryDB = async () => {
  if (mongod) {
    await mongoose.connection.close();
    await mongod.stop();
    console.log('In-memory MongoDB instance stopped');
    logger.info('In-memory MongoDB instance stopped');
  }
};

module.exports = {
  connectInMemoryDB,
  stopInMemoryDB
}; 