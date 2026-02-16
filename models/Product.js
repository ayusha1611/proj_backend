const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  
  images: [{
    type: String
  }],
  image: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    required: true
  },
  subcategory: {
    type: String,
    default: ''
  },
  quantity: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  minOrderQuantity: {
    type: Number,
    default: 24,
    min: 1
  },
  inStock: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
  
});

// Auto-update inStock and primary image
productSchema.pre('save', function(next) {
  // Update stock status based on quantity
  this.inStock = this.quantity >= this.minOrderQuantity;
  
  // Set primary image from first image in array for backward compatibility
  if (this.images && this.images.length > 0) {
    this.image = this.images[0];
  }
  
  next();
});

module.exports = mongoose.model('Product', productSchema);
