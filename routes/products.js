const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// Get all products
router.get('/', async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json({ success: true, products });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get single product
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Add product (Admin only) - Multiple images
router.post('/', authMiddleware, adminMiddleware, upload.array('images', 5), async (req, res) => {
  try {
    const { name, description, price, category, subcategory, quantity, minOrderQuantity } = req.body;
    const images = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];

    if (images.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one image is required' });
    }

    const product = new Product({
      name,
      description,
      price,
      images,
      category,
      subcategory: subcategory || '',
      quantity: quantity || 0,
      minOrderQuantity: minOrderQuantity || 24,
      inStock: (quantity || 0) >= (minOrderQuantity || 24)
    });

    await product.save();
    res.json({ success: true, product });
  } catch (error) {
    console.error('Add product error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update product (Admin only)
router.put('/:id', authMiddleware, adminMiddleware, upload.array('images', 5), async (req, res) => {
  try {
    const { name, description, price, category, subcategory, quantity, minOrderQuantity, inStock } = req.body;
    
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Update fields
    if (name) product.name = name;
    if (description) product.description = description;
    if (price) product.price = price;
    if (category) product.category = category;
    if (subcategory !== undefined) product.subcategory = subcategory;
    if (quantity !== undefined) {
      product.quantity = quantity;
      product.inStock = quantity >= (product.minOrderQuantity || 24);
    }
    if (minOrderQuantity !== undefined) {
      product.minOrderQuantity = minOrderQuantity;
      product.inStock = product.quantity >= minOrderQuantity;
    }
    
    // Add new images if provided
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => `/uploads/${file.filename}`);
      product.images = [...product.images, ...newImages];
    }

    await product.save();
    res.json({ success: true, product });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update product quantity only (Admin only)
router.patch('/:id/quantity', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { quantity } = req.body;
    
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    product.quantity = quantity;
    product.inStock = quantity >= (product.minOrderQuantity || 24);
    await product.save();

    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete product image (Admin only)
router.delete('/:id/image', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { imageUrl } = req.body;
    
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    product.images = product.images.filter(img => img !== imageUrl);
    
    if (product.images.length === 0) {
      return res.status(400).json({ success: false, message: 'Product must have at least one image' });
    }

    await product.save();
    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete product (Admin only)
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
