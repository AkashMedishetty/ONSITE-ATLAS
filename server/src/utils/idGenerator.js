const { Registration } = require('../models');
const { ApiError } = require('../middleware/errorHandler');

/**
 * Generate a unique registration ID based on event settings
 * @param {Object} event - Event document
 * @returns {Promise<String>} - Generated registration ID
 */
const generateRegistrationId = async (event) => {
  try {
    // Get prefix and start number from event settings
    const prefix = event.registrationSettings?.idPrefix || 'REG';
    const startNumber = event.registrationSettings?.startNumber || 1;
    
    // Find the highest registration number for this event
    const lastRegistration = await Registration.findOne({ event: event._id })
      .sort({ registrationId: -1 })
      .select('registrationId');
    
    let nextNumber = startNumber;
    
    if (lastRegistration) {
      // Extract the number part from the last registration ID
      const lastIdParts = lastRegistration.registrationId.split('-');
      if (lastIdParts.length > 1) {
        const lastNumber = parseInt(lastIdParts[lastIdParts.length - 1], 10);
        if (!isNaN(lastNumber)) {
          nextNumber = lastNumber + 1;
        }
      }
    }
    
    // Format the ID with padding
    const paddedNumber = nextNumber.toString().padStart(4, '0');
    const registrationId = `${prefix}-${paddedNumber}`;
    
    // Check if the generated ID already exists (just to be safe)
    const existingRegistration = await Registration.findOne({ registrationId });
    if (existingRegistration) {
      // If it exists, recursively try again with the next number
      return generateRegistrationId(event);
    }
    
    return registrationId;
  } catch (error) {
    throw new ApiError(500, 'Error generating registration ID', false, error.stack);
  }
};

module.exports = {
  generateRegistrationId
}; 