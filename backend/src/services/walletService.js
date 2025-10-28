const { ethers } = require('ethers');
const crypto = require('crypto');

// Initialize provider
const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);

// Master wallet for funding new wallets
let masterWallet = null;
if (process.env.MASTER_WALLET_PRIVATE_KEY) {
  masterWallet = new ethers.Wallet(process.env.MASTER_WALLET_PRIVATE_KEY, provider);
}

/**
 * Encryption helper for storing private keys
 */
const ENCRYPTION_KEY = process.env.WALLET_ENCRYPTION_KEY || 
  crypto.randomBytes(32).toString('hex'); // Should be in .env in production!

const ENCRYPTION_ALGORITHM = 'aes-256-gcm';

/**
 * Encrypt private key before storing in database
 */
function encryptPrivateKey(privateKey) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    ENCRYPTION_ALGORITHM,
    Buffer.from(ENCRYPTION_KEY, 'hex'),
    iv
  );
  
  let encrypted = cipher.update(privateKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  };
}

/**
 * Decrypt private key when needed for transactions
 */
function decryptPrivateKey(encryptedData) {
  const decipher = crypto.createDecipheriv(
    ENCRYPTION_ALGORITHM,
    Buffer.from(ENCRYPTION_KEY, 'hex'),
    Buffer.from(encryptedData.iv, 'hex')
  );
  
  decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
  
  let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * Generate a new custodial wallet for a user
 * @returns {Object} wallet details (address, encrypted private key, plaintext private key)
 */
async function generateCustodialWallet() {
  // Generate new random wallet
  const wallet = ethers.Wallet.createRandom();
  
  // Encrypt the private key
  const encryptedKey = encryptPrivateKey(wallet.privateKey);
  
  return {
    address: wallet.address,
    encryptedPrivateKey: encryptedKey,
    privateKey: wallet.privateKey, // ⚠️ Return plaintext for one-time display during registration
    mnemonic: wallet.mnemonic ? wallet.mnemonic.phrase : null // Optional: store for recovery
  };
}

/**
 * Fund a newly created wallet with ETH for gas fees
 * @param {string} recipientAddress - Address to fund
 * @param {string} amount - Amount in ETH (default: 0.001)
 * @returns {Object} transaction details
 */
async function fundNewWallet(recipientAddress, amount = '0.001') {
  if (!masterWallet) {
    throw new Error('Master wallet not configured. Set MASTER_WALLET_PRIVATE_KEY in .env');
  }
  
  try {
    console.log(`💰 Funding wallet ${recipientAddress} with ${amount} ETH...`);
    
    // Send ETH from master wallet to new wallet
    const tx = await masterWallet.sendTransaction({
      to: recipientAddress,
      value: ethers.parseEther(amount)
    });
    
    console.log(`📤 Transaction sent: ${tx.hash}`);
    
    // Wait for confirmation
    const receipt = await tx.wait();
    
    console.log(`✅ Wallet funded! Block: ${receipt.blockNumber}`);
    
    return {
      success: true,
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber,
      amount,
      recipient: recipientAddress
    };
  } catch (error) {
    console.error('Error funding wallet:', error);
    throw new Error(`Failed to fund wallet: ${error.message}`);
  }
}

/**
 * Get ETH balance of a wallet
 * @param {string} address - Wallet address
 * @returns {string} Balance in ETH
 */
async function getETHBalance(address) {
  const balance = await provider.getBalance(address);
  return ethers.formatEther(balance);
}

/**
 * Get MockUSDC balance of a wallet
 * @param {string} address - Wallet address
 * @returns {string} Balance in USDC (formatted)
 */
async function getMockUSDCBalance(address) {
  const mockUSDCABI = [
    "function balanceOf(address account) view returns (uint256)",
    "function decimals() view returns (uint8)"
  ];
  
  const mockUSDC = new ethers.Contract(
    process.env.MOCK_USDC_ADDRESS,
    mockUSDCABI,
    provider
  );
  
  const balance = await mockUSDC.balanceOf(address);
  return ethers.formatUnits(balance, 6); // USDC has 6 decimals
}

/**
 * Get a wallet instance from encrypted private key
 * @param {Object} encryptedData - Encrypted private key data
 * @returns {ethers.Wallet} Wallet instance
 */
function getWalletFromEncrypted(encryptedData) {
  const privateKey = decryptPrivateKey(encryptedData);
  return new ethers.Wallet(privateKey, provider);
}

/**
 * Transfer MockUSDC from user's custodial wallet
 * @param {Object} encryptedPrivateKey - User's encrypted private key
 * @param {string} recipient - Recipient address
 * @param {string} amount - Amount in USDC
 * @returns {Object} Transaction details
 */
async function transferMockUSDC(encryptedPrivateKey, recipient, amount) {
  try {
    const wallet = getWalletFromEncrypted(encryptedPrivateKey);
    
    const mockUSDCABI = [
      "function transfer(address to, uint256 amount) returns (bool)",
      "function balanceOf(address account) view returns (uint256)"
    ];
    
    const mockUSDC = new ethers.Contract(
      process.env.MOCK_USDC_ADDRESS,
      mockUSDCABI,
      wallet
    );
    
    // Convert amount to proper decimals (6 for USDC)
    const amountInWei = ethers.parseUnits(amount.toString(), 6);
    
    // Check balance
    const balance = await mockUSDC.balanceOf(wallet.address);
    if (balance < amountInWei) {
      throw new Error('Insufficient MockUSDC balance');
    }
    
    // Send transaction
    const tx = await mockUSDC.transfer(recipient, amountInWei);
    const receipt = await tx.wait();
    
    return {
      success: true,
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber,
      amount,
      recipient
    };
  } catch (error) {
    console.error('Error transferring MockUSDC:', error);
    throw new Error(`Transfer failed: ${error.message}`);
  }
}

/**
 * Approve MockUSDC spending for Superfluid contract
 * @param {Object} encryptedPrivateKey - User's encrypted private key
 * @param {string} spender - Spender address (Superfluid contract)
 * @param {string} amount - Amount to approve
 * @returns {Object} Transaction details
 */
async function approveMockUSDC(encryptedPrivateKey, spender, amount) {
  try {
    const wallet = getWalletFromEncrypted(encryptedPrivateKey);
    
    const mockUSDCABI = [
      "function approve(address spender, uint256 amount) returns (bool)"
    ];
    
    const mockUSDC = new ethers.Contract(
      process.env.MOCK_USDC_ADDRESS,
      mockUSDCABI,
      wallet
    );
    
    const amountInWei = ethers.parseUnits(amount.toString(), 6);
    
    const tx = await mockUSDC.approve(spender, amountInWei);
    const receipt = await tx.wait();
    
    return {
      success: true,
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber
    };
  } catch (error) {
    console.error('Error approving MockUSDC:', error);
    throw new Error(`Approval failed: ${error.message}`);
  }
}

/**
 * Create Superfluid stream for subscription
 * @param {Object} encryptedPrivateKey - User's encrypted private key
 * @param {string} recipient - Creator's address
 * @param {string} flowRate - Flow rate (tokens per second)
 * @returns {Object} Transaction details
 */
async function createSuperfluidStream(encryptedPrivateKey, recipient, flowRate) {
  try {
    const wallet = getWalletFromEncrypted(encryptedPrivateKey);
    
    // Load Superfluid Super Token contract ABI
    const superTokenABI = [
      "function createFlow(address receiver, int96 flowRate, bytes ctx) returns (bytes)",
      "function createFlow(address receiver, int96 flowRate) returns (bool)",
      "function deleteFlow(address sender, address receiver, bytes ctx) returns (bytes)",
      "function deleteFlow(address sender, address receiver) returns (bool)"
    ];
    
    const superToken = new ethers.Contract(
      process.env.FUSDC_SUPER_TOKEN,
      superTokenABI,
      wallet
    );
    
    // Create the stream
    const tx = await superToken.createFlow(recipient, flowRate);
    const receipt = await tx.wait();
    
    return {
      success: true,
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber,
      flowRate,
      recipient
    };
  } catch (error) {
    console.error('Error creating Superfluid stream:', error);
    throw new Error(`Stream creation failed: ${error.message}`);
  }
}

/**
 * Delete Superfluid stream (cancel subscription)
 * @param {Object} encryptedPrivateKey - User's encrypted private key
 * @param {string} recipient - Creator's address
 * @returns {Object} Transaction details
 */
async function deleteSuperfluidStream(encryptedPrivateKey, recipient) {
  try {
    const wallet = getWalletFromEncrypted(encryptedPrivateKey);
    
    const superTokenABI = [
      "function deleteFlow(address sender, address receiver) returns (bool)"
    ];
    
    const superToken = new ethers.Contract(
      process.env.FUSDC_SUPER_TOKEN,
      superTokenABI,
      wallet
    );
    
    const tx = await superToken.deleteFlow(wallet.address, recipient);
    const receipt = await tx.wait();
    
    return {
      success: true,
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber,
      recipient
    };
  } catch (error) {
    console.error('Error deleting Superfluid stream:', error);
    throw new Error(`Stream deletion failed: ${error.message}`);
  }
}

/**
 * Get master wallet balance (for monitoring)
 */
async function getMasterWalletBalance() {
  if (!masterWallet) {
    return null;
  }
  
  const balance = await provider.getBalance(masterWallet.address);
  return {
    address: masterWallet.address,
    balance: ethers.formatEther(balance),
    balanceWei: balance.toString()
  };
}

module.exports = {
  generateCustodialWallet,
  fundNewWallet,
  getETHBalance,
  getMockUSDCBalance,
  getWalletFromEncrypted,
  transferMockUSDC,
  approveMockUSDC,
  createSuperfluidStream,
  deleteSuperfluidStream,
  getMasterWalletBalance,
  encryptPrivateKey,
  decryptPrivateKey
};
