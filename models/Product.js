const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [100, 'Product name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: [true, 'Service is required']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  currency: {
    type: String,
    default: '₺',
    enum: ['₺', '$', '€']
  },
  deliveryTime: {
    type: String,
    required: [true, 'Delivery time is required'],
    default: '24-48 hours'
  },
  features: [{
    type: String,
    trim: true
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  isPopular: {
    type: Boolean,
    default: false
  },
  stock: {
    type: Number,
    default: -1 // -1 means unlimited stock
  }
}, {
  timestamps: true
});


// Virtual for formatted quantity
productSchema.virtual('formattedQuantity').get(function() {
  if (this.quantity >= 1000000) {
    return (this.quantity / 1000000).toFixed(1) + 'M';
  } else if (this.quantity >= 1000) {
    return (this.quantity / 1000).toFixed(1) + 'K';
  }
  return this.quantity.toString();
});

// Ensure virtual fields are serialized
productSchema.set('toJSON', { virtuals: true });

// Index for better performance
productSchema.index({ service: 1, isActive: 1 });
productSchema.index({ price: 1 });

module.exports = mongoose.model('Product', productSchema);