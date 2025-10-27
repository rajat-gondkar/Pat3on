const User = require('../models/User');
const { validationResult } = require('express-validator');
const { ethers } = require('ethers');

/**
 * @route   POST /api/wallet/link
 * @desc    Link wallet address to user account
 * @access  Private
 */
exports.linkWallet = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { walletAddress } = req.body;

    // Validate Ethereum address format
    if (!ethers.isAddress(walletAddress)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Ethereum address format'
      });
    }

    // Check if wallet is already linked to another account
    const existingWallet = await User.findOne({ 
      walletAddress: walletAddress.toLowerCase(),
      _id: { $ne: req.userId } // Exclude current user
    });

    if (existingWallet) {
      return res.status(400).json({
        success: false,
        message: 'This wallet address is already linked to another account'
      });
    }

    // Update user with wallet address
    const user = await User.findByIdAndUpdate(
      req.userId,
      {
        walletAddress: walletAddress.toLowerCase(),
        isWalletLinked: true
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Wallet linked successfully',
      data: {
        walletAddress: user.walletAddress,
        isWalletLinked: user.isWalletLinked
      }
    });

  } catch (error) {
    console.error('Link wallet error:', error);
    res.status(500).json({
      success: false,
      message: 'Error linking wallet',
      error: error.message
    });
  }
};

/**
 * @route   GET /api/wallet/info
 * @desc    Get wallet info for logged in user
 * @access  Private
 */
exports.getWalletInfo = async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        walletAddress: user.walletAddress,
        isWalletLinked: user.isWalletLinked
      }
    });

  } catch (error) {
    console.error('Get wallet info error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching wallet info',
      error: error.message
    });
  }
};

/**
 * @route   DELETE /api/wallet/unlink
 * @desc    Unlink wallet address from user account
 * @access  Private
 */
exports.unlinkWallet = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.userId,
      {
        walletAddress: null,
        isWalletLinked: false
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Wallet unlinked successfully',
      data: {
        walletAddress: user.walletAddress,
        isWalletLinked: user.isWalletLinked
      }
    });

  } catch (error) {
    console.error('Unlink wallet error:', error);
    res.status(500).json({
      success: false,
      message: 'Error unlinking wallet',
      error: error.message
    });
  }
};
