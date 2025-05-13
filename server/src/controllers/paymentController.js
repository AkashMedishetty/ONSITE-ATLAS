const { PaymentGateway, Payment, InvoiceTemplate, Event, Registration } = require('../models');
const { ApiError } = require('../utils/ApiError');
const asyncHandler = require('../middleware/async');

/**
 * Get payment gateways
 */
exports.getPaymentGateways = asyncHandler(async (req, res, next) => {
  const paymentGateways = await PaymentGateway.find()
    .select('-configuration');
  
  res.status(200).json({
    status: 'success',
    data: {
      paymentGateways
    }
  });
});

/**
 * Create payment gateway
 */
exports.createPaymentGateway = asyncHandler(async (req, res, next) => {
  const paymentGateway = await PaymentGateway.create({
    ...req.body,
    createdBy: req.user._id
  });
  
  // Remove sensitive information from response
  const response = paymentGateway.toObject();
  delete response.configuration;
  
  res.status(201).json({
    status: 'success',
    data: {
      paymentGateway: response
    }
  });
});

/**
 * Update payment gateway
 */
exports.updatePaymentGateway = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  const paymentGateway = await PaymentGateway.findByIdAndUpdate(
    id,
    req.body,
    {
      new: true,
      runValidators: true
    }
  );
  
  if (!paymentGateway) {
    return next(new ApiError('Payment gateway not found', 404));
  }
  
  // Remove sensitive information from response
  const response = paymentGateway.toObject();
  delete response.configuration;
  
  res.status(200).json({
    status: 'success',
    data: {
      paymentGateway: response
    }
  });
});

/**
 * Delete payment gateway
 */
exports.deletePaymentGateway = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  const paymentGateway = await PaymentGateway.findByIdAndDelete(id);
  
  if (!paymentGateway) {
    return next(new ApiError('Payment gateway not found', 404));
  }
  
  res.status(204).json({
    status: 'success',
    data: null
  });
});

/**
 * Process payment
 */
exports.processPayment = asyncHandler(async (req, res, next) => {
  const { eventId, registrationId, gateway, items } = req.body;
  
  // Validate input
  if (!eventId || !gateway || !items || !items.length) {
    return next(new ApiError('Missing required fields', 400));
  }
  
  // Check if event exists
  const event = await Event.findById(eventId);
  if (!event) {
    return next(new ApiError('Event not found', 404));
  }
  
  // Check if registration exists if provided
  if (registrationId) {
    const registration = await Registration.findById(registrationId);
    if (!registration) {
      return next(new ApiError('Registration not found', 404));
    }
  }
  
  // Check if gateway exists and is active
  const paymentGatewayDoc = await PaymentGateway.findOne({ 
    name: gateway,
    isActive: true
  });
  
  if (!paymentGatewayDoc) {
    return next(new ApiError('Payment gateway not found or inactive', 404));
  }
  
  // Get decrypted configuration
  const config = paymentGatewayDoc.getDecryptedConfig();
  
  // Calculate total amount
  let totalAmount = 0;
  for (const item of items) {
    totalAmount += (item.unitPrice * (item.quantity || 1));
  }
  
  // In a real implementation, you would initialize the payment with the gateway
  // For now, we'll create a pending payment record
  const payment = await Payment.create({
    event: eventId,
    registration: registrationId,
    gateway,
    items,
    amount: totalAmount,
    currency: req.body.currency || 'USD',
    status: 'pending',
    metadata: req.body.metadata || {}
  });
  
  // Return client configuration for the gateway
  let clientConfig = {};
  
  // This would vary based on the gateway
  switch (gateway) {
    case 'stripe':
      clientConfig = {
        publicKey: config.publicKey,
        paymentId: payment._id,
        amount: totalAmount,
        currency: payment.currency
      };
      break;
    case 'paypal':
      clientConfig = {
        clientId: config.clientId,
        paymentId: payment._id,
        amount: totalAmount,
        currency: payment.currency
      };
      break;
    // Add other gateways as needed
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      payment: {
        _id: payment._id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status
      },
      clientConfig
    }
  });
});

/**
 * Verify payment
 */
exports.verifyPayment = asyncHandler(async (req, res, next) => {
  const { paymentId, gatewayResponse } = req.body;
  
  // Validate input
  if (!paymentId || !gatewayResponse) {
    return next(new ApiError('Missing required fields', 400));
  }
  
  const payment = await Payment.findById(paymentId);
  
  if (!payment) {
    return next(new ApiError('Payment not found', 404));
  }
  
  // In a real implementation, you would verify the payment with the gateway
  // For now, we'll update the payment status to completed
  payment.status = 'completed';
  payment.gatewayTransactionId = gatewayResponse.transactionId;
  payment.gatewayResponse = gatewayResponse;
  payment.paidAt = new Date();
  
  await payment.save();
  
  // Generate invoice URL (in a real implementation)
  payment.invoiceUrl = `/api/payments/${payment._id}/invoice`;
  payment.receiptUrl = `/api/payments/${payment._id}/receipt`;
  
  await payment.save();
  
  res.status(200).json({
    status: 'success',
    data: {
      payment: {
        _id: payment._id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        invoiceUrl: payment.invoiceUrl,
        receiptUrl: payment.receiptUrl
      }
    }
  });
});

/**
 * Get payment by ID
 */
exports.getPaymentById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  const payment = await Payment.findById(id);
  
  if (!payment) {
    return next(new ApiError('Payment not found', 404));
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      payment
    }
  });
});

/**
 * Refund payment
 */
exports.refundPayment = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { amount, reason } = req.body;
  
  const payment = await Payment.findById(id);
  
  if (!payment) {
    return next(new ApiError('Payment not found', 404));
  }
  
  if (payment.status !== 'completed') {
    return next(new ApiError('Payment cannot be refunded', 400));
  }
  
  // Validate refund amount
  if (!amount || amount <= 0 || amount > payment.amount) {
    return next(new ApiError('Invalid refund amount', 400));
  }
  
  // Get payment gateway configuration
  const paymentGateway = await PaymentGateway.findOne({ 
    name: payment.gateway,
    isActive: true
  });
  
  if (!paymentGateway) {
    return next(new ApiError('Payment gateway not found or inactive', 404));
  }
  
  // Get decrypted configuration
  const config = paymentGateway.getDecryptedConfig();
  
  // In a real implementation, you would process the refund with the gateway
  // For now, we'll update the payment status
  
  // Create refund record
  payment.refunds.push({
    amount,
    reason,
    refundedAt: new Date(),
    refundedBy: req.user._id,
    status: 'completed'
  });
  
  // Update payment status
  if (amount === payment.amount) {
    payment.status = 'refunded';
  } else {
    payment.status = 'partially_refunded';
  }
  
  await payment.save();
  
  res.status(200).json({
    status: 'success',
    data: {
      payment: {
        _id: payment._id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        refunds: payment.refunds
      }
    }
  });
});

/**
 * Get invoice templates
 */
exports.getInvoiceTemplates = asyncHandler(async (req, res, next) => {
  const invoiceTemplates = await InvoiceTemplate.find();
  
  res.status(200).json({
    status: 'success',
    data: {
      invoiceTemplates
    }
  });
});

/**
 * Create invoice template
 */
exports.createInvoiceTemplate = asyncHandler(async (req, res, next) => {
  const invoiceTemplate = await InvoiceTemplate.create({
    ...req.body,
    createdBy: req.user._id
  });
  
  res.status(201).json({
    status: 'success',
    data: {
      invoiceTemplate
    }
  });
});

/**
 * Update invoice template
 */
exports.updateInvoiceTemplate = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  const invoiceTemplate = await InvoiceTemplate.findByIdAndUpdate(
    id,
    req.body,
    {
      new: true,
      runValidators: true
    }
  );
  
  if (!invoiceTemplate) {
    return next(new ApiError('Invoice template not found', 404));
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      invoiceTemplate
    }
  });
});

/**
 * Delete invoice template
 */
exports.deleteInvoiceTemplate = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  const invoiceTemplate = await InvoiceTemplate.findByIdAndDelete(id);
  
  if (!invoiceTemplate) {
    return next(new ApiError('Invoice template not found', 404));
  }
  
  res.status(204).json({
    status: 'success',
    data: null
  });
});

/**
 * Get invoice
 */
exports.getInvoice = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  const payment = await Payment.findById(id)
    .populate({
      path: 'event',
      select: 'name'
    })
    .populate({
      path: 'registration',
      select: 'registrantName email organization address'
    });
  
  if (!payment) {
    return next(new ApiError('Payment not found', 404));
  }
  
  // Get default invoice template
  const invoiceTemplate = await InvoiceTemplate.findOne({ isDefault: true });
  
  if (!invoiceTemplate) {
    return next(new ApiError('Default invoice template not found', 404));
  }
  
  // In a real implementation, you would generate a PDF or HTML invoice
  // For now, we'll return the payment data
  
  res.status(200).json({
    status: 'success',
    data: {
      payment,
      invoiceTemplate
    }
  });
});

/**
 * Get receipt
 */
exports.getReceipt = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  const payment = await Payment.findById(id)
    .populate({
      path: 'event',
      select: 'name'
    })
    .populate({
      path: 'registration',
      select: 'registrantName email'
    });
  
  if (!payment) {
    return next(new ApiError('Payment not found', 404));
  }
  
  // In a real implementation, you would generate a PDF or HTML receipt
  // For now, we'll return the payment data
  
  res.status(200).json({
    status: 'success',
    data: {
      payment
    }
  });
}); 