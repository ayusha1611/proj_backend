const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  adminEmail: {
    type: String,
    required: true,
    default: 'admin@shikhargarments.com'
  },
  adminPhone: {
    type: String,
    required: true,
    default: '08044464872'
  },
  adminWhatsApp: {
    type: String,
    required: true,
    default: '918044464872'
  },
  smtpConfig: {
    host: { type: String, default: 'smtp.gmail.com' },
    port: { type: Number, default: 587 },
    user: { type: String, default: '' },
    password: { type: String, default: '' }
  },
  smsConfig: {
    apiKey: { type: String, default: '' },
    senderId: { type: String, default: 'SHIKHR' }
  },
  minOrderQuantity: {
    type: Number,
    default: 48,  // TOTAL minimum across all products
    min: 1
  },
  minOrderQuantityPerProduct: {
    type: Number,
    default: 24,  // Minimum per individual product
    min: 1
  },
  advancePaymentAmount: {
    type: Number,
    default: 99
  },
  razorpayKeyId: {
    type: String,
    default: ''
  },
  razorpayKeySecret: {
    type: String,
    default: ''
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Settings', settingsSchema);
