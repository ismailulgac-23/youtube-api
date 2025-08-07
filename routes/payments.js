const express = require('express');
const { auth } = require('../middleware/auth');
const {
  processPayment,
  checkPaymentStatus,
  handleDodoWebhook,
  handleCoinbaseWebhook
} = require('../controllers/paymentController');

const router = express.Router();

// @route   POST /api/payments/process/:orderId
// @desc    Process payment for an order
// @access  Private
router.post('/process/:orderId', auth, processPayment);

// @route   GET /api/payments/status/:orderId
// @desc    Check payment status
// @access  Private
router.get('/status/:orderId', auth, checkPaymentStatus);

// @route   POST /api/payments/dodo/webhook
// @desc    Handle DodoPayments webhook
// @access  Public
router.post('/dodo/webhook', handleDodoWebhook);

// @route   POST /api/payments/coinbase/webhook
// @desc    Handle Coinbase webhook
// @access  Public
router.post('/coinbase/webhook', handleCoinbaseWebhook);

module.exports = router;