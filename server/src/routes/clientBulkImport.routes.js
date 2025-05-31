const express = require('express');
const router = express.Router();
const { bulkImportClientRegistrants, getImportJobStatus } = require('../controllers/clientBulkImport.controller');
const { protectClient } = require('../middleware/auth.middleware');

// POST /api/client-bulk-import/registrants
router.post('/registrants', protectClient, bulkImportClientRegistrants);

// GET /api/client-bulk-import/import-jobs/:jobId/status
router.get('/import-jobs/:jobId/status', protectClient, getImportJobStatus);

module.exports = router; 