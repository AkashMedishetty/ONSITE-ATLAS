const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  registration: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Registration'
  },
  gateway: {
    type: String,
    required: true,
    enum: ['stripe', 'paypal', 'razorpay', 'instamojo']
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    required: true,
    default: 'USD'
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded', 'partially_refunded'],
    default: 'pending'
  },
  gatewayTransactionId: {
    type: String
  },
  gatewayResponse: {
    type: Object
  },
  items: [{
    type: {
      type: String,
      enum: ['registration', 'workshop', 'addon'],
      required: true
    },
    name: String,
    description: String,
    quantity: {
      type: Number,
      default: 1
    },
    unitPrice: Number,
    totalPrice: Number
  }],
  invoiceNumber: String,
  invoiceUrl: String,
  receiptUrl: String,
  notes: String,
  metadata: {
    type: Object
  },
  refunds: [{
    amount: Number,
    reason: String,
    gatewayRefundId: String,
    refundedAt: Date,
    refundedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed']
    }
  }],
  paidAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Generate invoice number on creation
paymentSchema.pre('save', async function(next) {
  if (!this.invoiceNumber && this.isNew) {
    const event = await mongoose.model('Event').findById(this.event).select('name');
    const eventPrefix = event && event.name ? event.name.substring(0, 3).toUpperCase() : 'INV';
    const dateStr = new Date().toISOString().substring(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    this.invoiceNumber = `${eventPrefix}-${dateStr}-${randomSuffix}`;
  }
  
  // Set paidAt timestamp when payment is completed
  if (this.isModified('status') && this.status === 'completed' && !this.paidAt) {
    this.paidAt = new Date();
  }
  
  next();
});

// Calculate total amount before saving
paymentSchema.pre('save', function(next) {
  if (this.isModified('items')) {
    let total = 0;
    
    for (const item of this.items) {
      const itemTotal = (item.unitPrice || 0) * (item.quantity || 1);
      item.totalPrice = itemTotal;
      total += itemTotal;
    }
    
    this.amount = total;
  }
  
  next();
});

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment; 