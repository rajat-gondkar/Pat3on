const { ethers } = require('ethers');
const path = require('path');
const fs = require('fs');

// Load contract ABIs
const loadContractABI = (contractName) => {
  const artifactPath = path.join(
    __dirname,
    '../../../contracts/artifacts/contracts',
    `${contractName}.sol`,
    `${contractName}.json`
  );
  
  if (!fs.existsSync(artifactPath)) {
    throw new Error(`Contract artifact not found: ${contractName}`);
  }
  
  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
  return artifact.abi;
};

// Load ABIs
const SUBSCRIPTION_MANAGER_ABI = loadContractABI('SubscriptionManager');
const MOCK_USDC_ABI = loadContractABI('MockUSDC');

// Initialize provider
const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);

// Contract instances (read-only)
const subscriptionManagerContract = new ethers.Contract(
  process.env.SUBSCRIPTION_MANAGER_ADDRESS,
  SUBSCRIPTION_MANAGER_ABI,
  provider
);

const mockUSDCContract = new ethers.Contract(
  process.env.MOCK_USDC_ADDRESS,
  MOCK_USDC_ABI,
  provider
);

// Helper function to get contract with signer
const getContractWithSigner = (contractAddress, abi, privateKey) => {
  const wallet = new ethers.Wallet(privateKey, provider);
  return new ethers.Contract(contractAddress, abi, wallet);
};

// ================================
// SUBSCRIPTION MANAGER FUNCTIONS
// ================================

/**
 * Get plan details by ID
 */
const getPlanById = async (planId) => {
  try {
    const plan = await subscriptionManagerContract.getPlan(planId);
    
    return {
      planId: Number(plan.planId),
      creator: plan.creator,
      tierName: plan.tierName,
      description: plan.description,
      pricePerMonth: ethers.formatUnits(plan.pricePerMonth, 6), // USDC has 6 decimals
      isActive: plan.isActive,
      subscriberCount: Number(plan.subscriberCount),
      createdAt: new Date(Number(plan.createdAt) * 1000).toISOString()
    };
  } catch (error) {
    console.error('Error fetching plan:', error);
    throw new Error('Failed to fetch plan from blockchain');
  }
};

/**
 * Get all plans by creator address
 */
const getCreatorPlans = async (creatorAddress) => {
  try {
    const planIds = await subscriptionManagerContract.getCreatorPlans(creatorAddress);
    
    // Fetch details for each plan
    const plans = await Promise.all(
      planIds.map(async (planId) => {
        return await getPlanById(Number(planId));
      })
    );
    
    return plans;
  } catch (error) {
    console.error('Error fetching creator plans:', error);
    throw new Error('Failed to fetch creator plans from blockchain');
  }
};

/**
 * Get all active subscriptions for a user
 */
const getUserSubscriptions = async (userAddress) => {
  try {
    const subscriptionIds = await subscriptionManagerContract.getUserSubscriptions(userAddress);
    
    // Fetch details for each subscription
    const subscriptions = await Promise.all(
      subscriptionIds.map(async (subId) => {
        const sub = await subscriptionManagerContract.getSubscription(subId);
        
        return {
          subscriptionId: Number(sub.subscriptionId),
          planId: Number(sub.planId),
          subscriber: sub.subscriber,
          startDate: new Date(Number(sub.startDate) * 1000).toISOString(),
          nextPaymentDue: new Date(Number(sub.nextPaymentDue) * 1000).toISOString(),
          isActive: sub.isActive,
          totalPaid: ethers.formatUnits(sub.totalPaid, 6)
        };
      })
    );
    
    return subscriptions;
  } catch (error) {
    console.error('Error fetching user subscriptions:', error);
    throw new Error('Failed to fetch user subscriptions from blockchain');
  }
};

/**
 * Check if a user is subscribed to a specific plan
 */
const isUserSubscribed = async (userAddress, planId) => {
  try {
    return await subscriptionManagerContract.isSubscribed(userAddress, planId);
  } catch (error) {
    console.error('Error checking subscription status:', error);
    throw new Error('Failed to check subscription status');
  }
};

/**
 * Get total number of plans
 */
const getTotalPlans = async () => {
  try {
    const count = await subscriptionManagerContract.totalPlans();
    return Number(count);
  } catch (error) {
    console.error('Error fetching total plans:', error);
    throw new Error('Failed to fetch total plans');
  }
};

/**
 * Get total number of subscriptions
 */
const getTotalSubscriptions = async () => {
  try {
    const count = await subscriptionManagerContract.totalSubscriptions();
    return Number(count);
  } catch (error) {
    console.error('Error fetching total subscriptions:', error);
    throw new Error('Failed to fetch total subscriptions');
  }
};

/**
 * Get all active plans (for discovery/browsing)
 */
const getAllActivePlans = async () => {
  try {
    const totalPlans = await getTotalPlans();
    const plans = [];
    
    for (let i = 1; i <= totalPlans; i++) {
      const plan = await getPlanById(i);
      if (plan.isActive) {
        plans.push(plan);
      }
    }
    
    return plans;
  } catch (error) {
    console.error('Error fetching all active plans:', error);
    throw new Error('Failed to fetch active plans');
  }
};

// ================================
// MOCK USDC FUNCTIONS
// ================================

/**
 * Get USDC balance for an address
 */
const getUSDCBalance = async (address) => {
  try {
    const balance = await mockUSDCContract.balanceOf(address);
    return ethers.formatUnits(balance, 6);
  } catch (error) {
    console.error('Error fetching USDC balance:', error);
    throw new Error('Failed to fetch USDC balance');
  }
};

/**
 * Get USDC allowance for subscription manager
 */
const getUSDCAllowance = async (ownerAddress) => {
  try {
    const allowance = await mockUSDCContract.allowance(
      ownerAddress,
      process.env.SUBSCRIPTION_MANAGER_ADDRESS
    );
    return ethers.formatUnits(allowance, 6);
  } catch (error) {
    console.error('Error fetching USDC allowance:', error);
    throw new Error('Failed to fetch USDC allowance');
  }
};

// ================================
// WRITE OPERATIONS (Admin/Backend)
// ================================
// These functions require a private key and should be used carefully
// Only for backend operations like processing payments

/**
 * Process a monthly payment for a subscription (backend cron job)
 * Requires backend private key with ETH for gas
 */
const processMonthlyPayment = async (subscriptionId, backendPrivateKey) => {
  try {
    const contractWithSigner = getContractWithSigner(
      process.env.SUBSCRIPTION_MANAGER_ADDRESS,
      SUBSCRIPTION_MANAGER_ABI,
      backendPrivateKey
    );
    
    const tx = await contractWithSigner.processMonthlyPayment(subscriptionId);
    const receipt = await tx.wait();
    
    return {
      success: true,
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber
    };
  } catch (error) {
    console.error('Error processing monthly payment:', error);
    throw new Error('Failed to process monthly payment');
  }
};

// ================================
// EVENT LISTENERS
// ================================

/**
 * Listen for PlanCreated events
 */
const listenForPlanCreated = (callback) => {
  subscriptionManagerContract.on('PlanCreated', (planId, creator, tierName, pricePerMonth, event) => {
    callback({
      planId: Number(planId),
      creator,
      tierName,
      pricePerMonth: ethers.formatUnits(pricePerMonth, 6),
      transactionHash: event.log.transactionHash,
      blockNumber: event.log.blockNumber
    });
  });
};

/**
 * Listen for SubscriptionCreated events
 */
const listenForSubscriptionCreated = (callback) => {
  subscriptionManagerContract.on('SubscriptionCreated', 
    (subscriptionId, planId, subscriber, event) => {
      callback({
        subscriptionId: Number(subscriptionId),
        planId: Number(planId),
        subscriber,
        transactionHash: event.log.transactionHash,
        blockNumber: event.log.blockNumber
      });
    }
  );
};

/**
 * Listen for SubscriptionCancelled events
 */
const listenForSubscriptionCancelled = (callback) => {
  subscriptionManagerContract.on('SubscriptionCancelled', 
    (subscriptionId, event) => {
      callback({
        subscriptionId: Number(subscriptionId),
        transactionHash: event.log.transactionHash,
        blockNumber: event.log.blockNumber
      });
    }
  );
};

/**
 * Listen for PaymentProcessed events
 */
const listenForPaymentProcessed = (callback) => {
  subscriptionManagerContract.on('PaymentProcessed', 
    (subscriptionId, amount, event) => {
      callback({
        subscriptionId: Number(subscriptionId),
        amount: ethers.formatUnits(amount, 6),
        transactionHash: event.log.transactionHash,
        blockNumber: event.log.blockNumber
      });
    }
  );
};

// ================================
// EXPORTS
// ================================

module.exports = {
  // Contract instances
  provider,
  subscriptionManagerContract,
  mockUSDCContract,
  
  // ABIs (for frontend)
  SUBSCRIPTION_MANAGER_ABI,
  MOCK_USDC_ABI,
  
  // Read functions
  getPlanById,
  getCreatorPlans,
  getUserSubscriptions,
  isUserSubscribed,
  getTotalPlans,
  getTotalSubscriptions,
  getAllActivePlans,
  getUSDCBalance,
  getUSDCAllowance,
  
  // Write functions (backend only)
  processMonthlyPayment,
  
  // Event listeners
  listenForPlanCreated,
  listenForSubscriptionCreated,
  listenForSubscriptionCancelled,
  listenForPaymentProcessed,
  
  // Helper
  getContractWithSigner
};
