const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product is required']
  },
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: [true, 'Service is required']
  },
  // Process details
  processLink: {
    type: String,
    required: [true, 'Process link is required'],
    trim: true,
    validate: {
      validator: function(v) {
        // Basic URL validation
        return /^https?:\/\/.+/.test(v);
      },
      message: 'Please enter a valid URL'
    }
  },
  // Customer details
  customerDetails: {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      maxlength: [100, 'Full name cannot exceed 100 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please enter a valid email address'
      ]
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      match: [
        /^[\+]?[1-9][\d]{0,15}$/,
        'Please enter a valid phone number'
      ]
    }
  },
  // Pricing details
  pricing: {
    originalPrice: {
      type: Number,
      required: [true, 'Original price is required'],
      min: [0, 'Price cannot be negative']
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: [0, 'Discount amount cannot be negative']
    },
    finalPrice: {
      type: Number,
      required: [true, 'Final price is required'],
      min: [0, 'Final price cannot be negative']
    },
    currency: {
      type: String,
      default: '₺',
      enum: ['₺', '$', '€']
    }
  },
  // Coupon details
  coupon: {
    code: {
      type: String,
      trim: true,
      uppercase: true
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      default: 'percentage'
    },
    discountValue: {
      type: Number,
      min: 0
    }
  },
  // Payment details
  payment: {
    method: {
      type: String,
      required: [true, 'Payment method is required'],
      enum: ['crypto_dodo', 'crypto_coinbase', 'credit_card', 'bank_transfer'],
      default: 'crypto_dodo'
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'],
      default: 'pending'
    },
    transactionId: {
      type: String,
      trim: true
    },
    paymentData: {
      type: mongoose.Schema.Types.Mixed // Store payment provider specific data
    },
    paidAt: {
      type: Date
    }
  },
  // Order status
  status: {
    type: String,
    enum: ['pending', 'processing', 'in_progress', 'completed', 'cancelled', 'refunded'],
    default: 'pending'
  },
  // Processing details
  processing: {
    startedAt: {
      type: Date
    },
    completedAt: {
      type: Date
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters']
    }
  },
  // Admin notes
  adminNotes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Admin notes cannot exceed 1000 characters']
  },
  // Timestamps for different stages
  timestamps: {
    ordered: {
      type: Date,
      default: Date.now
    },
    paid: {
      type: Date
    },
    started: {
      type: Date
    },
    completed: {
      type: Date
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for order duration
orderSchema.virtual('orderDuration').get(function() {
  if (this.timestamps.completed && this.timestamps.ordered) {
    return Math.ceil((this.timestamps.completed - this.timestamps.ordered) / (1000 * 60 * 60)); // hours
  }
  return null;
});

// Virtual for processing duration
orderSchema.virtual('processingDuration').get(function() {
  if (this.timestamps.completed && this.timestamps.started) {
    return Math.ceil((this.timestamps.completed - this.timestamps.started) / (1000 * 60 * 60)); // hours
  }
  return null;
});

// Pre-save middleware to generate order number
orderSchema.pre('save', async function(next) {
  if (this.isNew && !this.orderNumber) {
    try {
      const count = await this.constructor.countDocuments();
      this.orderNumber = `ORD-${Date.now()}-${(count + 1).toString().padStart(4, '0')}`;
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Pre-save middleware to update timestamps based on status
orderSchema.pre('save', function(next) {
  if (this.isModified('payment.status') && this.payment.status === 'completed' && !this.timestamps.paid) {
    this.timestamps.paid = new Date();
  }
  
  if (this.isModified('status')) {
    switch (this.status) {
      case 'processing':
      case 'in_progress':
        if (!this.timestamps.started) {
          this.timestamps.started = new Date();
        }
        break;
      case 'completed':
        if (!this.timestamps.completed) {
          this.timestamps.completed = new Date();
        }
        break;
    }
  }
  
  next();
});

// Index for better performance
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ 'payment.status': 1 });
orderSchema.index({ service: 1 });
orderSchema.index({ product: 1 });

module.exports = mongoose.model('Order', orderSchema);