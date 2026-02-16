const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// Get all users (Admin only)
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const users = await User.find({ isAdmin: false }).sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get user stats (Admin only)
router.get('/stats', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ isAdmin: false });
    const recentUsers = await User.find({ isAdmin: false })
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({ 
      success: true, 
      stats: {
        totalUsers,
        recentUsers
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
