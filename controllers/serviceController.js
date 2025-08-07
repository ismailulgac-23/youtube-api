const { validationResult } = require('express-validator');
const Service = require('../models/Service');
const Comment = require('../models/Comment');

// @desc    Get all services with filtering and pagination
// @route   GET /api/services
// @access  Public
const getServices = async (req, res) => {
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

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = { isActive: true };
    
    if (req.query.popular === 'true') filter.isPopular = true;

    // Get services with pagination
    const services = await Service.find(filter)
      .populate('products', 'name price quantity currency targetAudience isActive')
      .sort({ sortOrder: 1, isPopular: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const total = await Service.countDocuments(filter);

    res.json({
      success: true,
      data: {
        services,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalServices: total,
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching services'
    });
  }
};

// @desc    Get single service by ID or slug
// @route   GET /api/services/:identifier
// @access  Public
const getService = async (req, res) => {
  try {
    const { identifier } = req.params;
    let service;

    // Check if identifier is ObjectId or slug
    if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
      service = await Service.findById(identifier);
    } else {
      service = await Service.findOne({ slug: identifier });
    }

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    if (!service.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Service is not available'
      });
    }

    // Populate products
    await service.populate({
      path: 'products',
      match: { isActive: true },
      options: { sort: { price: 1 } }
    });

    // Get comment count
    const commentCount = await Comment.countDocuments({
      service: service._id,
      isActive: true
    });

    res.json({
      success: true,
      data: {
        service: {
          ...service.toObject(),
          commentCount
        }
      }
    });

  } catch (error) {
    console.error('Get service error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid service ID'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error while fetching service'
    });
  }
};

// @desc    Create a new service (Admin only)
// @route   POST /api/services
// @access  Private/Admin
const createService = async (req, res) => {
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

    const service = new Service(req.body);
    await service.save();

    res.status(201).json({
      success: true,
      message: 'Service created successfully',
      data: {
        service
      }
    });

  } catch (error) {
    console.error('Create service error:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Service with this name already exists'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error while creating service'
    });
  }
};

// @desc    Update a service (Admin only)
// @route   PUT /api/services/:id
// @access  Private/Admin
const updateService = async (req, res) => {
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

    const service = await Service.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    res.json({
      success: true,
      message: 'Service updated successfully',
      data: {
        service
      }
    });

  } catch (error) {
    console.error('Update service error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid service ID'
      });
    }
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Service with this name already exists'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error while updating service'
    });
  }
};

// @desc    Delete a service (Admin only)
// @route   DELETE /api/services/:id
// @access  Private/Admin
const deleteService = async (req, res) => {
  try {
    const service = await Service.findByIdAndDelete(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    res.json({
      success: true,
      message: 'Service deleted successfully'
    });

  } catch (error) {
    console.error('Delete service error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid service ID'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error while deleting service'
    });
  }
};

// @desc    Get popular services
// @route   GET /api/services/popular/list
// @access  Public
const getPopularServices = async (req, res) => {
  try {
    const services = await Service.find({ 
      isActive: true, 
      isPopular: true 
    })
    .populate('products', 'name price quantity currency targetAudience isActive')
    .sort({ sortOrder: 1, createdAt: -1 })
    .limit(10);

    res.json({
      success: true,
      data: {
        services
      }
    });

  } catch (error) {
    console.error('Get popular services error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching popular services'
    });
  }
};

module.exports = {
  getServices,
  getService,
  createService,
  updateService,
  deleteService,
  getPopularServices
};