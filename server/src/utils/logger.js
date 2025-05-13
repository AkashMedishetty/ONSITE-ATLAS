const winston = require('winston');
const { format, transports } = winston;
const path = require('path');
const fs = require('fs');

// Create logs directory if it doesn't exist
try {
  const logsDir = path.join(process.cwd(), 'logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir);
    console.log('Created logs directory at:', logsDir);
  }
} catch (error) {
  console.error('Error creating logs directory:', error);
  // Don't exit, continue with just console logging
}

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

// Define log level based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  return env === 'development' ? 'debug' : 'info';
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue'
};

// Add colors to Winston
winston.addColors(colors);

// Custom format for console output
const consoleFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.colorize({ all: true }),
  format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
);

// Custom format for file output
const fileFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.json()
);

// Define transport options
const transportOptions = [
  new transports.Console({
    format: consoleFormat
  })
];

// Add file transport in production
if (process.env.NODE_ENV === 'production') {
  transportOptions.push(
    new transports.File({
      filename: path.join('logs', 'error.log'),
      level: 'error',
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    new transports.File({
      filename: path.join('logs', 'combined.log'),
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  );
}

// Create logger instance
const logger = winston.createLogger({
  level: level(),
  levels,
  transports: transportOptions,
  exitOnError: false
});

// Create a stream object for Morgan HTTP logger
logger.stream = {
  write: (message) => logger.http(message.trim()),
};

// Define exception handlers
const exceptionHandlers = [];
const rejectionHandlers = [];

// Try to add exception and rejection handlers
try {
  exceptionHandlers.push(new transports.File({
    filename: path.join('logs', 'exceptions.log'),
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }));
  
  rejectionHandlers.push(new transports.File({
    filename: path.join('logs', 'rejections.log'),
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }));
} catch (error) {
  console.error('Error setting up exception/rejection handlers:', error);
  // Continue with just console handling
}

// Create the logger
const loggerInstance = winston.createLogger({
  level: level(),
  levels,
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
  ),
  transports: transportOptions,
  exceptionHandlers,
  rejectionHandlers,
  exitOnError: false,
});

// Export logger
module.exports = loggerInstance; 