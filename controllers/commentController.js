const { validationResult } = require('express-validator');
const Comment = require('../models/Comment');
const Service = require('../models/Service');

// @desc    Get comments for a service
// @route   GET /api/comments/service/:serviceId
// @access  Public
const getServiceComments = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Check if service exists
    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    // Get top-level comments (not replies)
    const comments = await Comment.find({
      service: serviceId,
      parentComment: null,
      isActive: true
    })
    .populate('author', 'name')
    .populate({
      path: 'replies',
      match: { isActive: true },
      populate: {
        path: 'author',
        select: 'name'
      },
      options: { sort: { createdAt: 1 } }
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

    // Get total count for pagination
    const total = await Comment.countDocuments({
      service: serviceId,
      parentComment: null,
      isActive: true
    });

    res.json({
      success: true,
      data: {
        comments,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalComments: total,
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get service comments error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid service ID'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error while fetching comments'
    });
  }
};

// @desc    Create a new comment
// @route   POST /api/comments
// @access  Private
const createComment = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { content, service, parentComment } = req.body;

    // Check if service exists
    const serviceExists = await Service.findById(service);
    if (!serviceExists) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    // If it's a reply, check if parent comment exists
    if (parentComment) {
      const parentExists = await Comment.findById(parentComment);
      if (!parentExists) {
        return res.status(404).json({
          success: false,
          message: 'Parent comment not found'
        });
      }

      // Ensure parent comment belongs to the same service
      if (parentExists.service.toString() !== service) {
        return res.status(400).json({
          success: false,
          message: 'Parent comment does not belong to this service'
        });
      }
    }

    const comment = new Comment({
      content,
      author: req.user._id,
      service,
      parentComment: parentComment || null
    });

    await comment.save();

    // Populate author info
    await comment.populate('author', 'name');

    res.status(201).json({
      success: true,
      message: 'Comment created successfully',
      data: {
        comment
      }
    });

  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating comment'
    });
  }
};

// @desc    Update a comment
// @route   PUT /api/comments/:id
// @access  Private
const updateComment = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check if user is the author of the comment
    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this comment'
      });
    }

    // Update comment content
    comment.content = req.body.content;
    await comment.save();

    // Populate author info
    await comment.populate('author', 'name');

    res.json({
      success: true,
      message: 'Comment updated successfully',
      data: {
        comment
      }
    });

  } catch (error) {
    console.error('Update comment error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid comment ID'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error while updating comment'
    });
  }
};

// @desc    Delete a comment
// @route   DELETE /api/comments/:id
// @access  Private
const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check if user is the author of the comment or admin
    if (comment.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this comment'
      });
    }

    // Soft delete by setting isActive to false
    comment.isActive = false;
    await comment.save();

    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });

  } catch (error) {
    console.error('Delete comment error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid comment ID'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error while deleting comment'
    });
  }
};

// @desc    Like/Unlike a comment
// @route   POST /api/comments/:id/like
// @access  Private
const toggleCommentLike = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    if (!comment.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Comment not available'
      });
    }

    const userId = req.user._id;
    const isLiked = comment.isLikedByUser(userId);

    if (isLiked) {
      // Unlike the comment
      await comment.removeLike(userId);
      res.json({
        success: true,
        message: 'Comment unliked successfully',
        data: {
          liked: false,
          likeCount: comment.likeCount
        }
      });
    } else {
      // Like the comment
      await comment.addLike(userId);
      res.json({
        success: true,
        message: 'Comment liked successfully',
        data: {
          liked: true,
          likeCount: comment.likeCount
        }
      });
    }

  } catch (error) {
    console.error('Toggle comment like error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid comment ID'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error while toggling like'
    });
  }
};

// @desc    Get comment by ID
// @route   GET /api/comments/:id
// @access  Public
const getComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id)
      .populate('author', 'name')
      .populate({
        path: 'replies',
        match: { isActive: true },
        populate: {
          path: 'author',
          select: 'name'
        },
        options: { sort: { createdAt: 1 } }
      });

    if (!comment || !comment.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    res.json({
      success: true,
      data: {
        comment
      }
    });

  } catch (error) {
    console.error('Get comment error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid comment ID'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error while fetching comment'
    });
  }
};

module.exports = {
  getServiceComments,
  createComment,
  updateComment,
  deleteComment,
  toggleCommentLike,
  getComment
};