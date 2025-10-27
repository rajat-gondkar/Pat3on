const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  subscriberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  planId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plan',
    required: true
  },
  streamId: {
    type: String,
    default: null // Superfluid stream ID
  },
  startDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  endDate: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['active', 'cancelled', 'expired'],
    default: 'active'
  },
  transactionHash: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate active subscriptions
subscriptionSchema.index({ subscriberId: 1, planId: 1, status: 1 });

// Index for author to quickly find their subscribers
subscriptionSchema.index({ authorId: 1, status: 1 });

// Virtual to check if subscription is currently active
subscriptionSchema.virtual('isCurrentlyActive').get(function() {
  return this.status === 'active' && (!this.endDate || this.endDate > new Date());
});

module.exports = mongoose.model('Subscription', subscriptionSchema);
