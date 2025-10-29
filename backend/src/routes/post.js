const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const auth = require('../middleware/auth');

// @route   POST /api/posts/create
// @desc    Create a new post (Authors only)
// @access  Private (Authors)
router.post('/create', auth, async (req, res) => {
  try {
    const { title, content, planId } = req.body;

    // Check if user is an author
    if (req.user.role !== 'author') {
      return res.status(403).json({ message: 'Only authors can create posts' });
    }

    // Validation
    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }

    if (!planId) {
      return res.status(400).json({ message: 'Plan is required' });
    }

    const post = new Post({
      authorId: req.user._id,
      planId,
      title,
      content
    });

    await post.save();

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      post
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/posts/plan/:planId
// @desc    Get all posts for a specific plan (for subscribers only)
// @access  Private
router.get('/plan/:planId', auth, async (req, res) => {
  try {
    const { planId } = req.params;
    const Plan = require('../models/Plan');
    const Subscription = require('../models/Subscription');

    // Get plan details
    const plan = await Plan.findById(planId).populate('authorId', 'displayName email');
    
    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    // Check if user is subscribed to this plan
    const subscription = await Subscription.findOne({
      subscriberId: req.user._id,
      planId: planId,
      status: 'active'
    });

    if (!subscription && req.user._id.toString() !== plan.authorId._id.toString()) {
      return res.status(403).json({ message: 'You must be subscribed to this plan to view posts' });
    }

    // Get posts for this plan
    const posts = await Post.find({ planId })
      .populate('authorId', 'displayName email')
      .populate('planId', 'tierName pricePerMonth')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      plan,
      posts
    });
  } catch (error) {
    console.error('Get plan posts error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/posts/my-posts
// @desc    Get all posts for subscribed creators
// @access  Private
router.get('/my-posts', auth, async (req, res) => {
  try {
    // This would need to fetch posts from all creators the user is subscribed to
    // For now, returning empty array as placeholder
    res.json({
      success: true,
      posts: []
    });
  } catch (error) {
    console.error('Get my posts error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
