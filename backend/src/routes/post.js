const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const auth = require('../middleware/auth');

// @route   POST /api/posts/create
// @desc    Create a new post (Authors only)
// @access  Private (Authors)
router.post('/create', auth, async (req, res) => {
  try {
    const { title, content, tierAccess } = req.body;

    // Check if user is an author
    if (req.user.role !== 'author') {
      return res.status(403).json({ message: 'Only authors can create posts' });
    }

    // Validation
    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }

    const post = new Post({
      authorId: req.user._id,
      title,
      content,
      tierAccess: tierAccess || 'all'
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

// @route   GET /api/posts/author/:authorId
// @desc    Get all posts by an author (for subscribers)
// @access  Private
router.get('/author/:authorId', auth, async (req, res) => {
  try {
    const { authorId } = req.params;

    // Get posts
    const posts = await Post.find({ authorId })
      .populate('authorId', 'displayName email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      posts
    });
  } catch (error) {
    console.error('Get author posts error:', error);
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
