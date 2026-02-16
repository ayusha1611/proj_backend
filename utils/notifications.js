const nodemailer = require('nodemailer');
const Settings = require('../models/Settings');
const axios = require('axios');

async function sendOrderSMS(phone, orderId, total) {
  try {
    const settings = await Settings.findOne();

    if (!settings || !settings.smsConfig.apiKey) {
      console.log('SMS not configured');
      return { success: false };
    }

    const message = `Dear Customer, Your order #${orderId.toString().slice(-8)} is confirmed! Total: Rs.${total}. - Shikhar Garments`;

    await axios.post(
      'https://api.msg91.com/api/v5/flow/',
      {
        sender: settings.smsConfig.senderId,
        route: '4',
        country: '91',
        sms: [
          {
            message: message,
            to: [phone]
          }
        ]
      },
      {
        headers: {
          authkey: settings.smsConfig.apiKey
        }
      }
    );

    return { success: true };

  } catch (error) {
    console.error('SMS send error:', error);
    return { success: false };
  }
}


// Send order confirmation email to customer
async function sendOrderConfirmationEmail(order, customerEmail, customerName) {
  try {
    const settings = await Settings.findOne();
    
    if (!settings || !settings.smtpConfig.user || !settings.smtpConfig.password) {
      console.log('Email not configured in settings');
      return { success: false, message: 'Email not configured' };
    }

    const transport = nodemailer.createTransport({
      host: settings.smtpConfig.host,
      port: settings.smtpConfig.port,
      secure: false,
      auth: {
        user: settings.smtpConfig.user,
        pass: settings.smtpConfig.password
      }
    });

    const itemsList = order.items.map(item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.productName}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">₹${item.price}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">₹${item.price * item.quantity}</td>
      </tr>
    `).join('');

    const mailOptions = {
      from: `"Shikhar Garments" <${settings.smtpConfig.user}>`,
      to: customerEmail,
      subject: `Order Confirmation #${order._id.toString().slice(-8)}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #2e3192; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .order-details { background-color: white; padding: 20px; margin: 20px 0; border-radius: 5px; }
            table { width: 100%; border-collapse: collapse; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            .button { background-color: #00a699; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Order Confirmation</h1>
              <p>Thank you for your order!</p>
            </div>
            
            <div class="content">
              <h2>Dear ${customerName},</h2>
              <p>Your order has been successfully placed and confirmed.</p>
              
              <div class="order-details">
                <h3>Order Details</h3>
                <p><strong>Order ID:</strong> #${order._id.toString().slice(-8)}</p>
                <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
                <p><strong>Payment Method:</strong> ${order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}</p>
                <p><strong>Status:</strong> ${order.orderStatus}</p>
                
                <h4 style="margin-top: 20px;">Items Ordered:</h4>
                <table>
                  <thead>
                    <tr style="background-color: #f0f0f0;">
                      <th style="padding: 10px; text-align: left;">Product</th>
                      <th style="padding: 10px; text-align: center;">Quantity</th>
                      <th style="padding: 10px; text-align: right;">Price</th>
                      <th style="padding: 10px; text-align: right;">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${itemsList}
                  </tbody>
                  <tfoot>
                    <tr style="font-weight: bold; background-color: #f9f9f9;">
                      <td colspan="3" style="padding: 15px; text-align: right;">Total Amount:</td>
                      <td style="padding: 15px; text-align: right;">₹${order.totalAmount}</td>
                    </tr>
                  </tfoot>
                </table>
                
                ${order.paymentMethod === 'cod' ? `
                  <div style="background-color: #fff3cd; padding: 15px; margin-top: 20px; border-radius: 5px;">
                    <strong>Cash on Delivery:</strong><br>
                    Prepaid: ₹${order.codPrepaidFee || 0}<br>
                    Pay on Delivery: ₹${order.codRemainingAmount || 0}
                  </div>
                ` : ''}
              </div>
              
              <div style="text-align: center;">
                <a href="http://localhost:3000/track/${order._id}" class="button">Track Your Order</a>
              </div>
              
              <p style="margin-top: 30px;">If you have any questions, please contact us:</p>
              <p>
                📞 Phone: ${settings.adminPhone}<br>
                💬 WhatsApp: ${settings.adminWhatsApp}<br>
                📧 Email: ${settings.adminEmail}
              </p>
            </div>
            
            <div class="footer">
              <p>© 2026 Shikhar Garments. All rights reserved.</p>
              <p>Katihar, Bihar, India</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transport.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: error.message };
  }
}

// Send SMS notification to customer
async function sendOrderSMS(phone, orderId, total) {
  try {
    const settings = await Settings.findOne();
    
    if (!settings || !settings.smsConfig.apiKey) {
      console.log('SMS not configured in settings');
      return { success: false, message: 'SMS not configured' };
    }

    const message = `Dear Customer, Your order #${orderId.toString().slice(-8)} is confirmed! Total: Rs.${total}. Track: yoursite.com/track - Shikhar Garments`;
    
    // TODO: Integrate with your SMS provider (Twilio, MSG91, etc.)
    console.log('SMS would be sent:', { phone, message });
    
    // Example for MSG91 or similar providers:
    // const response = await axios.post('https://api.msg91.com/api/v5/flow/', {
    //   sender: settings.smsConfig.senderId,
    //   route: '4',
    //   country: '91',
    //   sms: [{
    //     message: message,
    //     to: [phone]
    //   }]
    // }, {
    //   headers: {
    //     'authkey': settings.smsConfig.apiKey
    //   }
    // });
    
    return { success: true };
  } catch (error) {
    console.error('SMS send error:', error);
    return { success: false, error: error.message };
  }
}

// Notify admin of new order
async function notifyAdminNewOrder(order) {
  try {
    const settings = await Settings.findOne();
    
    if (!settings) {
      return { success: false, message: 'Settings not found' };
    }

    // Send email to admin
    if (settings.smtpConfig.user && settings.smtpConfig.password) {
      const transporter = nodemailer.createTransport({
        host: settings.smtpConfig.host,
        port: settings.smtpConfig.port,
        secure: false,
        auth: {
          user: settings.smtpConfig.user,
          pass: settings.smtpConfig.password
        }
      });

      const itemsList = order.items.map(item => 
        `${item.productName} x ${item.quantity} = ₹${item.price * item.quantity}`
      ).join('<br>');

      await transport.sendMail({
        from: `"Shikhar Garments" <${settings.smtpConfig.user}>`,
        to: settings.adminEmail,
        subject: `🔔 New Order Received #${order._id.toString().slice(-8)}`,
        html: `
          <h2>New Order Alert!</h2>
          <p><strong>Order ID:</strong> ${order._id}</p>
          <p><strong>Customer:</strong> ${order.userName} (${order.userPhone})</p>
          <p><strong>Total Amount:</strong> ₹${order.totalAmount}</p>
          <p><strong>Payment Method:</strong> ${order.paymentMethod === 'cod' ? 'COD' : 'Online'}</p>
          <hr>
          <h3>Items:</h3>
          <p>${itemsList}</p>
          <hr>
          <p><a href="http://localhost:3000/admin">View in Admin Dashboard</a></p>
        `
      });
    }

    // Send SMS to admin
    if (settings.smsConfig.apiKey) {
      const adminMessage = `New order #${order._id.toString().slice(-8)} received! Amount: Rs.${order.totalAmount}. Customer: ${order.userName}`;
      console.log('Admin SMS would be sent:', { phone: settings.adminPhone, message: adminMessage });
    }

    return { success: true };
  } catch (error) {
    console.error('Admin notification error:', error);
    return { success: false, error: error.message };
  }
}

// Send order status update notification
async function sendStatusUpdateNotification(order, customerEmail) {
  try {
    const settings = await Settings.findOne();
    
    if (!settings || !settings.smtpConfig.user) {
      return { success: false };
    }

    const transport = nodemailer.createTransport({
      host: settings.smtpConfig.host,
      port: settings.smtpConfig.port,
      secure: false,
      auth: {
        user: settings.smtpConfig.user,
        pass: settings.smtpConfig.password
      }
    });

    const statusMessages = {
      'pending': 'Your order is pending confirmation',
      'confirmed': 'Your order has been confirmed',
      'processing': 'Your order is being processed',
      'shipped': 'Your order has been shipped',
      'out_for_delivery': 'Your order is out for delivery',
      'delivered': 'Your order has been delivered',
      'cancelled': 'Your order has been cancelled'
    };

    await transport.sendMail({
      from: `"Shikhar Garments" <${settings.smtpConfig.user}>`,
      to: customerEmail,
      subject: `Order Status Update #${order._id.toString().slice(-8)}`,
      html: `
        <h2>Order Status Updated</h2>
        <p><strong>Order ID:</strong> #${order._id.toString().slice(-8)}</p>
        <p><strong>New Status:</strong> ${order.orderStatus.toUpperCase()}</p>
        <p>${statusMessages[order.orderStatus]}</p>
        ${order.trackingNumber ? `<p><strong>Tracking Number:</strong> ${order.trackingNumber}</p>` : ''}
        <p><a href="http://localhost:3000/track/${order._id}">Track Your Order</a></p>
      `
    });

    return { success: true };
  } catch (error) {
    console.error('Status update notification error:', error);
    return { success: false };
  }
}

module.exports = {
  sendOrderConfirmationEmail,
  sendOrderSMS,
  notifyAdminNewOrder,
  sendStatusUpdateNotification
};
