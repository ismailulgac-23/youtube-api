const express = require('express');
const { body, query } = require('express-validator');
const { auth, adminAuth } = require('../middleware/auth');
const {
  createOrder,
  getUserOrders,
  getOrder,
  updateOrderStatus,
  validateCoupon,
  getAllOrders,
  queryOrder,
  trackOrder
} = require('../controllers/orderController');

const router = express.Router();

// @route   POST /api/orders/query
// @desc    Query order by order number (Public)
// @access  Public
router.post('/query', [
  body('orderNumber')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Order number is required')
], queryOrder);

// @route   GET /api/orders/track/:orderNumber
// @desc    Get order tracking information (Public)
// @access  Public
router.get('/track/:orderNumber', trackOrder);

// @route   POST /api/orders/validate-coupon
// @desc    Validate coupon
// @access  Private
router.post('/validate-coupon', [
  auth,
  body('couponCode')
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('Coupon code must be between 3 and 20 characters'),
  body('productId')
    .optional()
    .isMongoId()
    .withMessage('Valid product ID is required')
], validateCoupon);

// @route   GET /api/orders/admin/all
// @desc    Get all orders (Admin only)
// @access  Private/Admin
router.get('/admin/all', [
  auth,
  adminAuth,
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['pending', 'processing', 'in_progress', 'completed', 'cancelled', 'refunded']).withMessage('Invalid status'),
  query('paymentStatus').optional().isIn(['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded']).withMessage('Invalid payment status')
], getAllOrders);

// @route   GET /api/orders
// @desc    Get user orders
// @access  Private
router.get('/', [
  auth,
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('status').optional().isIn(['pending', 'processing', 'in_progress', 'completed', 'cancelled', 'refunded']).withMessage('Invalid status')
], getUserOrders);

// @route   POST /api/orders
// @desc    Create a new order
// @access  Private
router.post('/', [
  auth,
  body('productId')
    .isMongoId()
    .withMessage('Valid product ID is required'),
  body('processLink')
    .isURL()
    .withMessage('Valid process link URL is required'),
  body('customerDetails.fullName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),
  body('customerDetails.email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('customerDetails.phone')
    .isMobilePhone()
    .withMessage('Valid phone number is required'),
  body('paymentMethod')
    .isIn(['crypto_dodo', 'crypto_coinbase', 'credit_card', 'bank_transfer'])
    .withMessage('Invalid payment method'),
  body('couponCode')
    .optional()
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('Coupon code must be between 3 and 20 characters')
], createOrder);

// @route   GET /api/orders/:id
// @desc    Get single order
// @access  Private
router.get('/:id', auth, getOrder);

// @route   PUT /api/orders/:id/status
// @desc    Update order status (Admin only)
// @access  Private/Admin
router.put('/:id/status', [
  auth,
  adminAuth,
  body('status')
    .isIn(['pending', 'processing', 'in_progress', 'completed', 'cancelled', 'refunded'])
    .withMessage('Invalid status'),
  body('adminNotes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Admin notes cannot exceed 1000 characters'),
  body('progress')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Progress must be between 0 and 100')
], updateOrderStatus);

module.exports = router;