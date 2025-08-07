const { validationResult } = require('express-validator');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Service = require('../models/Service');
const Coupon = require('../models/Coupon');
const User = require('../models/User');

// @desc    Create a new order
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res) => {
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

    const {
      productId,
      processLink,
      customerDetails,
      paymentMethod,
      couponCode
    } = req.body;

    // Get product and service details
    const product = await Product.findById(productId).populate('service');
    if (!product || !product.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or not available'
      });
    }

    const service = product.service;
    if (!service || !service.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Service not found or not available'
      });
    }

    // Calculate pricing
    let originalPrice = product.price;
    let discountAmount = 0;
    let couponData = null;

    // Apply coupon if provided
    if (couponCode) {
      const coupon = await Coupon.findOne({ 
        code: couponCode.toUpperCase(),
        isActive: true 
      });

      if (!coupon) {
        return res.status(400).json({
          success: false,
          message: 'Invalid coupon code'
        });
      }

      // Check if coupon is valid
      if (!coupon.isCurrentlyValid) {
        return res.status(400).json({
          success: false,
          message: 'Coupon has expired or is not valid'
        });
      }

      // Check if user can use this coupon
      const canUse = coupon.canUserUseCoupon(req.user._id);
      if (!canUse.canUse) {
        return res.status(400).json({
          success: false,
          message: canUse.reason
        });
      }

      // Check if coupon applies to this service/product
      if (!coupon.appliesTo(service._id, product._id)) {
        return res.status(400).json({
          success: false,
          message: 'Coupon is not applicable to this product'
        });
      }

      // Calculate discount
      discountAmount = coupon.calculateDiscount(originalPrice);
      
      if (discountAmount > 0) {
        couponData = {
          code: coupon.code,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue
        };
      }
    }

    const finalPrice = Math.max(0, originalPrice - discountAmount);

    // Generate order number
    const orderCount = await Order.countDocuments();
    const orderNumber = `ORD-${Date.now()}-${(orderCount + 1).toString().padStart(4, '0')}`;

    // Create order
    const order = new Order({
      orderNumber,
      user: req.user._id,
      product: product._id,
      service: service._id,
      processLink,
      customerDetails,
      pricing: {
        originalPrice,
        discountAmount,
        finalPrice,
        currency: product.currency
      },
      coupon: couponData,
      payment: {
        method: paymentMethod,
        status: 'pending'
      }
    });

    await order.save();

    // Use coupon if applied
    if (couponCode && discountAmount > 0) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
      await coupon.useCoupon(req.user._id, order._id, discountAmount);
    }

    // Populate order details
    await order.populate([
      { path: 'user', select: 'name email' },
      { path: 'product', select: 'name quantity price currency' },
      { path: 'service', select: 'name description' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: {
        order
      }
    });

  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating order'
    });
  }
};

// @desc    Get user orders
// @route   GET /api/orders
// @access  Private
const getUserOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = { user: req.user._id };
    
    if (req.query.status) {
      filter.status = req.query.status;
    }

    const orders = await Order.find(filter)
      .populate('product', 'name quantity price currency')
      .populate('service', 'name description')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Order.countDocuments(filter);

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalOrders: total,
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get user orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching orders'
    });
  }
};

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
const getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email')
      .populate('product', 'name quantity price currency')
      .populate('service', 'name description');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user owns this order or is admin
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this order'
      });
    }

    res.json({
      success: true,
      data: {
        order
      }
    });

  } catch (error) {
    console.error('Get order error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error while fetching order'
    });
  }
};

// @desc    Update order status (Admin only)
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = async (req, res) => {
  try {
    const { status, adminNotes, progress } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Update order status
    order.status = status;
    
    if (adminNotes) {
      order.adminNotes = adminNotes;
    }

    if (progress !== undefined) {
      order.processing.progress = progress;
    }

    // Update processing timestamps based on status
    if (status === 'processing' || status === 'in_progress') {
      if (!order.processing.startedAt) {
        order.processing.startedAt = new Date();
      }
    }

    if (status === 'completed') {
      order.processing.completedAt = new Date();
      order.processing.progress = 100;
    }

    await order.save();

    // Populate order details
    await order.populate([
      { path: 'user', select: 'name email' },
      { path: 'product', select: 'name quantity price currency' },
      { path: 'service', select: 'name description' }
    ]);

    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: {
        order
      }
    });

  } catch (error) {
    console.error('Update order status error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error while updating order status'
    });
  }
};

// @desc    Validate coupon
// @route   POST /api/orders/validate-coupon
// @access  Private
const validateCoupon = async (req, res) => {
  try {
    const { couponCode, productId } = req.body;

    if (!couponCode) {
      return res.status(400).json({
        success: false,
        message: 'Coupon code is required'
      });
    }

    const coupon = await Coupon.findOne({ 
      code: couponCode.toUpperCase(),
      isActive: true 
    });

    if (!coupon) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coupon code'
      });
    }

    // Check if coupon is valid
    if (!coupon.isCurrentlyValid) {
      return res.status(400).json({
        success: false,
        message: 'Coupon has expired or is not valid'
      });
    }

    // Check if user can use this coupon
    const canUse = coupon.canUserUseCoupon(req.user._id);
    if (!canUse.canUse) {
      return res.status(400).json({
        success: false,
        message: canUse.reason
      });
    }

    // If productId is provided, check if coupon applies
    if (productId) {
      const product = await Product.findById(productId).populate('service');
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      if (!coupon.appliesTo(product.service._id, product._id)) {
        return res.status(400).json({
          success: false,
          message: 'Coupon is not applicable to this product'
        });
      }

      // Calculate discount for this product
      const discountAmount = coupon.calculateDiscount(product.price);
      const finalPrice = Math.max(0, product.price - discountAmount);

      return res.json({
        success: true,
        message: 'Coupon is valid',
        data: {
          coupon: {
            code: coupon.code,
            name: coupon.name,
            discountType: coupon.discountType,
            discountValue: coupon.discountValue
          },
          discount: {
            originalPrice: product.price,
            discountAmount,
            finalPrice,
            currency: product.currency
          }
        }
      });
    }

    res.json({
      success: true,
      message: 'Coupon is valid',
      data: {
        coupon: {
          code: coupon.code,
          name: coupon.name,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          minimumAmount: coupon.minimumAmount
        }
      }
    });

  } catch (error) {
    console.error('Validate coupon error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while validating coupon'
    });
  }
};

// @desc    Get all orders (Admin only)
// @route   GET /api/orders/admin/all
// @access  Private/Admin
const getAllOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = {};
    
    if (req.query.status) {
      filter.status = req.query.status;
    }
    
    if (req.query.paymentStatus) {
      filter['payment.status'] = req.query.paymentStatus;
    }

    const orders = await Order.find(filter)
      .populate('user', 'name email')
      .populate('product', 'name quantity price currency')
      .populate('service', 'name description')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Order.countDocuments(filter);

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalOrders: total,
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching orders'
    });
  }
};

// @desc    Query order by order number (Public)
// @route   POST /api/orders/query
// @access  Public
const queryOrder = async (req, res) => {
  try {
    const { orderNumber } = req.body;

    if (!orderNumber) {
      return res.status(400).json({
        success: false,
        message: 'Sipariş numarası gereklidir',
        messageEn: 'Order number is required'
      });
    }

    // Find order by order number
    const order = await Order.findOne({ orderNumber: orderNumber.trim() })
      .populate('product', 'name quantity price currency')
      .populate('service', 'name description')
      .select('-user -customerDetails.email -customerDetails.phone -payment.paymentData -adminNotes');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Sipariş numarası bulunamadı. Lütfen tekrar deneyin.',
        messageEn: 'Order number not found. Please try again.'
      });
    }

    // Return limited order information for public access
    const publicOrderData = {
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.payment.status,
      service: {
        name: order.service.name,
        description: order.service.description
      },
      product: {
        name: order.product.name,
        quantity: order.product.quantity
      },
      pricing: {
        finalPrice: order.pricing.finalPrice,
        currency: order.pricing.currency
      },
      processLink: order.processLink,
      processing: {
        progress: order.processing.progress,
        startedAt: order.processing.startedAt,
        completedAt: order.processing.completedAt
      },
      timestamps: {
        ordered: order.timestamps.ordered,
        paid: order.timestamps.paid,
        started: order.timestamps.started,
        completed: order.timestamps.completed
      },
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    };

    res.json({
      success: true,
      message: 'Sipariş bulundu',
      messageEn: 'Order found',
      data: {
        order: publicOrderData
      }
    });

  } catch (error) {
    console.error('Query order error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası oluştu',
      messageEn: 'Server error occurred'
    });
  }
};

// @desc    Get order tracking information (Public)
// @route   GET /api/orders/track/:orderNumber
// @access  Public
const trackOrder = async (req, res) => {
  try {
    const { orderNumber } = req.params;

    const order = await Order.findOne({ orderNumber })
      .populate('product', 'name quantity')
      .populate('service', 'name')
      .select('-user -customerDetails -payment.paymentData -adminNotes');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Sipariş bulunamadı',
        messageEn: 'Order not found'
      });
    }

    // Create tracking timeline
    const timeline = [];

    // Order placed
    timeline.push({
      status: 'ordered',
      title: 'Sipariş Alındı',
      titleEn: 'Order Placed',
      description: 'Siparişiniz başarıyla alındı',
      descriptionEn: 'Your order has been successfully placed',
      timestamp: order.timestamps.ordered,
      completed: true
    });

    // Payment
    if (order.timestamps.paid) {
      timeline.push({
        status: 'paid',
        title: 'Ödeme Alındı',
        titleEn: 'Payment Received',
        description: 'Ödemeniz başarıyla alındı',
        descriptionEn: 'Your payment has been successfully received',
        timestamp: order.timestamps.paid,
        completed: true
      });
    } else {
      timeline.push({
        status: 'payment_pending',
        title: 'Ödeme Bekleniyor',
        titleEn: 'Payment Pending',
        description: 'Ödemeniz bekleniyor',
        descriptionEn: 'Waiting for your payment',
        timestamp: null,
        completed: false
      });
    }

    // Processing
    if (order.timestamps.started) {
      timeline.push({
        status: 'processing',
        title: 'İşleme Alındı',
        titleEn: 'Processing Started',
        description: `İşlem başladı (${order.processing.progress}% tamamlandı)`,
        descriptionEn: `Processing started (${order.processing.progress}% completed)`,
        timestamp: order.timestamps.started,
        completed: order.processing.progress === 100
      });
    } else if (order.timestamps.paid) {
      timeline.push({
        status: 'processing_pending',
        title: 'İşleme Alınacak',
        titleEn: 'Will Be Processed',
        description: 'Siparişiniz yakında işleme alınacak',
        descriptionEn: 'Your order will be processed soon',
        timestamp: null,
        completed: false
      });
    }

    // Completed
    if (order.timestamps.completed) {
      timeline.push({
        status: 'completed',
        title: 'Tamamlandı',
        titleEn: 'Completed',
        description: 'Siparişiniz başarıyla tamamlandı',
        descriptionEn: 'Your order has been successfully completed',
        timestamp: order.timestamps.completed,
        completed: true
      });
    }

    res.json({
      success: true,
      data: {
        order: {
          orderNumber: order.orderNumber,
          status: order.status,
          paymentStatus: order.payment.status,
          service: order.service,
          product: order.product,
          processLink: order.processLink,
          progress: order.processing.progress
        },
        timeline
      }
    });

  } catch (error) {
    console.error('Track order error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz sipariş numarası',
        messageEn: 'Invalid order number'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası oluştu',
      messageEn: 'Server error occurred'
    });
  }
};

module.exports = {
  createOrder,
  getUserOrders,
  getOrder,
  updateOrderStatus,
  validateCoupon,
  getAllOrders,
  queryOrder,
  trackOrder
};