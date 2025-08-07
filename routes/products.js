const express = require('express');
const { body, query } = require('express-validator');
const { auth, adminAuth } = require('../middleware/auth');
const {
  getProducts,
  getProduct,
  getProductsByService,
  createProduct,
  updateProduct,
  deleteProduct,
  getPopularProducts
} = require('../controllers/productController');

const router = express.Router();

// @route   GET /api/products/popular/list
// @desc    Get popular products
// @access  Public
router.get('/popular/list', getPopularProducts);

// @route   GET /api/products/service/:serviceId
// @desc    Get products by service
// @access  Public
router.get('/service/:serviceId', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
], getProductsByService);

// @route   GET /api/products
// @desc    Get all products with filtering and pagination
// @access  Public
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('service').optional().isMongoId().withMessage('Invalid service ID'),
  query('minPrice').optional().isFloat({ min: 0 }).withMessage('Min price must be a positive number'),
  query('maxPrice').optional().isFloat({ min: 0 }).withMessage('Max price must be a positive number'),
  query('minQuantity').optional().isInt({ min: 1 }).withMessage('Min quantity must be a positive integer'),
  query('maxQuantity').optional().isInt({ min: 1 }).withMessage('Max quantity must be a positive integer')
], getProducts);

// @route   GET /api/products/:id
// @desc    Get single product by ID
// @access  Public
router.get('/:id', getProduct);

// @route   POST /api/products
// @desc    Create a new product (Admin only)
// @access  Private/Admin
router.post('/', [
  auth,
  adminAuth,
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Product name must be between 1 and 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Description must be between 1 and 500 characters'),
  body('service')
    .isMongoId()
    .withMessage('Valid service ID is required'),
  body('quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('deliveryTime')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Delivery time must be between 1 and 50 characters'),
  body('features')
    .optional()
    .isArray()
    .withMessage('Features must be an array'),
  body('currency')
    .optional()
    .isIn(['₺', '$', '€'])
    .withMessage('Invalid currency')
], createProduct);

// @route   PUT /api/products/:id
// @desc    Update a product (Admin only)
// @access  Private/Admin
router.put('/:id', [
  auth,
  adminAuth,
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Product name must be between 1 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Description must be between 1 and 500 characters'),
  body('service')
    .optional()
    .isMongoId()
    .withMessage('Valid service ID is required'),
  body('quantity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer'),
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
], updateProduct);

// @route   DELETE /api/products/:id
// @desc    Delete a product (Admin only)
// @access  Private/Admin
router.delete('/:id', [auth, adminAuth], deleteProduct);

module.exports = router;