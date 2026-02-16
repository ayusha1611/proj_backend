const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// User/Admin Login
router.post('/login', async (req, res) => {
  try {
    const { name, phone, email, password, isAdmin } = req.body;

    console.log('Login attempt:', { name, phone: phone ? 'provided' : 'missing', email, isAdmin });

    // Admin login
    if (isAdmin) {
      console.log('Admin login attempt');
      console.log('Expected username:', process.env.ADMIN_USERNAME);
      console.log('Provided username:', name);
      
      if (name === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
        const token = jwt.sign(
          { id: 'admin', name, isAdmin: true },
          process.env.JWT_SECRET,
          { expiresIn: '24h' }
        );
        
        console.log('Admin login successful');
        
        return res.json({
          success: true,
          token,
          user: { name, isAdmin: true }
        });
      } else {
        console.log('Admin login failed - credentials mismatch');
        return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
      }
    }

    // User login - validate phone number
    if (!phone || phone.length < 10) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide a valid 10-digit phone number' 
      });
    }

    // User login - check if exists or create new
    let user = await User.findOne({ phone });
    
    if (!user) {
      console.log('Creating new user:', name, phone, email);
      user = new User({ 
        name, 
        phone, 
        email: email || null,
        isAdmin: false 
      });
      await user.save();
      console.log('New user created successfully');
    } else {
      console.log('Existing user found:', user.name);
      // Update email if provided and not already set
      if (email && !user.email) {
        user.email = email;
        await user.save();
      }
    }

    const token = jwt.sign(
      { id: user._id, name: user.name, phone: user.phone, email: user.email, isAdmin: false },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        isAdmin: false
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
});

// Verify token
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ success: true, user: decoded });
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
});

// Test endpoint to check server and credentials
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Auth routes working',
    adminUsername: process.env.ADMIN_USERNAME,
    hasAdminPassword: !!process.env.ADMIN_PASSWORD,
    hasJwtSecret: !!process.env.JWT_SECRET
  });
});

module.exports = router;
