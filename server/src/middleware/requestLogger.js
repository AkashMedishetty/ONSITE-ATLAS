const logger = require('../utils/logger');

/**
 * Middleware to log all request details
 */
const requestLogger = (req, res, next) => {
  // Log all requests
  const { method, originalUrl, body, headers } = req;
  
  console.log(`\n----- Request: ${method} ${originalUrl} -----`);
  console.log('Headers:', JSON.stringify({
    'content-type': headers['content-type'],
    'authorization': headers['authorization'] ? 'Bearer [REDACTED]' : undefined
  }, null, 2));
  
  if (body && Object.keys(body).length > 0) {
    // Mask sensitive data
    const sanitizedBody = { ...body };
    if (sanitizedBody.password) sanitizedBody.password = '[REDACTED]';
    
    console.log('Body:', JSON.stringify(sanitizedBody, null, 2));
  }
  
  // Log response data too
  const originalSend = res.send;
  res.send = function(data) {
    console.log(`----- Response: ${res.statusCode} -----`);
    
    let responseData;
    try {
      responseData = JSON.parse(data);
      // Only log a small preview of large responses
      if (responseData && typeof responseData === 'object') {
        if (Array.isArray(responseData.data) && responseData.data.length > 3) {
          console.log(`Array response with ${responseData.data.length} items. First 2 items:`);
          console.log(JSON.stringify({
            ...responseData,
            data: responseData.data.slice(0, 2)
          }, null, 2));
        } else {
          console.log(JSON.stringify(responseData, null, 2));
        }
      }
    } catch (e) {
      // Not JSON data, just log the status
      console.log('Non-JSON response');
    }
    
    console.log('----- End of request -----\n');
    
    // Continue with the original send
    originalSend.call(this, data);
  };
  
  next();
};

module.exports = requestLogger; 