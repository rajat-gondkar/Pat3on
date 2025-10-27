const User = require('../models/User');
const walletService = require('../services/walletService');

/**
 * @desc    Create custodial wallet for user
 * @route   POST /api/custodial-wallet/create
 * @access  Private
 */
const createCustodialWallet = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Check if user already has a custodial wallet
    if (user.hasCustodialWallet) {
      return res.status(400).json({
        success: false,
        message: 'User already has a custodial wallet',
        wallet: {
          address: user.custodialWallet.address,
          createdAt: user.custodialWallet.createdAt
        }
      });
    }
    
    // Generate new custodial wallet
    console.log('🔐 Generating custodial wallet for user:', user.email);
    const walletData = await walletService.generateCustodialWallet();
    
    // Fund the wallet with 0.001 ETH for gas
    console.log('💰 Funding new wallet with ETH...');
    let fundingResult;
    try {
      fundingResult = await walletService.fundNewWallet(walletData.address);
    } catch (fundingError) {
      console.error('Warning: Failed to fund wallet:', fundingError.message);
      // Continue anyway - user can be funded later
    }
    
    // Update user with custodial wallet info
    user.custodialWallet = {
      address: walletData.address,
      encryptedPrivateKey: walletData.encryptedPrivateKey,
      createdAt: new Date(),
      fundedAt: fundingResult ? new Date() : null,
      initialFundingTxHash: fundingResult ? fundingResult.transactionHash : null
    };
    user.hasCustodialWallet = true;
    
    await user.save();
    
    console.log('✅ Custodial wallet created:', walletData.address);
    
    res.status(201).json({
      success: true,
      message: 'Custodial wallet created successfully',
      wallet: {
        address: walletData.address,
        funded: !!fundingResult,
        fundingTxHash: fundingResult?.transactionHash,
        createdAt: user.custodialWallet.createdAt
      }
    });
  } catch (error) {
    console.error('Error creating custodial wallet:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create custodial wallet',
      error: error.message
    });
  }
};

/**
 * @desc    Get custodial wallet info and balances
 * @route   GET /api/custodial-wallet/info
 * @access  Private
 */
const getCustodialWalletInfo = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    if (!user.hasCustodialWallet) {
      return res.status(404).json({
        success: false,
        message: 'User does not have a custodial wallet',
        hasWallet: false
      });
    }
    
    // Get balances
    const ethBalance = await walletService.getETHBalance(user.custodialWallet.address);
    const mockUSDCBalance = await walletService.getMockUSDCBalance(user.custodialWallet.address);
    
    res.json({
      success: true,
      wallet: {
        address: user.custodialWallet.address,
        ethBalance,
        mockUSDCBalance,
        createdAt: user.custodialWallet.createdAt,
        fundedAt: user.custodialWallet.fundedAt,
        initialFundingTxHash: user.custodialWallet.initialFundingTxHash
      }
    });
  } catch (error) {
    console.error('Error getting custodial wallet info:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get wallet info',
      error: error.message
    });
  }
};

/**
 * @desc    Get deposit address for MockUSDC
 * @route   GET /api/custodial-wallet/deposit-address
 * @access  Private
 */
const getDepositAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    if (!user.hasCustodialWallet) {
      return res.status(404).json({
        success: false,
        message: 'Please create a custodial wallet first',
        hasWallet: false
      });
    }
    
    res.json({
      success: true,
      depositAddress: user.custodialWallet.address,
      tokenContract: process.env.MOCK_USDC_ADDRESS,
      network: 'Sepolia Testnet',
      instructions: {
        step1: 'Send MockUSDC to the deposit address',
        step2: 'Wait for transaction confirmation',
        step3: 'Your balance will be updated automatically',
        note: 'You can also use our faucet to get test MockUSDC'
      }
    });
  } catch (error) {
    console.error('Error getting deposit address:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get deposit address',
      error: error.message
    });
  }
};

/**
 * @desc    Fund user's custodial wallet with ETH (admin/backend only)
 * @route   POST /api/custodial-wallet/fund-eth
 * @access  Private + Admin
 */
const fundCustodialWalletETH = async (req, res) => {
  try {
    const { userId, amount } = req.body;
    
    const user = await User.findById(userId || req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    if (!user.hasCustodialWallet) {
      return res.status(404).json({
        success: false,
        message: 'User does not have a custodial wallet'
      });
    }
    
    // Fund the wallet
    const result = await walletService.fundNewWallet(
      user.custodialWallet.address,
      amount || '0.001'
    );
    
    res.json({
      success: true,
      message: 'Wallet funded successfully',
      transaction: result
    });
  } catch (error) {
    console.error('Error funding wallet:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fund wallet',
      error: error.message
    });
  }
};

/**
 * @desc    Get master wallet balance (monitoring)
 * @route   GET /api/custodial-wallet/master-balance
 * @access  Private + Admin
 */
const getMasterWalletBalance = async (req, res) => {
  try {
    const balance = await walletService.getMasterWalletBalance();
    
    if (!balance) {
      return res.status(400).json({
        success: false,
        message: 'Master wallet not configured'
      });
    }
    
    res.json({
      success: true,
      masterWallet: balance,
      warning: balance.balance < 0.1 ? 'Low balance! Please top up.' : null
    });
  } catch (error) {
    console.error('Error getting master wallet balance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get master wallet balance',
      error: error.message
    });
  }
};

module.exports = {
  createCustodialWallet,
  getCustodialWalletInfo,
  getDepositAddress,
  fundCustodialWalletETH,
  getMasterWalletBalance
};
