const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const { authMiddleware } = require('../middleware/auth');

// Get reviews for a product
router.get('/product/:productId', async (req, res) => {
  try {
    const reviews = await Review.find({ product: req.params.productId })
      .populate('user', 'name')
      .sort({ createdAt: -1 });
    
    res.json({ success: true, reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Add review
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { productId, rating, comment } = req.body;

    // Check if user already reviewed this product
    const existingReview = await Review.findOne({
      product: productId,
      user: req.user.id
    });

    if (existingReview) {
      return res.status(400).json({ 
        success: false, 
        message: 'You have already reviewed this product' 
      });
    }

    const review = new Review({
      product: productId,
      user: req.user.id,
      userName: req.user.name,
      rating,
      comment
    });

    await review.save();
    res.json({ success: true, review });

  } catch (error) {
    console.error('Add review error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get average rating for a product
router.get('/rating/:productId', async (req, res) => {
  try {
    const reviews = await Review.find({ product: req.params.productId });
    
    if (reviews.length === 0) {
      return res.json({ success: true, averageRating: 0, totalReviews: 0 });
    }

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;

    res.json({ 
      success: true, 
      averageRating: averageRating.toFixed(1), 
      totalReviews: reviews.length 
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
