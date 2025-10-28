const express = require('express');
const router = express.Router();
const AuthorProfile = require('../models/AuthorProfile');
const auth = require('../middleware/auth');

// @route   POST /api/author/profile
// @desc    Create author profile
// @access  Private (Authors only)
router.post('/profile', auth, async (req, res) => {
  try {
    const { name, bio, profileImage, socialLinks } = req.body;

    // Check if user is an author
    if (req.user.role !== 'author') {
      return res.status(403).json({ message: 'Only authors can create profiles' });
    }

    // Check if profile already exists
    const existingProfile = await AuthorProfile.findOne({ userId: req.user._id });
    if (existingProfile) {
      return res.status(400).json({ message: 'Author profile already exists. Use PUT to update.' });
    }

    // Create new profile
    const profile = new AuthorProfile({
      userId: req.user._id,
      name,
      bio,
      profileImage,
      socialLinks
    });

    await profile.save();

    res.status(201).json({
      success: true,
      profile
    });
  } catch (error) {
    console.error('Create author profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/author/profile
// @desc    Update author profile
// @access  Private (Authors only)
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, bio, profileImage, socialLinks } = req.body;

    // Check if user is an author
    if (req.user.role !== 'author') {
      return res.status(403).json({ message: 'Only authors can update profiles' });
    }

    // Find and update profile
    let profile = await AuthorProfile.findOne({ userId: req.user._id });
    
    if (!profile) {
      return res.status(404).json({ message: 'Author profile not found. Create one first.' });
    }

    // Update fields
    if (name) profile.name = name;
    if (bio !== undefined) profile.bio = bio;
    if (profileImage !== undefined) profile.profileImage = profileImage;
    if (socialLinks) profile.socialLinks = { ...profile.socialLinks, ...socialLinks };

    await profile.save();

    res.json({
      success: true,
      profile
    });
  } catch (error) {
    console.error('Update author profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/author/my-profile
// @desc    Get current user's author profile
// @access  Private (Authors only)
router.get('/my-profile', auth, async (req, res) => {
  try {
    if (req.user.role !== 'author') {
      return res.status(403).json({ message: 'Only authors can access this' });
    }

    const profile = await AuthorProfile.findOne({ userId: req.user._id }).populate('plans');

    if (!profile) {
      return res.status(404).json({ message: 'Author profile not found' });
    }

    res.json({
      success: true,
      profile
    });
  } catch (error) {
    console.error('Get my profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/author/profile/:userId
// @desc    Get author profile by user ID
// @access  Public
router.get('/profile/:userId', async (req, res) => {
  try {
    const profile = await AuthorProfile.findOne({ userId: req.params.userId }).populate('plans');

    if (!profile) {
      return res.status(404).json({ message: 'Author profile not found' });
    }

    res.json({
      success: true,
      profile
    });
  } catch (error) {
    console.error('Get author profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/author/all
// @desc    Get all active author profiles
// @access  Public
router.get('/all', async (req, res) => {
  try {
    const { search, limit = 20, page = 1 } = req.query;
    
    let query = {};
    
    // Search by name if provided
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const profiles = await AuthorProfile.find(query)
      .populate('plans')
      .sort({ totalSubscribers: -1, createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await AuthorProfile.countDocuments(query);

    res.json({
      success: true,
      profiles,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get all authors error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
