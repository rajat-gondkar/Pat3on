const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const walletService = require('../services/walletService');

/**
 * Generate JWT Token
 */
const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user (user or author)
 * @access  Public
 */
exports.register = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Validate role
    if (!['user', 'author'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be either "user" or "author"'
      });
    }

    // Generate custodial wallet BEFORE creating user
    console.log('🔐 Generating custodial wallet...');
    const walletData = await walletService.generateCustodialWallet();
    console.log(`✅ Wallet generated: ${walletData.address}`);

    // Create new user with wallet info
    const user = new User({
      email,
      password, // Will be hashed by the User model pre-save hook
      role,
      custodialWallet: {
        address: walletData.address,
        encryptedPrivateKey: walletData.encryptedPrivateKey,
        createdAt: new Date()
      },
      hasCustodialWallet: true
    });

    await user.save();
    console.log(`✅ User created: ${user._id}`);

    // Fund wallet with 0.001 ETH for gas fees
    console.log('💰 Funding wallet with ETH...');
    try {
      const fundingTx = await walletService.fundNewWallet(walletData.address);
      user.custodialWallet.fundedAt = new Date();
      user.custodialWallet.initialFundingTxHash = fundingTx.hash;
      await user.save();
      console.log(`✅ Wallet funded: ${fundingTx.hash}`);
    } catch (fundingError) {
      console.error('⚠️  Wallet funding failed:', fundingError.message);
      // Continue even if funding fails - user can still be created
    }

    // Generate JWT token
    const token = generateToken(user._id, user.role);

    res.status(201).json({
      success: true,
      message: 'Registration successful - SAVE YOUR PRIVATE KEY NOW',
      data: {
        token,
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          walletAddress: walletData.address,
          hasCustodialWallet: true
        },
        // ⚠️ CRITICAL: Send plaintext private key ONCE during registration
        wallet: {
          privateKey: walletData.privateKey,
          mnemonic: walletData.mnemonic,
          address: walletData.address
        },
        // Security warnings for frontend to display
        warning: {
          critical: '🔐 SAVE THIS PRIVATE KEY NOW',
          notice: 'This will NEVER be shown again',
          instructions: [
            'Write it down on paper or save it securely',
            'Store it in a safe place',
            'Never share it with anyone',
            'We cannot recover it if you lose it',
            'You need this to recover your wallet'
          ]
        }
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering user',
      error: error.message
    });
  }
};

/**
 * @route   POST /api/auth/login
 * @desc    Login user and return JWT token
 * @access  Public
 */
exports.login = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find user and include password field
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate JWT token
    const token = generateToken(user._id, user.role);

    // Get wallet balances if user has custodial wallet
    let walletBalances = null;
    if (user.hasCustodialWallet && user.custodialWallet?.address) {
      try {
        const ethBalance = await walletService.getETHBalance(user.custodialWallet.address);
        const usdcBalance = await walletService.getMockUSDCBalance(user.custodialWallet.address);
        walletBalances = {
          eth: ethBalance,
          usdc: usdcBalance
        };
      } catch (error) {
        console.error('Error fetching balances:', error.message);
        // Continue without balances if fetch fails
      }
    }

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          walletAddress: user.custodialWallet?.address || user.walletAddress,
          isWalletLinked: user.isWalletLinked,
          hasCustodialWallet: user.hasCustodialWallet
        },
        balances: walletBalances
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging in',
      error: error.message
    });
  }
};

/**
 * @route   GET /api/auth/me
 * @desc    Get current logged in user
 * @access  Private
 */
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get wallet balances if user has custodial wallet
    let walletBalances = null;
    if (user.hasCustodialWallet && user.custodialWallet?.address) {
      try {
        const ethBalance = await walletService.getETHBalance(user.custodialWallet.address);
        const usdcBalance = await walletService.getMockUSDCBalance(user.custodialWallet.address);
        walletBalances = {
          eth: ethBalance,
          usdc: usdcBalance
        };
      } catch (error) {
        console.error('Error fetching balances:', error.message);
      }
    }

    res.json({
      success: true,
      data: {
        id: user._id,
        email: user.email,
        role: user.role,
        walletAddress: user.custodialWallet?.address || user.walletAddress,
        isWalletLinked: user.isWalletLinked,
        hasCustodialWallet: user.hasCustodialWallet,
        createdAt: user.createdAt,
        balances: walletBalances
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user data',
      error: error.message
    });
  }
};
