const mongoose = require('mongoose');
const crypto = require('crypto');

const paymentGatewaySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    enum: ['stripe', 'paypal', 'razorpay', 'instamojo']
  },
  displayName: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: false
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  configuration: {
    type: Object,
    required: true
  },
  testMode: {
    type: Boolean,
    default: true
  },
  supportedCurrencies: [String],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Encrypt sensitive configuration data before saving
paymentGatewaySchema.pre('save', function(next) {
  if (this.isModified('configuration')) {
    // Create a deep copy to avoid modifying the original
    const configCopy = JSON.parse(JSON.stringify(this.configuration));
    
    // Encrypt sensitive fields
    const algorithm = 'aes-256-ctr';
    const secretKey = process.env.PAYMENT_ENCRYPTION_KEY || 'default-secret-key-for-payment-gateways';
    const iv = crypto.randomBytes(16);
    
    // Function to encrypt sensitive data
    const encrypt = (text) => {
      const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
      const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
      return {
        iv: iv.toString('hex'),
        content: encrypted.toString('hex')
      };
    };
    
    // Encrypt API keys and secrets
    if (configCopy.apiKey) {
      configCopy.apiKey = encrypt(configCopy.apiKey);
    }
    if (configCopy.apiSecret) {
      configCopy.apiSecret = encrypt(configCopy.apiSecret);
    }
    if (configCopy.clientSecret) {
      configCopy.clientSecret = encrypt(configCopy.clientSecret);
    }
    
    this.configuration = configCopy;
  }
  
  next();
});

// Method to decrypt sensitive configuration data
paymentGatewaySchema.methods.getDecryptedConfig = function() {
  const configCopy = JSON.parse(JSON.stringify(this.configuration));
  const algorithm = 'aes-256-ctr';
  const secretKey = process.env.PAYMENT_ENCRYPTION_KEY || 'default-secret-key-for-payment-gateways';
  
  // Function to decrypt data
  const decrypt = (hash) => {
    const decipher = crypto.createDecipheriv(
      algorithm, 
      secretKey, 
      Buffer.from(hash.iv, 'hex')
    );
    
    const decrpyted = Buffer.concat([
      decipher.update(Buffer.from(hash.content, 'hex')),
      decipher.final()
    ]);
    
    return decrpyted.toString();
  };
  
  // Decrypt sensitive fields
  if (configCopy.apiKey && configCopy.apiKey.iv) {
    configCopy.apiKey = decrypt(configCopy.apiKey);
  }
  if (configCopy.apiSecret && configCopy.apiSecret.iv) {
    configCopy.apiSecret = decrypt(configCopy.apiSecret);
  }
  if (configCopy.clientSecret && configCopy.clientSecret.iv) {
    configCopy.clientSecret = decrypt(configCopy.clientSecret);
  }
  
  return configCopy;
};

// Ensure only one default gateway at a time
paymentGatewaySchema.pre('save', async function(next) {
  if (this.isDefault && this.isModified('isDefault')) {
    await mongoose.models.PaymentGateway.updateMany(
      { _id: { $ne: this._id } },
      { isDefault: false }
    );
  }
  next();
});

const PaymentGateway = mongoose.model('PaymentGateway', paymentGatewaySchema);

module.exports = PaymentGateway; 