const mongoose = require('mongoose');
const crypto = require('crypto');
const Registration = require('../models/Registration');
const ImportJob = require('../models/ImportJob');
const Event = require('../models/Event');
// Assuming Category model might be needed for validation or defaults, if not, it can be removed.
const Category = require('../models/Category'); 
const { getNextSequenceBlock } = require('../utils/counterUtils');
const logger = require('../config/logger'); // Assuming you have a logger

const BATCH_SIZE = 100; // Configurable batch size for inserts

/**
 * Processes a bulk import job for registrations.
 * This function is designed to be called asynchronously.
 * @param {string} jobId - The ID of the ImportJob document.
 * @param {Array<Object>} registrationsData - The raw array of registration data to import.
 * @param {string} eventId - The ID of the event.
 * @param {string} userId - The ID of the user who initiated the import.
 */
async function processBulkImportJob(jobId, registrationsData, eventId, userId) {
  let job;
  try {
    job = await ImportJob.findById(jobId);
    if (!job) {
      logger.error(`[ImportJob] Job ID ${jobId} not found. Aborting processing.`);
      return;
    }
    // ADDED: Log the first few items of registrationsData received
    logger.info(`[ImportJob-${jobId}] First 3 registrationsData received:`, JSON.stringify(registrationsData.slice(0,3), null, 2));

    job.status = 'processing';
    job.jobStartedAt = new Date();
    await job.save();

    const event = await Event.findById(eventId).lean();
    if (!event) {
      throw new Error(`Event with ID ${eventId} not found.`);
    }

    const registrationPrefix = event.registrationSettings?.idPrefix || 'REG';
    const idNumericLength = event.registrationSettings?.idNumericLength || 4;
    const configuredStartNumber = event.registrationSettings?.startNumber || 1;

    const recordsWithProvidedId = [];
    const recordsNeedingId = [];

    registrationsData.forEach((regData, index) => {
      // Preserve original file row number if provided by client
      const recordWithIndex = { ...regData, originalFileRowNumber: regData.originalFileRowNumber || (index + 1) };

      if (recordWithIndex.registrationId && String(recordWithIndex.registrationId).trim() !== '') {
        logger.info(`[ImportJob-${jobId}] Record (index ${index}, fileRegId '${recordWithIndex.registrationId}') classified for recordsWithProvidedId. Full regData:`, recordWithIndex);
        recordsWithProvidedId.push(recordWithIndex);
      } else {
        logger.info(`[ImportJob-${jobId}] Record (index ${index}, fileRegId '${recordWithIndex.registrationId}') classified for recordsNeedingId. Full regData:`, recordWithIndex);
        recordsNeedingId.push(recordWithIndex);
      }
    });

    logger.info(`[ImportJob-${jobId}] Segregated records: ${recordsWithProvidedId.length} with ID, ${recordsNeedingId.length} needing ID.`);

    const registrationsToCreate = [];
    const currentErrorDetails = []; // Accumulate errors for this job run

    // 1. Process records with provided IDs (validation only, no ID generation)
    for (const regData of recordsWithProvidedId) {
      const userProvidedId = String(regData.registrationId).trim();
      try {
        const existingReg = await Registration.findOne({ event: eventId, registrationId: userProvidedId }).lean();
        if (existingReg) {
          job.failedRecords++;
          currentErrorDetails.push({
            rowNumber: regData.originalFileRowNumber,
            message: `Provided Registration ID '${userProvidedId}' already exists for this event.`,
            rowData: regData,
            type: 'DUPLICATE_PROVIDED_ID_FOR_EVENT'
          });
        } else {
          registrationsToCreate.push({
            event: eventId,
            registrationId: userProvidedId,
            personalInfo: regData.personalInfo || {},
            // PATCH: Save professionalInfo if provided
            ...(regData.professionalInfo && { professionalInfo: regData.professionalInfo }),
            category: regData.category, 
            // PATCH: Save customFields if provided
            ...(regData.customFields && { customFields: regData.customFields }),
            // Preserve registrationType if provided (for client portal 'complementary')
            registrationType: regData.registrationType || 'imported',
            status: 'active',
            createdBy: userId,
            createdAt: regData.createdAt || new Date(),
            updatedAt: regData.updatedAt || new Date(),
            notes: regData.notes,
          });
        }
      } catch (error) {
        logger.error(`[ImportJob-${jobId}] Error validating provided ID '${userProvidedId}' for row ${regData.originalFileRowNumber}:`, error);
        job.failedRecords++;
        currentErrorDetails.push({
          rowNumber: regData.originalFileRowNumber,
          message: `Error validating provided ID '${userProvidedId}': ${error.message}`,
          rowData: regData,
          type: 'ERROR_VALIDATING_PROVIDED_ID'
        });
      }
      job.processedRecords++; // Mark as processed (attempted)
    }
    // Save intermediate progress for provided IDs
    if (recordsWithProvidedId.length > 0) {
        job.errorDetails = job.errorDetails.concat(currentErrorDetails.splice(0, currentErrorDetails.length)); // Add new errors
        await job.save();
    }

    // 2. Process records needing IDs (generation and preparation)
    if (recordsNeedingId.length > 0) {
      logger.info(`[ImportJob-${jobId}] Generating IDs for ${recordsNeedingId.length} records...`);
      const sequenceName = `${eventId}_registration_id`;
      
      let startingSequenceNum;
      try {
          // Corrected call to getNextSequenceBlock.
          // It internally handles finding the max existing ID and event's start number.
          startingSequenceNum = await getNextSequenceBlock(sequenceName, recordsNeedingId.length, configuredStartNumber);
          
          if (typeof startingSequenceNum !== 'number') {
              // This case should ideally be handled by getNextSequenceBlock throwing an error if it fails.
              logger.error(`[ImportJob-${jobId}] getNextSequenceBlock did not return a valid starting number. It returned: ${startingSequenceNum}. Failing job portion for these records.`);
              throw new Error('Failed to obtain a valid starting sequence number from getNextSequenceBlock.');
          }
          logger.info(`[ImportJob-${jobId}] Reserved block for ${sequenceName} starting at ${startingSequenceNum} (Count: ${recordsNeedingId.length}).`);
      } catch (counterError) {
          logger.error(`[ImportJob-${jobId}] Critical error obtaining sequence block for ${sequenceName}: ${counterError.message}.`);
          // Mark these records as failed
          recordsNeedingId.forEach(regData => {
            job.failedRecords++;
            job.processedRecords++; // Also mark as processed (attempted)
            job.errorDetails.push({
              rowNumber: regData.originalFileRowNumber,
              message: `Failed to generate ID: ${counterError.message}`,
              rowData: regData,
              type: 'ERROR_GENERATING_ID'
            });
          });
          // Save job state and skip ID generation for these if counter failed
          await job.save(); 
          // Continue to process other parts (e.g., if recordsWithProvidedId were successful)
          // but these specific recordsNeedingId will not be added to registrationsToCreate
      } // End of catch for getNextSequenceBlock

      if (typeof startingSequenceNum === 'number') { // Only proceed if sequence number was obtained
        for (let i = 0; i < recordsNeedingId.length; i++) {
          const regData = recordsNeedingId[i];
          const currentSequenceNum = startingSequenceNum + i;
          const formattedNumber = currentSequenceNum.toString().padStart(idNumericLength, '0');
          const generatedId = `${registrationPrefix}-${formattedNumber}`;

          registrationsToCreate.push({
            event: eventId,
            registrationId: generatedId,
            personalInfo: regData.personalInfo || {},
            // PATCH: Save professionalInfo if provided
            ...(regData.professionalInfo && { professionalInfo: regData.professionalInfo }),
            category: regData.category,
            // PATCH: Save customFields if provided
            ...(regData.customFields && { customFields: regData.customFields }),
            // Preserve registrationType if provided (for client portal 'complementary')
            registrationType: regData.registrationType || 'imported',
            status: 'active',
            createdBy: userId,
            createdAt: regData.createdAt || new Date(),
            updatedAt: regData.updatedAt || new Date(),
            notes: regData.notes,
          });
        } // End of for loop for recordsNeedingId
      } // End of if startingSequenceNum is a number
    } // End of if recordsNeedingId.length > 0
    
    logger.info(`[ImportJob-${jobId}] Total registrations prepared for actual DB insertion: ${registrationsToCreate.length}`);

    // 3. Batch insert all prepared registrations
    let overallProcessedCount = 0; // Tracks records processed from registrationsToCreate

    for (let i = 0; i < registrationsToCreate.length; i += BATCH_SIZE) {
      const batch = registrationsToCreate.slice(i, i + BATCH_SIZE);
      logger.info(`[ImportJob-${jobId}] Processing batch starting at index ${i}. Batch size: ${batch.length}. Total to create: ${registrationsToCreate.length}. Overall processed from creation list so far: ${overallProcessedCount}/${registrationsToCreate.length}`);
      
      let actuallyInsertedInThisBatch = 0;
      let failedInThisBatch = 0;

      try {
        if (batch.length > 0) {
          const insertedResult = await Registration.insertMany(batch, { ordered: false });
          actuallyInsertedInThisBatch = insertedResult.length;
          job.successfulRecords += actuallyInsertedInThisBatch;
          logger.info(`[ImportJob-${jobId}] insertMany completed for batch. Documents inserted (based on returned array length): ${actuallyInsertedInThisBatch}.`);

          if (actuallyInsertedInThisBatch < batch.length) {
            logger.warn(`[ImportJob-${jobId}] Discrepancy in batch insert (no error thrown, but fewer docs returned): Attempted ${batch.length}, Returned ${actuallyInsertedInThisBatch}.`);
            const attemptedIds = new Set(batch.map(b => b.registrationId));
            const returnedIds = new Set(insertedResult.map(doc => doc.registrationId));
            batch.forEach(recordInBatch => {
              if (!returnedIds.has(recordInBatch.registrationId)) {
                   job.failedRecords++;
                   failedInThisBatch++;
                   job.errorDetails.push({
                       rowNumber: recordInBatch.originalFileRowNumber || null,
                       message: 'Record was part of a batch insert, but was not confirmed as inserted (not in returned array from successful insertMany call). May be a duplicate or validation issue not throwing a full error.',
                       rowData: recordInBatch,
                       type: 'INSERT_NOT_CONFIRMED_IN_BATCH_NO_ERROR'
                   });
              }
            });
          }
          logger.info(`[ImportJob-${jobId}] Batch (start ${i}, size ${batch.length}) processed (no error path). Successful in batch: ${actuallyInsertedInThisBatch}, Failed in batch (discrepancy): ${failedInThisBatch}.`);
        }
      } catch (error) {
        logger.error(`[ImportJob-${jobId}] Error during batch insert starting at index ${i}:`, error.message);
        
        if (error.name === 'MongoBulkWriteError') {
          // Extract successes from the error result if available
          const numActuallyInsertedInBulkError = error.result && typeof error.result.nInserted === 'number' ? error.result.nInserted : 0;
          job.successfulRecords += numActuallyInsertedInBulkError;
          actuallyInsertedInThisBatch = numActuallyInsertedInBulkError; // Update for consistent failedInThisBatch calculation

          logger.warn(`[ImportJob-${jobId}] MongoBulkWriteError in batch. Reported successful inserts in this error: ${numActuallyInsertedInBulkError}. Write errors: ${error.writeErrors ? error.writeErrors.length : 'N/A'}.`);
          failedInThisBatch = batch.length - numActuallyInsertedInBulkError;
          job.failedRecords += failedInThisBatch;

          if (error.writeErrors) {
              error.writeErrors.forEach((err) => {
                const failedRecordData = batch[err.index]; // err.index is relative to the batch
                
                let detailedErrorMessage = err.errmsg; // Start with the most specific message
                if (!detailedErrorMessage && err.err) { // Fallback to nested error message
                  detailedErrorMessage = err.err.message;
                }
                if (!detailedErrorMessage) { // Fallback to a more generic message on the writeError itself
                  detailedErrorMessage = err.message;
                }
                if (!detailedErrorMessage) { // Ultimate fallback
                  detailedErrorMessage = 'Unknown database write error for this record.';
                }

                job.errorDetails.push({
                  rowNumber: failedRecordData?.originalFileRowNumber || null,
                  message: `Insert failed for record with fileRegId '${failedRecordData?.registrationId || 'N/A'}' (Code: ${err.code || 'N/A'}). Reason: ${detailedErrorMessage}`,
                  // problematicFields: extractProblematicFields(detailedErrorMessage), // Still commented out
                  rowData: failedRecordData,
                  type: 'DB_INSERT_ERROR' // Specific DB error from writeError
                });
              });
          } else if (failedInThisBatch > 0) {
              // If there are overall failures but no specific writeErrors, add generic messages for remaining non-inserted
              // This might happen if nInserted < batch.length but writeErrors is empty/undefined for some reason
              let trackedFailures = 0;
              batch.forEach((docInBatch, idx) => {
                  // A more robust way would be to check if docInBatch._id is in error.result.insertedIds (if that field exists)
                  // For now, if we know numActuallyInsertedInBulkError, we mark the rest as failed if not detailed in writeErrors.
                  // This part is to catch any remaining discrepancy if writeErrors doesn't cover all (batch.length - numActuallyInsertedInBulkError) failures.
                  // This simplistic fallback might create too many generic errors if writeErrors *are* comprehensive.
                  // A safer bet if writeErrors exist is to trust them for specific error details.
                  // This else if can be refined or removed if error.writeErrors is always reliable for all failures in a MongoBulkWriteError
              });
          }

        } else {
          // Generic error for the whole batch (not MongoBulkWriteError)
          logger.error(`[ImportJob-${jobId}] Non-MongoBulkWriteError for batch: ${error.message}`);
          failedInThisBatch = batch.length; // Assume all in batch failed
          job.failedRecords += failedInThisBatch;
          batch.forEach((docInBatch) => {
            job.errorDetails.push({
              rowNumber: docInBatch.originalFileRowNumber || null,
              message: `Batch processing error: ${error.message || 'Unknown error during batch processing.'}`,
              rowData: docInBatch,
              type: 'BATCH_PROCESSING_ERROR'
            });
          });
        }
        logger.info(`[ImportJob-${jobId}] Batch (start ${i}, size ${batch.length}) processed (error path). Successful in batch (from error obj): ${actuallyInsertedInThisBatch}, Failed in batch: ${failedInThisBatch}.`);
      }
      
      overallProcessedCount += batch.length;
      // Update job.processedRecords based on cumulative successes and failures from all sources (pre-checks + this batch)
      job.processedRecords = job.successfulRecords + job.failedRecords;

      // Periodically save job to update progress for polling
      if (i % (BATCH_SIZE * 5) === 0 || (i + batch.length) >= registrationsToCreate.length) { // Save every 5 batches or on the last batch
        try {
          await job.save();
          logger.info(`[ImportJob-${jobId}] Job progress saved. Processed: ${job.processedRecords}/${job.totalRecords}. Successful: ${job.successfulRecords}, Failed: ${job.failedRecords}`);
        } catch (saveError) {
          logger.error(`[ImportJob-${jobId}] CRITICAL: Failed to save job progress during batch processing:`, saveError);
          // Decide if we should abort or continue. For now, log and continue.
        }
      }
    }

    // Final status determination
    job.processedRecords = job.successfulRecords + job.failedRecords; // Final accurate count

    if (job.failedRecords > 0 && job.successfulRecords > 0) {
      job.status = 'partial_completion';
      if (!job.generalErrorMessage) job.generalErrorMessage = `Import completed with ${job.successfulRecords} successes and ${job.failedRecords} failures.`;
    } else if (job.totalRecords === 0) {
      job.status = 'completed'; // Or a specific status like 'no_data'
      job.generalErrorMessage = 'No data submitted for import.';
    } else if (job.status === 'processing') { // Fallback if still 'processing'
       // This case indicates an issue with the counting or flow, as all records should be accounted for.
       logger.warn(`[ImportJob-${jobId}] Job status determination ended in ambiguous state. S:${job.successfulRecords}, F:${job.failedRecords}, P:${job.processedRecords}, T:${job.totalRecords}`);
       if (job.failedRecords > 0 || job.successfulRecords < job.totalRecords) {
          job.status = 'failed'; // Default to failed if not clearly completed
          if(!job.generalErrorMessage) job.generalErrorMessage = 'Import did not complete as expected.';
       } else {
          job.status = 'completed'; // Should not happen if totalRecords > 0 and successfulRecords matches
       }
    }

    // Ensure processedRecords is the sum of successful and failed if it somehow diverged
    // This should be an assertion rather than a correction if logic above is perfect.
    if (job.processedRecords !== (job.successfulRecords + job.failedRecords)) {
        logger.warn(`[ImportJob-${jobId}] Discrepancy: Processed (${job.processedRecords}) != Successful (${job.successfulRecords}) + Failed (${job.failedRecords}). Adjusting processed.`);
        // It might be more correct to adjust failed based on processed and successful if processed is the source of truth for attempts.
        // job.processedRecords = job.successfulRecords + job.failedRecords;
    }

  } catch (error) {
    logger.error(`[ImportJob-${jobId}] Unrecoverable error in processBulkImportJob:`, error);
    if (job) {
      job.status = 'failed';
      job.generalErrorMessage = error.message || 'An unexpected error occurred during job processing.';
      // We will save in the finally block
    }
  } finally {
    if (job) {
      job.jobCompletedAt = new Date();
      try {
        await job.save();
        logger.info(`[ImportJob-${jobId}] Processing finished. Status: ${job.status}. Successful: ${job.successfulRecords}, Failed: ${job.failedRecords}`);
      } catch (saveError) {
        logger.error(`[ImportJob-${jobId}] CRITICAL: Failed to save final job state for job ${jobId}:`, saveError);
      }
    }
  }
}

module.exports = {
  processBulkImportJob,
};