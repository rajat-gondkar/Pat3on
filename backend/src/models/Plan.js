const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tierName: {
    type: String,
    required: [true, 'Plan tier name is required'],
    trim: true,
    maxlength: [100, 'Tier name cannot exceed 100 characters']
  },
  description: {
    type: String,
    maxlength: [1000, 'Description cannot exceed 1000 characters'],
    default: ''
  },
  pricePerMonth: {
    type: Number,
    required: [true, 'Price per month is required'],
    min: [0, 'Price cannot be negative']
  },
  currency: {
    type: String,
    default: 'USDC',
    uppercase: true
  },
  benefits: [{
    type: String,
    maxlength: [200, 'Benefit description cannot exceed 200 characters']
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  subscriberCount: {
    type: Number,
    default: 0,
    min: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster lookups
planSchema.index({ authorId: 1, isActive: 1 });

// Virtual for displaying price (could format based on currency)
planSchema.virtual('formattedPrice').get(function() {
  return `${this.pricePerMonth} ${this.currency}`;
});

module.exports = mongoose.model('Plan', planSchema);
