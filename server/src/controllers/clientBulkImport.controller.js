const ImportJob = require('../models/ImportJob');
const { processBulkImportJob } = require('../services/registrationImportService');
const Event = require('../models/Event');
const mongoose = require('mongoose');

// POST /registrants
async function bulkImportClientRegistrants(req, res) {
  if (!req.client || !req.client.event) {
    return res.status(400).json({ success: false, message: 'Event context missing. Please re-login or contact support.' });
  }
  const eventId = req.client.event;
  const { registrations } = req.body;
  const userId = req.client._id || req.client.id || req.user?._id; // fallback for client user
  if (!Array.isArray(registrations) || registrations.length === 0) {
    return res.status(400).json({ success: false, message: 'No registrations provided.' });
  }
  // Force registrationType: 'complementary' for all records
  const processedRegistrations = registrations.map(r => ({ ...r, registrationType: 'complementary' }));
  try {
    // Validate event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }
    // Create ImportJob in DB
    const newJob = await ImportJob.create({
      eventId: eventId,
      totalRecords: processedRegistrations.length,
      status: 'pending',
      createdBy: userId || null,
      originalFileName: req.body.originalFileName || 'Client Bulk Import',
    });
    // Start async processing (force complementary type)
    processBulkImportJob(newJob._id, processedRegistrations, eventId, userId)
      .then(() => {})
      .catch(err => {
        // Log error, update job status if needed
        console.error(`[ClientBulkImport] Error in processBulkImportJob:`, err);
      });
    return res.status(202).json({ success: true, data: { jobId: newJob._id } });
  } catch (error) {
    console.error('[ClientBulkImport] Failed to create ImportJob:', error);
    return res.status(500).json({ success: false, message: 'Failed to start import process.', error: error.message });
  }
}

// GET /import-jobs/:jobId/status
async function getImportJobStatus(req, res) {
  const jobId = req.params.jobId;
  if (!jobId || !mongoose.Types.ObjectId.isValid(jobId)) {
    return res.status(400).json({ success: false, message: 'Valid Job ID is required.' });
  }
  try {
    const job = await ImportJob.findById(jobId);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }
    res.json({ success: true, data: job });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve job status.', error: error.message });
  }
}

module.exports = {
  bulkImportClientRegistrants,
  getImportJobStatus
}; 