const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { sendEmail, getEmailTemplates, saveEmailTemplate } = require('../controllers/email.controller');
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

const upload = multer({ storage: storage });

// Email sending routes
router.post('/events/:eventId/emails/send', protect, emailController.sendEmail);
router.post('/events/:eventId/emails/recipients', protect, emailController.getFilteredRecipients);
router.get('/events/:eventId/emails/history', protect, emailController.getEmailHistory);

// Debug route
router.get('/events/:eventId/emails/history-debug', protect, emailController.getEmailHistoryDebug);

router.get('/events/:eventId/emails/templates', protect, emailController.getTemplates);
router.post('/events/:eventId/emails/test-smtp', protect, emailController.testSmtpConfiguration);

// Email attachment uploads
router.post(
  '/events/:eventId/emails/certificate-template',
  protect,
  upload.single('templateFile'),
  emailController.uploadCertificateTemplate
);

router.post(
  '/events/:eventId/emails/brochure',
  protect,
  upload.single('brochureFile'),
  emailController.uploadBrochure
);

// Certificate validation (public route)
router.get('/certificates/validate/:certificateId', emailController.validateCertificate);

// Send email
router.post('/send', protect, sendEmail);

// Email templates
router.route('/templates')
  .get(protect, getEmailTemplates)
  .post(protect, saveEmailTemplate);

module.exports = router; 