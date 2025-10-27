const mongoose = require('mongoose');

const authorProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: [true, 'Author name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters'],
    default: ''
  },
  profileImage: {
    type: String,
    default: null
  },
  socialLinks: {
    twitter: { type: String, default: '' },
    website: { type: String, default: '' },
    discord: { type: String, default: '' },
    telegram: { type: String, default: '' }
  },
  plans: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plan'
  }],
  totalSubscribers: {
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
authorProfileSchema.index({ userId: 1 });

module.exports = mongoose.model('AuthorProfile', authorProfileSchema);
