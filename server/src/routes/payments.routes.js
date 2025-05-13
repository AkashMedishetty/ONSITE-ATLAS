const express = require('express');
const paymentController = require('../controllers/paymentController');
const authController = require('../controllers/authController');

const router = express.Router();

// Public routes for processing payments
router.post('/process', paymentController.processPayment);
router.post('/verify', paymentController.verifyPayment);

// Public routes for accessing invoice and receipt
router.get('/:id/invoice', paymentController.getInvoice);
router.get('/:id/receipt', paymentController.getReceipt);

// Protected routes after this middleware
router.use(authController.protect);

// Admin and organizer routes
router.use('/gateways', authController.restrictTo('admin', 'organizer'));

router
  .route('/gateways')
  .get(paymentController.getPaymentGateways)
  .post(paymentController.createPaymentGateway);

router
  .route('/gateways/:id')
  .patch(paymentController.updatePaymentGateway)
  .delete(paymentController.deletePaymentGateway);

// Invoice template routes
router.use('/invoice-templates', authController.restrictTo('admin', 'organizer'));

router
  .route('/invoice-templates')
  .get(paymentController.getInvoiceTemplates)
  .post(paymentController.createInvoiceTemplate);

router
  .route('/invoice-templates/:id')
  .patch(paymentController.updateInvoiceTemplate)
  .delete(paymentController.deleteInvoiceTemplate);

// Payment management routes
router.use(authController.restrictTo('admin', 'organizer'));

router.get('/:id', paymentController.getPaymentById);
router.post('/:id/refund', paymentController.refundPayment);

module.exports = router; 