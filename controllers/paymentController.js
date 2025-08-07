const Order = require('../models/Order');
const paymentService = require('../services/paymentService');

// @desc    Process payment for an order
// @route   POST /api/payments/process/:orderId
// @access  Private
const processPayment = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Get order details
    const order = await Order.findById(orderId)
      .populate('user', 'name email')
      .populate('product', 'name quantity price currency')
      .populate('service', 'name description');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user owns this order
    if (order.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to process payment for this order'
      });
    }

    // Check if order is in correct status
    if (order.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Order is not in pending status'
      });
    }

    // Check if payment is already processed
    if (order.payment.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Payment has already been processed'
      });
    }

    // Prepare payment data
    const paymentData = {
      orderId: order._id,
      orderNumber: order.orderNumber,
      userId: order.user._id,
      finalPrice: order.pricing.finalPrice,
      currency: order.pricing.currency,
      productName: order.product.name,
      serviceName: order.service.name,
      customerDetails: order.customerDetails
    };

    // Create payment with the selected method
    const paymentResult = await paymentService.createPayment(order.payment.method, paymentData);

    if (!paymentResult.success) {
      return res.status(400).json({
        success: false,
        message: paymentResult.error
      });
    }

    // Update order with payment information
    order.payment.transactionId = paymentResult.paymentId;
    order.payment.status = 'processing';
    order.payment.paymentData = paymentResult.data;
    
    await order.save();

    res.json({
      success: true,
      message: 'Payment initiated successfully',
      data: {
        paymentId: paymentResult.paymentId,
        paymentUrl: paymentResult.paymentUrl,
        order: {
          id: order._id,
          orderNumber: order.orderNumber,
          status: order.status,
          paymentStatus: order.payment.status
        }
      }
    });

  } catch (error) {
    console.error('Process payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while processing payment'
    });
  }
};

// @desc    Check payment status
// @route   GET /api/payments/status/:orderId
// @access  Private
const checkPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user owns this order or is admin
    if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to check payment status for this order'
      });
    }

    if (!order.payment.transactionId) {
      return res.json({
        success: true,
        data: {
          paymentStatus: order.payment.status,
          orderStatus: order.status
        }
      });
    }

    // Check payment status with payment provider
    const statusResult = await paymentService.checkPaymentStatus(
      order.payment.method,
      order.payment.transactionId
    );

    if (statusResult.success) {
      const newStatus = paymentService.mapPaymentStatus(order.payment.method, statusResult.status);
      
      // Update order if status changed
      if (newStatus !== order.payment.status) {
        order.payment.status = newStatus;
        
        if (newStatus === 'completed') {
          order.payment.paidAt = new Date();
          order.timestamps.paid = new Date();
        }
        
        await order.save();
      }
    }

    res.json({
      success: true,
      data: {
        paymentStatus: order.payment.status,
        orderStatus: order.status,
        transactionId: order.payment.transactionId
      }
    });

  } catch (error) {
    console.error('Check payment status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while checking payment status'
    });
  }
};

// @desc    Handle DodoPayments webhook
// @route   POST /api/payments/dodo/webhook
// @access  Public
const handleDodoWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-dodo-signature'];
    const payload = JSON.stringify(req.body);

    // Verify webhook signature
    if (!paymentService.verifyDodoWebhook(payload, signature)) {
      return res.status(401).json({
        success: false,
        message: 'Invalid webhook signature'
      });
    }

    const { event_type, data } = req.body;

    if (event_type === 'payment.completed' || event_type === 'payment.failed') {
      const order = await Order.findOne({ orderNumber: data.order_id });

      if (order) {
        const newStatus = paymentService.mapPaymentStatus('crypto_dodo', data.status);
        order.payment.status = newStatus;
        order.payment.paymentData = data;

        if (newStatus === 'completed') {
          order.payment.paidAt = new Date();
          order.timestamps.paid = new Date();
        }

        await order.save();
      }
    }

    res.json({ success: true });

  } catch (error) {
    console.error('DodoPayments webhook error:', error);
    res.status(500).json({
      success: false,
      message: 'Webhook processing failed'
    });
  }
};

// @desc    Handle Coinbase webhook
// @route   POST /api/payments/coinbase/webhook
// @access  Public
const handleCoinbaseWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-cc-webhook-signature'];
    const payload = JSON.stringify(req.body);

    // Verify webhook signature
    if (!paymentService.verifyCoinbaseWebhook(payload, signature)) {
      return res.status(401).json({
        success: false,
        message: 'Invalid webhook signature'
      });
    }

    const { event } = req.body;

    if (event.type === 'charge:confirmed' || event.type === 'charge:failed') {
      const orderNumber = event.data.metadata.order_number;
      const order = await Order.findOne({ orderNumber });

      if (order) {
        const latestTimeline = event.data.timeline[event.data.timeline.length - 1];
        const newStatus = paymentService.mapPaymentStatus('crypto_coinbase', latestTimeline.status);
        
        order.payment.status = newStatus;
        order.payment.paymentData = event.data;

        if (newStatus === 'completed') {
          order.payment.paidAt = new Date();
          order.timestamps.paid = new Date();
        }

        await order.save();
      }
    }

    res.json({ success: true });

  } catch (error) {
    console.error('Coinbase webhook error:', error);
    res.status(500).json({
      success: false,
      message: 'Webhook processing failed'
    });
  }
};

module.exports = {
  processPayment,
  checkPaymentStatus,
  handleDodoWebhook,
  handleCoinbaseWebhook
};