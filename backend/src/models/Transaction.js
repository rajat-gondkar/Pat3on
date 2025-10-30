const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
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
  subscriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription',
    required: true
  },
  planId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plan',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'mUSDC'
  },
  transactionHash: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['initial_subscription', 'renewal'],
    required: true
  },
  status: {
    type: String,
    enum: ['success', 'failed'],
    default: 'success'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
transactionSchema.index({ subscriberId: 1, createdAt: -1 });
transactionSchema.index({ authorId: 1, createdAt: -1 });
transactionSchema.index({ subscriptionId: 1, createdAt: -1 });
transactionSchema.index({ transactionHash: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
