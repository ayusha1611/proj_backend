const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// Get all categories (public)
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ order: 1, name: 1 });
    res.json({ success: true, categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get all categories including inactive (Admin only)
router.get('/all', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const categories = await Category.find().sort({ order: 1, name: 1 });
    res.json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Add category (Admin only)
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, description, order } = req.body;

    // Check if category already exists
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      return res.status(400).json({ 
        success: false, 
        message: 'Category already exists' 
      });
    }

    const category = new Category({
      name,
      description: description || '',
      order: order || 0
    });

    await category.save();
    res.json({ success: true, category });
  } catch (error) {
    console.error('Add category error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update category (Admin only)
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, description, isActive, order } = req.body;
    
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { name, description, isActive, order },
      { new: true }
    );

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    res.json({ success: true, category });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete category (Admin only)
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    res.json({ success: true, message: 'Category deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Initialize default categories (run once)
router.post('/initialize', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const defaultCategories = [
      { name: 'EyeShadow', order: 1 },
      { name: 'Lipsticks', order: 2 },
      { name: 'SkinCare', order: 3 },
      { name: 'Makeup Brushes', order: 4 },
      { name: 'Other Products', order: 5 }
    ];

    const existingCount = await Category.countDocuments();
    
    if (existingCount > 0) {
      return res.json({ 
        success: true, 
        message: 'Categories already initialized',
        count: existingCount
      });
    }

    await Category.insertMany(defaultCategories);
    res.json({ 
      success: true, 
      message: 'Default categories created',
      count: defaultCategories.length
    });
  } catch (error) {
    console.error('Initialize categories error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
