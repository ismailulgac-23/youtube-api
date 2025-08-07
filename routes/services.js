const express = require('express');
const { body, query } = require('express-validator');
const { auth, adminAuth } = require('../middleware/auth');
const {
  getServices,
  getService,
  createService,
  updateService,
  deleteService,
  getPopularServices
} = require('../controllers/serviceController');

const router = express.Router();

// @route   GET /api/services/popular/list
// @desc    Get popular services
// @access  Public
router.get('/popular/list', getPopularServices);

// @route   GET /api/services
// @desc    Get all services with filtering and pagination
// @access  Public
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('popular').optional().isBoolean().withMessage('Popular must be a boolean')
], getServices);

// @route   GET /api/services/:identifier
// @desc    Get single service by ID or slug
// @access  Public
router.get('/:identifier', getService);

// @route   POST /api/services
// @desc    Create a new service (Admin only)
// @access  Private/Admin
router.post('/', [
  auth,
  adminAuth,
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Service name must be between 1 and 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Description must be between 1 and 500 characters'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('sortOrder')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Sort order must be a non-negative integer')
], createService);

// @route   PUT /api/services/:id
// @desc    Update a service (Admin only)
// @access  Private/Admin
router.put('/:id', [
  auth,
  adminAuth,
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Service name must be between 1 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Description must be between 1 and 500 characters'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('sortOrder')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Sort order must be a non-negative integer'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  body('isPopular')
    .optional()
    .isBoolean()
    .withMessage('isPopular must be a boolean')
], updateService);

// @route   DELETE /api/services/:id
// @desc    Delete a service (Admin only)
// @access  Private/Admin
router.delete('/:id', [auth, adminAuth], deleteService);

module.exports = router;