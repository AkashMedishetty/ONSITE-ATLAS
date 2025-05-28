const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect } = require('../middleware/auth.middleware');
const emailController = require('../controllers/email.controller');

// Email sending route using express-fileupload (req.files)
router.post('/send', protect, emailController.sendEmail);
router.post('/recipients', protect, emailController.getFilteredRecipients);
router.get('/history', protect, emailController.getEmailHistory);
router.get('/history-debug', protect, emailController.getEmailHistoryDebug);
router.get('/templates', protect, emailController.getTemplates);
router.post('/test-smtp', protect, emailController.testSmtpConfiguration);

// Email attachment uploads
router.post('/certificate-template', protect, emailController.uploadCertificateTemplate);
router.post('/brochure', protect, emailController.uploadBrochure);

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