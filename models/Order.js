const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  userName: {
    type: String,
    required: true
  },

  userPhone: {
    type: String,
    required: true
  },

  userEmail: {
    type: String
  },

  // Delivery Address
  shippingAddress: {
    fullAddress: { type: String, required: true },
    pincode: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true, default: 'India' }
  },


  // Order Items
  items: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
      },
      productName: String,
      productImage: String,
      quantity: {
        type: Number,
        required: true,
        min: 1
      },
      price: {
        type: Number,
        required: true
      }
    }
  ],

  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },

  deliveryFee: {
    type: Number,
    default: 150
  },

  totalQuantity: {
    type: Number,
    default: 0
  },

  // 💳 Payment Information
  paymentMethod: {
    type: String,
    enum: ['online', 'cod', 'mock'],
    default: 'cod'
  },

  paymentId: {
    type: String
  },

  codPrepaidFee: {
    type: Number,
    default: 0
  },

  codRemainingAmount: {
    type: Number,
    default: 0
  },

  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },

  // 📦 Order Tracking
  orderStatus: {
    type: String,
    enum: [
      'pending',
      'confirmed',
      'processing',
      'shipped',
      'out_for_delivery',
      'delivered',
      'cancelled'
    ],
    default: 'pending'
  },

  trackingNumber: {
    type: String,
    default: ''
  },

  statusHistory: [
    {
      status: String,
      timestamp: { type: Date, default: Date.now },
      note: String
    }
  ],

  // 📲 Notification Tracking
  notificationSent: {
    sms: { type: Boolean, default: false },
    email: { type: Boolean, default: false },
    whatsapp: { type: Boolean, default: false }
  }

}, { timestamps: true });  // Automatically adds createdAt & updatedAt


module.exports = mongoose.model('Order', orderSchema);
