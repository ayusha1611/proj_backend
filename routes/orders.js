const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// ================================
// CREATE ORDER (MOCK PAYMENT)
// ================================
router.post('/create', authMiddleware, async (req, res) => {
  try {
    const {
      items,
      totalAmount,
      paymentMethod,
      codPrepaidFee,
      codRemainingAmount,
      shippingAddress,
      totalQuantity,
      deliveryFee
    } = req.body;

    const order = new Order({
      user: req.user.id,
      userName: req.user.name,
      userPhone: req.user.phone,
      userEmail: req.user.email,
      items,
      totalAmount,
      totalQuantity,
      deliveryFee,
      paymentMethod: paymentMethod || 'cod',
      codPrepaidFee: paymentMethod === 'cod' ? codPrepaidFee : 0,
      codRemainingAmount: paymentMethod === 'cod' ? codRemainingAmount : 0,
      shippingAddress,
      paymentStatus: paymentMethod === 'cod' ? 'pending' : 'pending',
      orderStatus: 'pending'
    });

    await order.save();

    res.json({
      success: true,
      message: 'Order created successfully',
      orderId: order._id
    });

  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


// ================================
// MOCK PAYMENT SUCCESS
// ================================
router.post('/mock-payment-success', authMiddleware, async (req, res) => {
  try {
    const { orderId } = req.body;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    order.paymentStatus = 'paid';
    order.paymentId = "MOCK_" + Date.now();
    order.orderStatus = 'confirmed';

    order.statusHistory.push({
      status: 'confirmed',
      timestamp: new Date(),
      note: 'Mock payment successful'
    });

    await order.save();

    res.json({
      success: true,
      message: 'Mock payment successful',
      paymentId: order.paymentId
    });

  } catch (error) {
    console.error('Mock payment error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


// ================================
// GET USER ORDERS
// ================================
router.get('/my-orders', authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .populate('items.product')
      .sort({ createdAt: -1 });

    res.json({ success: true, orders });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


// ================================
// GET ALL ORDERS (ADMIN)
// ================================
router.get('/all', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('items.product')
      .populate('user')
      .sort({ createdAt: -1 });

    res.json({ success: true, orders });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


// ================================
// UPDATE ORDER STATUS (ADMIN)
// ================================
router.put('/:id/status', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { status, trackingNumber, note } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    order.orderStatus = status;

    if (trackingNumber) {
      order.trackingNumber = trackingNumber;
    }

    order.statusHistory.push({
      status,
      timestamp: new Date(),
      note: note || `Order updated to ${status}`
    });

    await order.save();

    res.json({ success: true, order });

  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


// ================================
// CANCEL ORDER
// ================================
router.put('/:id/cancel', authMiddleware, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (['shipped', 'out_for_delivery', 'delivered'].includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Order cannot be cancelled after shipping'
      });
    }

    order.orderStatus = 'cancelled';

    order.statusHistory.push({
      status: 'cancelled',
      timestamp: new Date(),
      note: 'Order cancelled by customer'
    });

    await order.save();

    res.json({ success: true, message: 'Order cancelled successfully' });

  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


module.exports = router;
