const { ethers } = require('ethers');
const Subscription = require('../models/Subscription');
const Plan = require('../models/Plan');
const User = require('../models/User');
const Notification = require('../models/Notification');
const crypto = require('crypto');

// Encryption setup
const ENCRYPTION_KEY = Buffer.from(process.env.WALLET_ENCRYPTION_KEY, 'hex');
const ALGORITHM = 'aes-256-gcm';

// Mock USDC Contract ABI
const ERC20_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)'
];

// Decrypt private key
function decryptPrivateKey(encryptedData) {
  let iv, authTag, encryptedText;
  
  if (typeof encryptedData === 'string') {
    const parts = encryptedData.split(':');
    iv = Buffer.from(parts[0], 'hex');
    authTag = Buffer.from(parts[1], 'hex');
    encryptedText = Buffer.from(parts[2], 'hex');
  } else if (typeof encryptedData === 'object') {
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

// Create notification helper
async function createNotification(userId, type, title, message, priority = 'medium', relatedData = {}) {
  try {
    const notification = new Notification({
      userId,
      type,
      title,
      message,
      priority,
      relatedSubscription: relatedData.subscriptionId || null,
      relatedPlan: relatedData.planId || null
    });
    await notification.save();
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
  }
}

// Process a single subscription renewal
async function processSubscriptionRenewal(subscription) {
  try {
    console.log(`\n🔄 Processing renewal for subscription ${subscription._id}`);

    // Get plan and user details
    const plan = await Plan.findById(subscription.planId);
    const subscriber = await User.findById(subscription.subscriberId);
    const author = await User.findById(subscription.authorId);

    if (!plan || !subscriber || !author) {
      console.error('❌ Missing plan, subscriber, or author data');
      return { success: false, reason: 'missing_data' };
    }

    if (!subscriber.custodialWallet || !author.custodialWallet) {
      console.error('❌ Missing wallet information');
      return { success: false, reason: 'missing_wallet' };
    }

    const subscriberAddress = subscriber.custodialWallet.address;
    const authorAddress = author.custodialWallet.address;

    // Setup blockchain connection
    const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
    const subscriberPrivateKey = decryptPrivateKey(subscriber.custodialWallet.encryptedPrivateKey);
    const subscriberWallet = new ethers.Wallet(subscriberPrivateKey, provider);

    // Mock USDC contract
    const usdcContract = new ethers.Contract(
      process.env.MOCK_USDC_ADDRESS,
      ERC20_ABI,
      subscriberWallet
    );

    // Get amount and check balance
    const decimals = await usdcContract.decimals();
    const amount = ethers.parseUnits(plan.pricePerMonth.toString(), decimals);
    const balance = await usdcContract.balanceOf(subscriberAddress);

    if (balance < amount) {
      console.log(`❌ Insufficient balance: ${ethers.formatUnits(balance, decimals)} < ${plan.pricePerMonth}`);
      
      // Create notification for insufficient balance
      await createNotification(
        subscriber._id,
        'subscription_renewal_failed',
        '⚠️ Subscription Renewal Failed',
        `Your subscription to ${plan.tierName} could not be renewed due to insufficient mUSDC balance. You need ${plan.pricePerMonth} mUSDC but only have ${ethers.formatUnits(balance, decimals)} mUSDC. Please add funds to continue your subscription.`,
        'high',
        { subscriptionId: subscription._id, planId: plan._id }
      );

      // Update subscription
      subscription.lastRenewalAttempt = new Date();
      subscription.renewalFailureCount += 1;
      
      // If 3 failures, cancel subscription
      if (subscription.renewalFailureCount >= 3) {
        subscription.status = 'expired';
        subscription.autoRenew = false;
        await subscription.save();
        
        await createNotification(
          subscriber._id,
          'subscription_renewal_failed',
          '❌ Subscription Expired',
          `Your subscription to ${plan.tierName} has been cancelled after 3 failed renewal attempts due to insufficient balance. Please resubscribe manually when ready.`,
          'high',
          { subscriptionId: subscription._id, planId: plan._id }
        );
        
        return { success: false, reason: 'insufficient_balance_cancelled' };
      }
      
      await subscription.save();
      return { success: false, reason: 'insufficient_balance' };
    }

    // Execute transfer
    console.log(`💸 Transferring ${plan.pricePerMonth} mUSDC from ${subscriberAddress} to ${authorAddress}`);
    const tx = await usdcContract.transfer(authorAddress, amount);
    const receipt = await tx.wait();
    console.log(`✅ Transfer successful: ${receipt.hash}`);

    // Update subscription
    subscription.startDate = subscription.endDate;
    subscription.endDate = new Date(subscription.endDate.getTime() + 30 * 24 * 60 * 60 * 1000); // Add 30 days
    subscription.transactionHash = receipt.hash;
    subscription.lastRenewalAttempt = new Date();
    subscription.renewalFailureCount = 0; // Reset failure count on success
    await subscription.save();

    // Create success notification
    await createNotification(
      subscriber._id,
      'subscription_renewed',
      '✅ Subscription Renewed',
      `Your subscription to ${plan.tierName} has been successfully renewed for ${plan.pricePerMonth} mUSDC. Next renewal: ${subscription.endDate.toLocaleDateString()}`,
      'low',
      { subscriptionId: subscription._id, planId: plan._id }
    );

    console.log(`✅ Subscription renewed successfully until ${subscription.endDate}`);
    return { success: true, transactionHash: receipt.hash };

  } catch (error) {
    console.error(`❌ Error processing renewal for subscription ${subscription._id}:`, error);
    
    // Create error notification
    try {
      await createNotification(
        subscription.subscriberId,
        'subscription_renewal_failed',
        '⚠️ Subscription Renewal Error',
        `There was an error renewing your subscription. Please contact support or renew manually. Error: ${error.message}`,
        'high',
        { subscriptionId: subscription._id }
      );
      
      subscription.lastRenewalAttempt = new Date();
      subscription.renewalFailureCount += 1;
      await subscription.save();
    } catch (notifError) {
      console.error('Error creating notification:', notifError);
    }
    
    return { success: false, reason: 'error', error: error.message };
  }
}

// Main scheduler function - checks for subscriptions to renew
async function checkAndRenewSubscriptions() {
  try {
    const now = new Date();
    console.log(`\n⏰ [${now.toISOString()}] Checking for subscriptions to renew...`);

    // Find subscriptions that:
    // 1. Are active
    // 2. Have autoRenew enabled
    // 3. endDate is within the next 5 minutes (to handle timing issues)
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
    
    const subscriptionsToRenew = await Subscription.find({
      status: 'active',
      autoRenew: true,
      endDate: { 
        $gte: now,
        $lte: fiveMinutesFromNow
      }
    }).populate('planId');

    if (subscriptionsToRenew.length === 0) {
      console.log('✓ No subscriptions need renewal at this time');
      return { checked: true, renewalsProcessed: 0 };
    }

    console.log(`📋 Found ${subscriptionsToRenew.length} subscription(s) to renew`);

    const results = {
      success: 0,
      failed: 0,
      errors: []
    };

    // Process each subscription
    for (const subscription of subscriptionsToRenew) {
      const result = await processSubscriptionRenewal(subscription);
      if (result.success) {
        results.success++;
      } else {
        results.failed++;
        results.errors.push({
          subscriptionId: subscription._id,
          reason: result.reason,
          error: result.error
        });
      }
    }

    console.log(`\n📊 Renewal Summary: ${results.success} successful, ${results.failed} failed`);
    return {
      checked: true,
      renewalsProcessed: subscriptionsToRenew.length,
      results
    };

  } catch (error) {
    console.error('❌ Error in renewal scheduler:', error);
    return { checked: false, error: error.message };
  }
}

// Start the scheduler (runs every minute)
function startRenewalScheduler() {
  console.log('\n🚀 Starting subscription renewal scheduler...');
  console.log('⏰ Checking for renewals every 60 seconds');
  
  // Run immediately on startup
  checkAndRenewSubscriptions();
  
  // Then run every 60 seconds
  const interval = setInterval(checkAndRenewSubscriptions, 60 * 1000);
  
  return interval;
}

module.exports = {
  startRenewalScheduler,
  checkAndRenewSubscriptions,
  processSubscriptionRenewal
};
