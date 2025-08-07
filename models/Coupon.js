const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Coupon code is required'],
    unique: true,
    uppercase: true,
    trim: true,
    minlength: [3, 'Coupon code must be at least 3 characters'],
    maxlength: [20, 'Coupon code cannot exceed 20 characters'],
    match: [/^[A-Z0-9]+$/, 'Coupon code can only contain uppercase letters and numbers']
  },
  name: {
    type: String,
    required: [true, 'Coupon name is required'],
    trim: true,
    maxlength: [100, 'Coupon name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  discountType: {
    type: String,
    required: [true, 'Discount type is required'],
    enum: ['percentage', 'fixed'],
    default: 'percentage'
  },
  discountValue: {
    type: Number,
    required: [true, 'Discount value is required'],
    min: [0, 'Discount value cannot be negative']
  },
  // Minimum order amount to apply coupon
  minimumAmount: {
    type: Number,
    default: 0,
    min: [0, 'Minimum amount cannot be negative']
  },
  // Maximum discount amount (for percentage discounts)
  maximumDiscount: {
    type: Number,
    min: [0, 'Maximum discount cannot be negative']
  },
  // Usage limits
  usageLimit: {
    total: {
      type: Number,
      default: null // null means unlimited
    },
    perUser: {
      type: Number,
      default: 1
    }
  },
  // Current usage count
  usageCount: {
    type: Number,
    default: 0,
    min: 0
  },
  // Validity period
  validFrom: {
    type: Date,
    required: [true, 'Valid from date is required'],
    default: Date.now
  },
  validUntil: {
    type: Date,
    required: [true, 'Valid until date is required']
  },
  // Applicable services/products
  applicableServices: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service'
  }],
  applicableProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  // If empty, applies to all services/products
  applyToAll: {
    type: Boolean,
    default: true
  },
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  // Creator
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Usage tracking
  usedBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    },
    usedAt: {
      type: Date,
      default: Date.now
    },
    discountAmount: {
      type: Number,
      required: true
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for checking if coupon is currently valid
couponSchema.virtual('isCurrentlyValid').get(function() {
  const now = new Date();
  return this.isActive && 
         this.validFrom <= now && 
         this.validUntil >= now &&
         (this.usageLimit.total === null || this.usageCount < this.usageLimit.total);
});

// Virtual for remaining uses
couponSchema.virtual('remainingUses').get(function() {
  if (this.usageLimit.total === null) {
    return 'Unlimited';
  }
  return Math.max(0, this.usageLimit.total - this.usageCount);
});

// Instance method to check if user can use this coupon
couponSchema.methods.canUserUseCoupon = function(userId) {
  if (!this.isCurrentlyValid) {
    return { canUse: false, reason: 'Coupon is not valid' };
  }
  
  const userUsageCount = this.usedBy.filter(usage => 
    usage.user.toString() === userId.toString()
  ).length;
  
  if (userUsageCount >= this.usageLimit.perUser) {
    return { canUse: false, reason: 'Usage limit per user exceeded' };
  }
  
  return { canUse: true };
};

// Instance method to check if coupon applies to service/product
couponSchema.methods.appliesTo = function(serviceId, productId) {
  if (this.applyToAll) {
    return true;
  }
  
  if (serviceId && this.applicableServices.includes(serviceId)) {
    return true;
  }
  
  if (productId && this.applicableProducts.includes(productId)) {
    return true;
  }
  
  return false;
};

// Instance method to calculate discount amount
couponSchema.methods.calculateDiscount = function(orderAmount) {
  if (orderAmount < this.minimumAmount) {
    return 0;
  }
  
  let discountAmount = 0;
  
  if (this.discountType === 'percentage') {
    discountAmount = (orderAmount * this.discountValue) / 100;
    
    // Apply maximum discount limit if set
    if (this.maximumDiscount && discountAmount > this.maximumDiscount) {
      discountAmount = this.maximumDiscount;
    }
  } else {
    // Fixed discount
    discountAmount = Math.min(this.discountValue, orderAmount);
  }
  
  return Math.round(discountAmount * 100) / 100; // Round to 2 decimal places
};

// Instance method to use coupon
couponSchema.methods.useCoupon = function(userId, orderId, discountAmount) {
  this.usageCount += 1;
  this.usedBy.push({
    user: userId,
    order: orderId,
    discountAmount: discountAmount
  });
  
  return this.save();
};

// Index for better performance
couponSchema.index({ code: 1 });
couponSchema.index({ isActive: 1, validFrom: 1, validUntil: 1 });
couponSchema.index({ createdBy: 1 });

// Pre-save validation
couponSchema.pre('save', function(next) {
  // Validate percentage discount
  if (this.discountType === 'percentage' && this.discountValue > 100) {
    return next(new Error('Percentage discount cannot exceed 100%'));
  }
  
  // Validate date range
  if (this.validUntil <= this.validFrom) {
    return next(new Error('Valid until date must be after valid from date'));
  }
  
  next();
});

module.exports = mongoose.model('Coupon', couponSchema);