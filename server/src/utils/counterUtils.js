const mongoose = require('mongoose');
const Registration = require('../models/Registration'); // Import Registration model

// Define the Counter Schema
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // Name of the sequence (e.g., 'eventId_registration_id')
  sequence_value: { type: Number, default: 0 }
});

// Create the Counter Model
const Counter = mongoose.model('Counter', counterSchema);

/**
 * Get the next sequence value for a given sequence name.
 * Atomically increments the sequence value.
 * @param {string} sequenceName - The name of the sequence (e.g., eventId + '_registration_id').
 * @param {number} startNumber - The number to start from if the sequence doesn't exist yet.
 * @returns {Promise<number>} - The next sequence value.
 */
const getNextSequenceValue = async (sequenceName, startNumber = 1) => {
  try {
    let counter = await Counter.findOneAndUpdate(
      { _id: sequenceName },
      { $setOnInsert: { _id: sequenceName, sequence_value: startNumber - 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    const eventId = sequenceName.split('_registration_id')[0];
    const eventSettings = await mongoose.model('Event').findById(eventId).select('registrationSettings.idPrefix registrationSettings.startNumber').lean();
    const prefix = eventSettings?.registrationSettings?.idPrefix || 'REG';
    const effectiveStartNumber = eventSettings?.registrationSettings?.startNumber ?? startNumber;
    
    let highestExistingNumber = 0;
    const aggregationResult = await Registration.aggregate([
      { $match: { 
          event: new mongoose.Types.ObjectId(eventId),
          registrationId: { $regex: `^${prefix}-` } 
      } },
      {
        $project: {
          numericPartStr: { // Keep as string initially for robust splitting
            $substrBytes: [
              "$registrationId",
              prefix.length + 1,
              -1 
            ]
          }
        }
      },
      // Filter out any that might not have a numeric part after prefix (defensive)
      { $match: { numericPartStr: { $regex: '^[0-9]+$' } } }, 
      {
        $project: {
          numericPart: { $toInt: "$numericPartStr" }
        }
      },
      { $sort: { numericPart: -1 } },
      { $limit: 1 }
    ]);

    if (aggregationResult.length > 0 && typeof aggregationResult[0].numericPart === 'number') {
      highestExistingNumber = aggregationResult[0].numericPart;
    }
    console.log(`[Agg] Highest existing ID number found for ${prefix} (event ${eventId}): ${highestExistingNumber}. Effective startNumber: ${effectiveStartNumber}`);

    const correctBaseValue = Math.max(highestExistingNumber, effectiveStartNumber - 1);
    
    if (counter.sequence_value < correctBaseValue) {
       console.log(`Counter ${sequenceName} value (${counter.sequence_value}) is lower than correct base (${correctBaseValue}). Updating...`);
       counter = await Counter.findByIdAndUpdate(
           sequenceName,
           { $set: { sequence_value: correctBaseValue } },
           { new: true }
       );
       console.log(`Counter ${sequenceName} updated to ${counter.sequence_value}.`);
    } else {
        console.log(`Counter ${sequenceName} value (${counter.sequence_value}) is already >= correct base (${correctBaseValue}). No update needed before increment.`);
    }

    const updatedCounter = await Counter.findByIdAndUpdate(
      sequenceName,
      { $inc: { sequence_value: 1 } },
      { new: true }
    );

    if (!updatedCounter) {
       throw new Error(`Counter ${sequenceName} not found after increment attempt.`);
    }

    console.log(`Returning next sequence value for ${sequenceName}: ${updatedCounter.sequence_value}`);
    return updatedCounter.sequence_value;

  } catch (error) {
    console.error(`Error getting next sequence value for ${sequenceName}:`, error);
    throw new Error('Failed to generate sequence number.');
  }
};

/**
 * Get a block of next sequence values for a given sequence name.
 * Atomically increments the sequence value by the count needed.
 * @param {string} sequenceName - The name of the sequence (e.g., eventId + '_registration_id').
 * @param {number} count - The number of sequence values needed.
 * @param {number} startNumber - The number to start from if the sequence doesn't exist yet.
 * @returns {Promise<number>} - The starting sequence value of the block.
 */
const getNextSequenceBlock = async (sequenceName, count, startNumber = 1) => {
  if (count <= 0) {
    throw new Error('Count must be greater than zero to get a sequence block.');
  }

  try {
    let counter = await Counter.findOneAndUpdate(
      { _id: sequenceName },
      { $setOnInsert: { _id: sequenceName, sequence_value: startNumber - 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    const eventId = sequenceName.split('_registration_id')[0];
    const eventSettings = await mongoose.model('Event').findById(eventId).select('registrationSettings.idPrefix registrationSettings.startNumber').lean();
    const prefix = eventSettings?.registrationSettings?.idPrefix || 'REG';
    const effectiveStartNumber = eventSettings?.registrationSettings?.startNumber ?? startNumber;

    let highestExistingNumber = 0;
    const aggregationResult = await Registration.aggregate([
      { $match: { 
          event: new mongoose.Types.ObjectId(eventId), 
          registrationId: { $regex: `^${prefix}-` } 
      } },
      {
        $project: {
          numericPartStr: { // Keep as string initially for robust splitting
            $substrBytes: [
              "$registrationId",
              prefix.length + 1,
              -1
            ]
          }
        }
      },
      { $match: { numericPartStr: { $regex: '^[0-9]+$' } } },
      {
        $project: {
          numericPart: { $toInt: "$numericPartStr" }
        }
      },
      { $sort: { numericPart: -1 } },
      { $limit: 1 }
    ]);

    if (aggregationResult.length > 0 && typeof aggregationResult[0].numericPart === 'number') {
      highestExistingNumber = aggregationResult[0].numericPart;
    }
    console.log(`[Block][Agg] Highest existing ID number for ${prefix} (event ${eventId}): ${highestExistingNumber}. Effective startNumber: ${effectiveStartNumber}`);
    
    const correctBaseValue = Math.max(highestExistingNumber, effectiveStartNumber - 1);
    if (counter.sequence_value < correctBaseValue) {
       console.log(`[Block] Counter ${sequenceName} value (${counter.sequence_value}) is lower than correct base (${correctBaseValue}). Updating...`);
       counter = await Counter.findByIdAndUpdate(
           sequenceName,
           { $set: { sequence_value: correctBaseValue } },
           { new: true }
       );
       console.log(`[Block] Counter ${sequenceName} updated to ${counter.sequence_value}.`);
    } else {
        console.log(`[Block] Counter ${sequenceName} value (${counter.sequence_value}) is already >= correct base (${correctBaseValue}). No update needed before increment.`);
    }

    const reservationAttemptTime = Date.now();
    const counterBeforeInc = await Counter.findByIdAndUpdate(
      sequenceName,
      { $inc: { sequence_value: count } },
      // Use new: false to get the document *before* the increment for the starting block value.
      // And use a write concern that ensures the operation is acknowledged by the primary.
      { new: false, writeConcern: { w: 'majority', wtimeout: 5000 } } 
    );

    if (!counterBeforeInc) {
       // This could happen if the document was deleted or if write concern failed.
       console.error(`[Block] CRITICAL: Counter ${sequenceName} not found or write concern failed during block increment attempt at ${reservationAttemptTime}.`);
       throw new Error(`Counter ${sequenceName} state uncertain during block increment.`);
    }
    
    const startingSequenceValue = counterBeforeInc.sequence_value + 1;
    console.log(`[Block] Reserved block for ${sequenceName} starting at ${startingSequenceValue} (Count: ${count}). Original counter val: ${counterBeforeInc.sequence_value}`);
    return startingSequenceValue;

  } catch (error) {
    console.error(`[Block] Error getting next sequence block for ${sequenceName}:`, error);
    throw new Error('Failed to generate sequence block.');
  }
};

module.exports = {
  getNextSequenceValue,
  getNextSequenceBlock
}; 