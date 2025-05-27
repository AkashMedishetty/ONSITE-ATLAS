const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect } = require('../middleware/auth.middleware');
const emailController = require('../controllers/email.controller');
const multer = require('multer');
const path = require('path');

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter for allowed types and size
const allowedMimeTypes = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' // .xlsx
];

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB per file
  fileFilter: function (req, file, cb) {
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(new Error('Only PDF, PNG, JPG, JPEG, DOCX, and XLSX files are allowed.'));
    }
    cb(null, true);
  }
});

// Email sending routes (now as subrouter, no /events/:eventId/emails prefix)
router.post('/send', protect, upload.array('attachments'), emailController.sendEmail);
router.post('/recipients', protect, emailController.getFilteredRecipients);
router.get('/history', protect, emailController.getEmailHistory);
router.get('/history-debug', protect, emailController.getEmailHistoryDebug);
router.get('/templates', protect, emailController.getTemplates);
router.post('/test-smtp', protect, emailController.testSmtpConfiguration);

// Email attachment uploads
router.post('/certificate-template', protect, upload.single('templateFile'), emailController.uploadCertificateTemplate);
router.post('/brochure', protect, upload.single('brochureFile'), emailController.uploadBrochure);

// Certificate validation (public route)
router.get('/certificates/validate/:certificateId', emailController.validateCertificate);

// Email templates
router.put('/templates', protect, emailController.updateTemplates);
router.put('/smtp-settings', protect, emailController.updateSmtpSettings);

// Image upload for email templates (local storage)
router.post('/upload-image', (req, res, next) => {
  console.log('[UPLOAD IMAGE] Called');
  console.log('[UPLOAD IMAGE] req.headers:', req.headers); // Debug log
  console.log('[UPLOAD IMAGE] req.body:', req.body); // Debug log
  upload.single('image')(req, res, function (err) {
    if (err) {
      console.error('[UPLOAD IMAGE] Multer error:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
    if (!req.file) {
      console.error('[UPLOAD IMAGE] No file uploaded');
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    const url = `/uploads/${req.file.filename}`;
    console.log('[UPLOAD IMAGE] Success:', url);
    return res.status(200).json({ success: true, url });
  });
});

module.exports = router; 