const { validationResult } = require('express-validator');
const Product = require('../models/Product');
const Service = require('../models/Service');

// @desc    Get all products with filtering and pagination
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
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
    
    if (req.query.service) filter.service = req.query.service;
    if (req.query.minPrice || req.query.maxPrice) {
      filter.price = {};
      if (req.query.minPrice) filter.price.$gte = parseFloat(req.query.minPrice);
      if (req.query.maxPrice) filter.price.$lte = parseFloat(req.query.maxPrice);
    }
    if (req.query.minQuantity || req.query.maxQuantity) {
      filter.quantity = {};
      if (req.query.minQuantity) filter.quantity.$gte = parseInt(req.query.minQuantity);
      if (req.query.maxQuantity) filter.quantity.$lte = parseInt(req.query.maxQuantity);
    }

    // Get products with pagination
    const products = await Product.find(filter)
      .populate('service', 'name platform category')
      .sort({ isPopular: -1, price: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const total = await Product.countDocuments(filter);

    res.json({
      success: true,
      data: {
        products,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalProducts: total,
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching products'
    });
  }
};

// @desc    Get single product by ID
// @route   GET /api/products/:id
// @access  Public
const getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('service', 'name description platform category features');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    if (!product.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Product is not available'
      });
    }

    res.json({
      success: true,
      data: {
        product
      }
    });

  } catch (error) {
    console.error('Get product error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error while fetching product'
    });
  }
};

// @desc    Get products by service
// @route   GET /api/products/service/:serviceId
// @access  Public
const getProductsByService = async (req, res) => {
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

    // Build filter
    const filter = { service: serviceId, isActive: true };

    const products = await Product.find(filter)
      .populate('service', 'name platform category')
      .sort({ price: 1, quantity: 1 })
      .skip(skip)
      .limit(limit);

    const total = await Product.countDocuments(filter);

    res.json({
      success: true,
      data: {
        service: {
          _id: service._id,
          name: service.name,
          description: service.description,
          platform: service.platform
        },
        products,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalProducts: total,
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get products by service error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid service ID'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error while fetching products'
    });
  }
};

// @desc    Create a new product (Admin only)
// @route   POST /api/products
// @access  Private/Admin
const createProduct = async (req, res) => {
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

    // Check if service exists
    const service = await Service.findById(req.body.service);
    if (!service) {
      return res.status(400).json({
        success: false,
        message: 'Service not found'
      });
    }

    const product = new Product(req.body);
    await product.save();

    // Populate service info
    await product.populate('service', 'name platform category');

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: {
        product
      }
    });

  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating product'
    });
  }
};

// @desc    Update a product (Admin only)
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = async (req, res) => {
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

    // If service is being updated, check if it exists
    if (req.body.service) {
      const service = await Service.findById(req.body.service);
      if (!service) {
        return res.status(400).json({
          success: false,
          message: 'Service not found'
        });
      }
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('service', 'name platform category');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: {
        product
      }
    });

  } catch (error) {
    console.error('Update product error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error while updating product'
    });
  }
};

// @desc    Delete a product (Admin only)
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });

  } catch (error) {
    console.error('Delete product error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error while deleting product'
    });
  }
};

// @desc    Get popular products
// @route   GET /api/products/popular/list
// @access  Public
const getPopularProducts = async (req, res) => {
  try {
    const products = await Product.find({ 
      isActive: true, 
      isPopular: true 
    })
    .populate('service', 'name platform category')
    .sort({ createdAt: -1 })
    .limit(10);

    res.json({
      success: true,
      data: {
        products
      }
    });

  } catch (error) {
    console.error('Get popular products error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching popular products'
    });
  }
};

module.exports = {
  getProducts,
  getProduct,
  getProductsByService,
  createProduct,
  updateProduct,
  deleteProduct,
  getPopularProducts
};