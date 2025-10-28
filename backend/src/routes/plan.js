const express = require('express');
const router = express.Router();
const Plan = require('../models/Plan');
const AuthorProfile = require('../models/AuthorProfile');
const auth = require('../middleware/auth');

// @route   POST /api/plans
// @desc    Create a new subscription plan
// @access  Private (Authors only)
router.post('/', auth, async (req, res) => {
  try {
    const { tierName, description, pricePerMonth, benefits } = req.body;

    // Check if user is an author
    if (req.user.role !== 'author') {
      return res.status(403).json({ message: 'Only authors can create plans' });
    }

    // Validate required fields
    if (!tierName || pricePerMonth === undefined) {
      return res.status(400).json({ message: 'Tier name and price are required' });
    }

    // Check if author profile exists
    const authorProfile = await AuthorProfile.findOne({ userId: req.user._id });
    if (!authorProfile) {
      return res.status(400).json({ 
        message: 'Author profile not found. Please complete your profile first.' 
      });
    }

    // Create plan
    const plan = new Plan({
      authorId: req.user._id,
      tierName,
      description,
      pricePerMonth: parseFloat(pricePerMonth),
      benefits: benefits || []
    });

    await plan.save();

    // Add plan to author's profile
    await AuthorProfile.findOneAndUpdate(
      { userId: req.user._id },
      { $push: { plans: plan._id } }
    );

    res.status(201).json({
      success: true,
      plan
    });
  } catch (error) {
    console.error('Create plan error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/plans/my-plans
// @desc    Get all plans for logged-in author
// @access  Private (Authors only)
router.get('/my-plans', auth, async (req, res) => {
  try {
    if (req.user.role !== 'author') {
      return res.status(403).json({ message: 'Only authors can access this' });
    }

    const plans = await Plan.find({ authorId: req.user._id }).sort({ createdAt: -1 });

    res.json({
      success: true,
      plans
    });
  } catch (error) {
    console.error('Get my plans error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/plans/author/:authorId
// @desc    Get all active plans for a specific author
// @access  Public
router.get('/author/:authorId', async (req, res) => {
  try {
    const plans = await Plan.find({ 
      authorId: req.params.authorId,
      isActive: true 
    }).sort({ pricePerMonth: 1 });

    res.json({
      success: true,
      plans
    });
  } catch (error) {
    console.error('Get author plans error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/plans/:id
// @desc    Get single plan by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const plan = await Plan.findById(req.params.id).populate('authorId', 'email');

    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    res.json({
      success: true,
      plan
    });
  } catch (error) {
    console.error('Get plan error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/plans/:id
// @desc    Update a plan
// @access  Private (Author who owns the plan)
router.put('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'author') {
      return res.status(403).json({ message: 'Only authors can update plans' });
    }

    const plan = await Plan.findById(req.params.id);

    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    // Check ownership
    if (plan.authorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this plan' });
    }

    const { tierName, description, pricePerMonth, benefits, isActive } = req.body;

    // Update fields
    if (tierName) plan.tierName = tierName;
    if (description !== undefined) plan.description = description;
    if (pricePerMonth !== undefined) plan.pricePerMonth = parseFloat(pricePerMonth);
    if (benefits) plan.benefits = benefits;
    if (isActive !== undefined) plan.isActive = isActive;

    await plan.save();

    res.json({
      success: true,
      plan
    });
  } catch (error) {
    console.error('Update plan error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/plans/:id
// @desc    Delete/deactivate a plan
// @access  Private (Author who owns the plan)
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'author') {
      return res.status(403).json({ message: 'Only authors can delete plans' });
    }

    const plan = await Plan.findById(req.params.id);

    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    // Check ownership
    if (plan.authorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this plan' });
    }

    // Soft delete - just mark as inactive
    plan.isActive = false;
    await plan.save();

    res.json({
      success: true,
      message: 'Plan deactivated successfully'
    });
  } catch (error) {
    console.error('Delete plan error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
