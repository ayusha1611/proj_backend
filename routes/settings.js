const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// Get settings
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    let settings = await Settings.findOne();
    
    // Create default settings if none exist
    if (!settings) {
      settings = new Settings();
      await settings.save();
    }
    
    res.json({ success: true, settings });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update settings
router.put('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { adminEmail, adminPhone, adminWhatsApp, smtpConfig, smsConfig, minOrderQuantity } = req.body;
    
    let settings = await Settings.findOne();
    
    if (!settings) {
      settings = new Settings();
    }
    
    if (adminEmail) settings.adminEmail = adminEmail;
    if (adminPhone) settings.adminPhone = adminPhone;
    if (adminWhatsApp) settings.adminWhatsApp = adminWhatsApp;
    if (smtpConfig) settings.smtpConfig = { ...settings.smtpConfig, ...smtpConfig };
    if (smsConfig) settings.smsConfig = { ...settings.smsConfig, ...smsConfig };
    if (minOrderQuantity) settings.minOrderQuantity = minOrderQuantity;
    
    settings.updatedAt = Date.now();
    await settings.save();
    
    res.json({ success: true, settings });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get public settings (for contact info display)
router.get('/public', async (req, res) => {
  try {
    let settings = await Settings.findOne();
    
    if (!settings) {
      settings = new Settings();
      await settings.save();
    }
    
    // Only send public info
    res.json({
      success: true,
      settings: {
        adminPhone: settings.adminPhone,
        adminWhatsApp: settings.adminWhatsApp,
        minOrderQuantity: settings.minOrderQuantity
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
