const Event = require('../models/Event');
const Registration = require('../models/Registration');
const Certificate = require('../models/Certificate');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const qrcode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const { createCanvas, loadImage } = require('canvas');
const PDFDocument = require('pdfkit');
const asyncHandler = require('express-async-handler');
const { sendSuccess } = require('../utils/responseFormatter');
const emailService = require('../services/emailService');

/**
 * Now supports attachments:
 * - Accepts attachments via req.files (multer)
 * - Sends attachments with emails using nodemailer
 * - Saves attachment info in email history
 *
 * @desc    Send email to filtered recipients
 * @route   POST /api/events/:eventId/emails/send
 * @access  Private
 */
exports.sendEmail = asyncHandler(async (req, res) => {
  console.log('[EMAIL SEND] Endpoint hit. req.body:', req.body, 'req.files:', req.files);
  const { eventId } = req.params;
  // express-fileupload: req.files.attachments can be a single file or array
  let attachments = [];
  if (req.files && req.files.attachments) {
    const files = Array.isArray(req.files.attachments) ? req.files.attachments : [req.files.attachments];
    // Save files to disk and build attachments array for nodemailer
    const uploadDir = require('path').join(__dirname, '../../public/uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    attachments = files.map(file => {
      const filePath = require('path').join(uploadDir, file.name);
      fs.writeFileSync(filePath, file.data);
      return {
        filename: file.name,
        path: filePath
      };
    });
  }
  // Parse email and filters from req.body (may be JSON strings)
  let email = req.body.email;
  let filters = req.body.filters;
  if (typeof email === 'string') email = JSON.parse(email);
  if (typeof filters === 'string') filters = JSON.parse(filters);
  
  // Get event with email settings
  const event = await Event.findById(eventId);
  if (!event) {
    return res.status(404).json({
      success: false,
      message: 'Event not found'
    });
  }

  // Check if email settings are configured
  if (!event.emailSettings || !event.emailSettings.enabled) {
    return res.status(400).json({
      success: false,
      message: 'Email settings are not enabled for this event'
    });
  }

  // Find recipients based on filters
  let query = { event: eventId };
  let recipients = [];
  
  // Apply category filter
  if (filters.categories && filters.categories.length > 0) {
    query.category = { $in: filters.categories };
  }
  
  // Apply workshop filter
  if (filters.workshopFilter === 'withWorkshop') {
    query['registrationType'] = 'workshop';
  } else if (filters.workshopFilter === 'withoutWorkshop') {
    query['registrationType'] = { $ne: 'workshop' };
  }
  
  // If specific emails are provided, use those instead of filters
  if (filters.specificEmails && filters.specificEmails.length > 0) {
    const specificRegistrations = await Registration.find({
      event: eventId,
      'personalInfo.email': { $in: filters.specificEmails }
    }).populate('category');
    
    recipients = specificRegistrations;
    
    // For emails that don't have registrations, create placeholder objects
    const registrationEmails = specificRegistrations.map(r => r.personalInfo.email);
    const missingEmails = filters.specificEmails.filter(email => !registrationEmails.includes(email));
    
    missingEmails.forEach(email => {
      recipients.push({
        personalInfo: {
          firstName: 'Recipient',
          lastName: '',
          email: email
        },
        registrationId: 'MANUAL',
        category: { name: 'Manual Entry' }
      });
    });
  } else {
    recipients = await Registration.find(query).populate('category');
  }
  
  if (recipients.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No recipients match the specified criteria'
    });
  }

  // Configure nodemailer with SMTP settings
  const transporter = nodemailer.createTransport({
    host: event.emailSettings.smtpHost,
    port: event.emailSettings.smtpPort || 587,
    secure: event.emailSettings.smtpSecure || false,
    auth: {
      user: event.emailSettings.smtpUser,
      pass: event.emailSettings.smtpPassword
    }
  });

  // Create a record of this email batch
  const emailBatch = {
    subject: email.subject,
    date: new Date(),
    recipients: recipients.length,
    status: 'pending',
    attachments: attachments.map(f => ({ filename: f.filename, path: f.path }))
  };

  if (!event.emailHistory) {
    event.emailHistory = [];
  }
  
  event.emailHistory.unshift(emailBatch);
  await event.save();

  // Send emails to all recipients
  let sentCount = 0;
  let failedCount = 0;
  const errors = [];

  for (const recipient of recipients) {
    try {
      // Replace placeholders in template
      const personalInfo = recipient.personalInfo || {};
      let emailBody = email.body;
      
      // Replace placeholders with recipient data
      emailBody = emailBody
        .replace(/{{firstName}}/g, personalInfo.firstName || 'Attendee')
        .replace(/{{lastName}}/g, personalInfo.lastName || '')
        .replace(/{{registrationId}}/g, recipient.registrationId || '')
        .replace(/{{eventName}}/g, event.name)
        .replace(/{{eventDate}}/g, formatDate(event.startDate))
        .replace(/{{eventVenue}}/g, event.venue ? `${event.venue.name}, ${event.venue.city}` : 'TBA');
      
      // Generate QR code if requested
      if (emailBody.includes('[QR_CODE]') && recipient._id) {
        try {
          const qrCodeDataUrl = await generateQRCode(recipient._id, event._id);
          emailBody = emailBody.replace('[QR_CODE]', `<img src="${qrCodeDataUrl}" alt="Registration QR Code" style="max-width: 200px; height: auto;" />`);
        } catch (qrError) {
          console.error('Error generating QR code:', qrError);
          emailBody = emailBody.replace('[QR_CODE]', '[QR code could not be generated]');
        }
      } else {
        emailBody = emailBody.replace('[QR_CODE]', '');
      }
      
      // Configure email options
      const mailOptions = {
        from: `"${event.emailSettings.senderName}" <${event.emailSettings.senderEmail}>`,
        to: personalInfo.email,
        subject: email.subject
          .replace(/{{eventName}}/g, event.name)
          .replace(/{{firstName}}/g, personalInfo.firstName || 'Attendee'),
        html: emailBody,
        attachments: attachments
      };
      
      // Add reply-to if configured
      if (event.emailSettings.replyToEmail) {
        mailOptions.replyTo = event.emailSettings.replyToEmail;
      }
      
      // Send email
      await transporter.sendMail(mailOptions);
      sentCount++;
    } catch (error) {
      failedCount++;
      errors.push({
        email: recipient.personalInfo.email,
        error: error.message
      });
    }
  }

  // Update email batch status
  event.emailHistory[0].status = failedCount === 0 ? 'completed' : 'completed_with_errors';
  event.emailHistory[0].sent = sentCount;
  event.emailHistory[0].failed = failedCount;
  await event.save();

  return res.status(200).json({
    success: true,
    message: `Email sent to ${sentCount} recipients (${failedCount} failed)`,
    data: {
      sent: sentCount,
      failed: failedCount,
      errors
    }
  });
});

/**
 * @desc    Get filtered recipients for email preview
 * @route   POST /api/events/:eventId/emails/recipients
 * @access  Private
 */
exports.getFilteredRecipients = asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  const filters = req.body;
  
  // Set up base query
  let query = { event: eventId };
  
  // Apply category filter
  if (filters.categories && filters.categories.length > 0) {
    query.category = { $in: filters.categories };
  }
  
  // Apply workshop filter
  if (filters.workshopFilter === 'withWorkshop') {
    query['registrationType'] = 'workshop';
  } else if (filters.workshopFilter === 'withoutWorkshop') {
    query['registrationType'] = { $ne: 'workshop' };
  }
  
  // Get count of matching registrations
  const count = await Registration.countDocuments(query);
  
  // Get sample of recipients for preview
  const recipients = await Registration.find(query)
    .populate('category', 'name')
    .select('personalInfo.firstName personalInfo.lastName personalInfo.email personalInfo.organization registrationId')
    .limit(10);
  
  return res.status(200).json({
    success: true,
    data: {
      totalCount: count,
      sample: recipients
    }
  });
});

/**
 * @desc    Get email history for an event
 * @route   GET /api/events/:eventId/emails/history
 * @access  Private
 */
exports.getEmailHistory = asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  
  const event = await Event.findById(eventId);
  if (!event) {
    return res.status(404).json({
      success: false,
      message: 'Event not found'
    });
  }
  
  return res.status(200).json({
    success: true,
    data: event.emailHistory || []
  });
});

/**
 * @desc    Get email history debug for an event
 * @route   GET /api/events/:eventId/emails/history-debug
 * @access  Private
 */
exports.getEmailHistoryDebug = asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  
  try {
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Email history retrieved successfully',
      data: event.emailHistory || [],
      debug: {
        eventId,
        hasEmailHistory: Boolean(event.emailHistory),
        historyLength: event.emailHistory ? event.emailHistory.length : 0
      }
    });
  } catch (error) {
    console.error('Error retrieving email history debug:', error);
    return res.status(200).json({
      success: true,
      message: 'Error retrieving email history',
      data: [],
      error: error.message
    });
  }
});

/**
 * @desc    Get email templates for an event
 * @route   GET /api/events/:eventId/emails/templates
 * @access  Private
 */
exports.getTemplates = asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  
  const event = await Event.findById(eventId);
  if (!event) {
    return res.status(404).json({
      success: false,
      message: 'Event not found'
    });
  }
  
  // Return the email templates
  return res.status(200).json({
    success: true,
    data: event.emailSettings?.templates || {}
  });
});

/**
 * @desc    Test SMTP configuration
 * @route   POST /api/events/:eventId/emails/test-smtp
 * @access  Private
 */
exports.testSmtpConfiguration = asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  const user = req.user;
  console.log('[testSmtpConfiguration] Called with eventId:', eventId, 'by user:', user ? user.email : 'unknown');

  if (!req.body.testEmail) {
    console.error('[testSmtpConfiguration] No testEmail provided in request body:', req.body);
    return res.status(400).json({
      success: false,
      message: 'Test email address is required'
    });
  }

  const event = await Event.findById(eventId);
  if (!event) {
    console.error('[testSmtpConfiguration] Event not found for eventId:', eventId);
    return res.status(404).json({ success: false, message: 'Event not found' });
  }

  // Check for all required SMTP fields
  const es = event.emailSettings || {};
  const missingFields = [];
  if (!es.enabled) missingFields.push('enabled');
  if (!es.smtpHost) missingFields.push('smtpHost');
  if (!es.smtpPort) missingFields.push('smtpPort');
  if (!es.smtpUser) missingFields.push('smtpUser');
  if (!es.smtpPassword) missingFields.push('smtpPassword');
  if (!es.senderName) missingFields.push('senderName');
  if (!es.senderEmail) missingFields.push('senderEmail');

  if (missingFields.length > 0) {
    console.error('[testSmtpConfiguration] Missing SMTP fields:', missingFields);
    return res.status(400).json({
      success: false,
      message: 'SMTP settings are not fully configured. Missing: ' + missingFields.join(', ')
    });
  }

  // Log SMTP config (mask password)
  console.log('[testSmtpConfiguration] SMTP config:', {
    smtpHost: es.smtpHost,
    smtpPort: es.smtpPort,
    smtpUser: es.smtpUser,
    smtpSecure: es.smtpSecure,
    senderName: es.senderName,
    senderEmail: es.senderEmail,
    replyToEmail: es.replyToEmail,
    enabled: es.enabled
  });

  try {
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      host: es.smtpHost,
      port: es.smtpPort,
      secure: es.smtpSecure,
      auth: {
        user: es.smtpUser,
        pass: es.smtpPassword
      }
    });

    // Log test email details
    console.log('[testSmtpConfiguration] Sending test email to:', req.body.testEmail);

    const info = await transporter.sendMail({
      from: `"${es.senderName}" <${es.senderEmail}>`,
      to: req.body.testEmail,
      subject: `Test Email from ${event.name}`,
      html: `
        <h1>SMTP Configuration Test</h1>
        <p>This is a test email from ${event.name} to verify that your SMTP configuration is working correctly.</p>
        <p>If you received this email, your email settings are configured correctly!</p>
      `
    });

    console.log('[testSmtpConfiguration] Test email sent. MessageId:', info.messageId);
    return res.status(200).json({
      success: true,
      message: `Test email sent successfully to ${req.body.testEmail}`,
      data: {
        messageId: info.messageId
      }
    });
  } catch (error) {
    console.error('[testSmtpConfiguration] Error sending test email:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send test email',
      error: error.message
    });
  }
});

/**
 * @desc    Upload certificate template
 * @route   POST /api/events/:eventId/emails/certificate-template
 * @access  Private
 */
exports.uploadCertificateTemplate = asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded'
    });
  }
  
  const event = await Event.findById(eventId);
  if (!event) {
    return res.status(404).json({
      success: false,
      message: 'Event not found'
    });
  }
  
  // Save the file path to the event's email settings
  if (!event.emailSettings) {
    event.emailSettings = {};
  }
  
  event.emailSettings.certificateTemplate = req.file.path;
  await event.save();
  
  return res.status(200).json({
    success: true,
    message: 'Certificate template uploaded successfully',
    data: {
      filePath: req.file.path
    }
  });
});

/**
 * @desc    Upload scientific brochure
 * @route   POST /api/events/:eventId/emails/brochure
 * @access  Private
 */
exports.uploadBrochure = asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded'
    });
  }
  
  const event = await Event.findById(eventId);
  if (!event) {
    return res.status(404).json({
      success: false,
      message: 'Event not found'
    });
  }
  
  // Save the file path to the event's email settings
  if (!event.emailSettings) {
    event.emailSettings = {};
  }
  
  event.emailSettings.scientificBrochure = req.file.path;
  await event.save();
  
  return res.status(200).json({
    success: true,
    message: 'Scientific brochure uploaded successfully',
    data: {
      filePath: req.file.path
    }
  });
});

/**
 * @desc    Validate certificate authenticity
 * @route   GET /api/certificates/validate/:certificateId
 * @access  Public
 */
exports.validateCertificate = asyncHandler(async (req, res) => {
  const { certificateId } = req.params;
  
  // Get IP address for tracking validation
  const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || null;
  
  // Find certificate
  const certificate = await Certificate.findOne({ certificateId })
    .populate('event', 'name startDate endDate')
    .populate('registration', 'personalInfo');
  
  if (!certificate) {
    return res.status(404).json({
      success: false,
      message: 'Certificate not found or invalid',
      verified: false
    });
  }
  
  // Record verification
  certificate.verified.push({
    date: new Date(),
    ipAddress
  });
  
  await certificate.save();
  
  return res.status(200).json({
    success: true,
    message: 'Certificate successfully verified',
    verified: true,
    data: {
      certificateId: certificate.certificateId,
      recipient: certificate.recipientName,
      eventName: certificate.eventName,
      eventDate: certificate.event ? `${formatDate(certificate.event.startDate)} - ${formatDate(certificate.event.endDate)}` : 'Not available',
      issueDate: formatDate(certificate.issueDate),
      verifications: certificate.verified.length
    }
  });
});

/**
 * Helper function to format a date
 */
function formatDate(date) {
  if (!date) return '';
  
  const dateObj = new Date(date);
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Helper function to generate QR code
 */
async function generateQRCode(registrationId, eventId) {
  try {
    const qrData = JSON.stringify({
      registrationId,
      eventId: eventId.toString(),
      timestamp: Date.now()
    });
    
    return await qrcode.toDataURL(qrData);
  } catch (err) {
    console.error('Error generating QR code:', err);
    throw err;
  }
}

/**
 * Supported template placeholders:
 *   {{firstName}}, {{lastName}}, {{registrationId}}, {{eventName}}, {{eventDate}}, {{eventVenue}}, [QR_CODE]
 *
 * @desc    Update email templates for an event
 * @route   PUT /api/events/:eventId/emails/templates
 * @access  Private
 */
exports.updateTemplates = asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  const { templates } = req.body;

  if (!templates || typeof templates !== 'object') {
    return res.status(400).json({
      success: false,
      message: 'Templates object is required'
    });
  }

  // Define required placeholders for each template type
  const requiredPlaceholders = {
    registration: ['{{firstName}}', '{{eventName}}', '{{registrationId}}', '[QR_CODE]'],
    reminder: ['{{firstName}}', '{{eventName}}', '{{eventDate}}', '{{eventVenue}}'],
    certificate: ['{{firstName}}', '{{eventName}}'],
    workshop: ['{{firstName}}', '{{eventName}}', '{{workshopTitle}}', '{{workshopDate}}', '{{workshopTime}}', '{{workshopLocation}}'],
    scientificBrochure: ['{{firstName}}', '{{eventName}}'],
    custom: ['{{firstName}}', '{{eventName}}']
  };

  // Validate each template
  for (const [templateName, fields] of Object.entries(templates)) {
    const required = requiredPlaceholders[templateName] || [];
    const body = fields.body || '';
    for (const placeholder of required) {
      if (!body.includes(placeholder)) {
        return res.status(400).json({
          success: false,
          message: `Template '${templateName}' is missing required placeholder: ${placeholder}`
        });
      }
    }
  }

  const event = await Event.findById(eventId);
  if (!event) {
    return res.status(404).json({
      success: false,
      message: 'Event not found'
    });
  }

  event.emailSettings = event.emailSettings || {};
  event.emailSettings.templates = templates;
  await event.save();

  return res.status(200).json({
    success: true,
    message: 'Email templates updated successfully',
    data: event.emailSettings.templates
  });
});

/**
 * @desc    Update SMTP settings for an event
 * @route   PUT /api/events/:eventId/emails/smtp-settings
 * @access  Private
 */
exports.updateSmtpSettings = asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  const smtpFields = [
    'enabled', 'senderName', 'senderEmail', 'replyToEmail',
    'smtpHost', 'smtpPort', 'smtpUser', 'smtpPassword', 'smtpSecure'
  ];
  const event = await Event.findById(eventId);
  if (!event) {
    return res.status(404).json({
      success: false,
      message: 'Event not found'
    });
  }
  event.emailSettings = event.emailSettings || {};
  smtpFields.forEach(field => {
    if (req.body[field] !== undefined) {
      event.emailSettings[field] = req.body[field];
    }
  });
  await event.save();
  return res.status(200).json({
    success: true,
    message: 'SMTP settings updated successfully',
    data: event.emailSettings
  });
}); 