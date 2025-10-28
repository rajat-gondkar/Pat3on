const express = require('express');
const router = express.Router();
const { ethers } = require('ethers');
const Subscription = require('../models/Subscription');
const Plan = require('../models/Plan');
const User = require('../models/User');
const AuthorProfile = require('../models/AuthorProfile');
const auth = require('../middleware/auth');
const crypto = require('crypto');

// Encryption/Decryption setup
const ENCRYPTION_KEY = Buffer.from(process.env.WALLET_ENCRYPTION_KEY, 'hex');
const ALGORITHM = 'aes-256-gcm';

// Mock USDC Contract ABI (ERC20 transfer)
const ERC20_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)'
];

// Decrypt private key
function decryptPrivateKey(encryptedData) {
  // Handle both string format (old) and object format (new)
  let iv, authTag, encryptedText;
  
  if (typeof encryptedData === 'string') {
    // Old format: "iv:authTag:encrypted"
    const parts = encryptedData.split(':');
    iv = Buffer.from(parts[0], 'hex');
    authTag = Buffer.from(parts[1], 'hex');
    encryptedText = Buffer.from(parts[2], 'hex');
  } else if (typeof encryptedData === 'object') {
    // New format: { encrypted, iv, authTag }
    iv = Buffer.from(encryptedData.iv, 'hex');
    authTag = Buffer.from(encryptedData.authTag, 'hex');
    encryptedText = Buffer.from(encryptedData.encrypted, 'hex');
  } else {
    throw new Error('Invalid encrypted data format');
  }

  const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedText, null, 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

// @route   POST /api/subscriptions/subscribe
// @desc    Subscribe to an author's plan (transfer mUSDC tokens)
// @access  Private
router.post('/subscribe', auth, async (req, res) => {
  try {
    const { planId } = req.body;

    if (!planId) {
      return res.status(400).json({ message: 'Plan ID is required' });
    }

    // Get plan details
    const plan = await Plan.findById(planId).populate('authorId');
    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    if (!plan.isActive) {
      return res.status(400).json({ message: 'This plan is not currently active' });
    }

    // Check if already subscribed
    const existingSubscription = await Subscription.findOne({
      subscriberId: req.user._id,
      planId: planId,
      status: 'active'
    });

    if (existingSubscription) {
      return res.status(400).json({ message: 'You are already subscribed to this plan' });
    }

    // Get subscriber and author wallet info
    const subscriber = await User.findById(req.user._id);
    const author = await User.findById(plan.authorId);

    if (!subscriber.custodialWallet || !author.custodialWallet) {
      return res.status(400).json({ message: 'Wallet information missing' });
    }

    const subscriberAddress = subscriber.custodialWallet.address;
    const authorAddress = author.custodialWallet.address;

    // Decrypt subscriber's private key
    const subscriberPrivateKey = decryptPrivateKey(subscriber.custodialWallet.encryptedPrivateKey);

    // Setup blockchain connection
    const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
    const subscriberWallet = new ethers.Wallet(subscriberPrivateKey, provider);

    // Mock USDC contract
    const usdcContract = new ethers.Contract(
      process.env.MOCK_USDC_ADDRESS,
      ERC20_ABI,
      subscriberWallet
    );

    // Get amount (plan price in USDC - need to handle decimals)
    const decimals = await usdcContract.decimals();
    const amount = ethers.parseUnits(plan.pricePerMonth.toString(), decimals);

    // Check balance
    const balance = await usdcContract.balanceOf(subscriberAddress);
    if (balance < amount) {
      return res.status(400).json({ 
        message: 'Insufficient mUSDC balance',
        required: ethers.formatUnits(amount, decimals),
        current: ethers.formatUnits(balance, decimals)
      });
    }

    // Execute transfer
    console.log(`Transferring ${plan.pricePerMonth} mUSDC from ${subscriberAddress} to ${authorAddress}`);
    const tx = await usdcContract.transfer(authorAddress, amount);
    
    // Wait for confirmation
    const receipt = await tx.wait();
    console.log('Transfer successful:', receipt.hash);

    // Calculate subscription period (1 month from now)
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);

    // Create subscription record
    const subscription = new Subscription({
      subscriberId: req.user._id,
      authorId: plan.authorId,
      planId: plan._id,
      startDate,
      endDate,
      status: 'active',
      transactionHash: receipt.hash
    });

    await subscription.save();

    // Update plan subscriber count
    await Plan.findByIdAndUpdate(planId, { 
      $inc: { subscriberCount: 1 } 
    });

    // Update author profile stats
    await AuthorProfile.findOneAndUpdate(
      { userId: plan.authorId },
      { 
        $inc: { 
          totalSubscribers: 1,
          'stats.totalEarnings': plan.pricePerMonth 
        } 
      }
    );

    res.json({
      success: true,
      message: 'Subscription successful!',
      subscription,
      transactionHash: receipt.hash
    });

  } catch (error) {
    console.error('Subscribe error:', error);
    res.status(500).json({ 
      message: 'Subscription failed', 
      error: error.message 
    });
  }
});

// @route   POST /api/subscriptions/cancel/:id
// @desc    Cancel a subscription
// @access  Private
router.post('/cancel/:id', auth, async (req, res) => {
  try {
    const subscription = await Subscription.findById(req.params.id);

    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    // Check ownership
    if (subscription.subscriberId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to cancel this subscription' });
    }

    if (subscription.status !== 'active') {
      return res.status(400).json({ message: 'Subscription is not active' });
    }

    // Update subscription status
    subscription.status = 'cancelled';
    subscription.endDate = new Date();
    await subscription.save();

    // Update plan subscriber count
    await Plan.findByIdAndUpdate(subscription.planId, { 
      $inc: { subscriberCount: -1 } 
    });

    // Update author profile stats
    await AuthorProfile.findOneAndUpdate(
      { userId: subscription.authorId },
      { $inc: { totalSubscribers: -1 } }
    );

    res.json({
      success: true,
      message: 'Subscription cancelled successfully',
      subscription
    });

  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/subscriptions/my-subscriptions
// @desc    Get all subscriptions for logged-in user
// @access  Private
router.get('/my-subscriptions', auth, async (req, res) => {
  try {
    const subscriptions = await Subscription.find({ subscriberId: req.user._id })
      .populate('planId')
      .populate('authorId', 'email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      subscriptions
    });
  } catch (error) {
    console.error('Get my subscriptions error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/subscriptions/author/subscribers
// @desc    Get all subscribers for logged-in author
// @access  Private (Authors only)
router.get('/author/subscribers', auth, async (req, res) => {
  try {
    if (req.user.role !== 'author') {
      return res.status(403).json({ message: 'Only authors can access this' });
    }

    const subscriptions = await Subscription.find({ 
      authorId: req.user._id,
      status: 'active'
    })
      .populate('subscriberId', 'email')
      .populate('planId')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      subscriptions
    });
  } catch (error) {
    console.error('Get subscribers error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
