const express = require('express');
const { body, query } = require('express-validator');
const { auth } = require('../middleware/auth');
const {
  getServiceComments,
  createComment,
  updateComment,
  deleteComment,
  toggleCommentLike,
  getComment
} = require('../controllers/commentController');

const router = express.Router();

// @route   GET /api/comments/service/:serviceId
// @desc    Get comments for a service
// @access  Public
router.get('/service/:serviceId', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
], getServiceComments);

// @route   GET /api/comments/:id
// @desc    Get comment by ID
// @access  Public
router.get('/:id', getComment);

// @route   POST /api/comments
// @desc    Create a new comment
// @access  Private
router.post('/', [
  auth,
  body('content')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Comment content must be between 1 and 1000 characters'),
  body('service')
    .isMongoId()
    .withMessage('Valid service ID is required'),
  body('parentComment')
    .optional()
    .isMongoId()
    .withMessage('Valid parent comment ID is required')
], createComment);

// @route   PUT /api/comments/:id
// @desc    Update a comment
// @access  Private
router.put('/:id', [
  auth,
  body('content')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Comment content must be between 1 and 1000 characters')
], updateComment);

// @route   DELETE /api/comments/:id
// @desc    Delete a comment
// @access  Private
router.delete('/:id', auth, deleteComment);

// @route   POST /api/comments/:id/like
// @desc    Like/Unlike a comment
// @access  Private
router.post('/:id/like', auth, toggleCommentLike);

module.exports = router;