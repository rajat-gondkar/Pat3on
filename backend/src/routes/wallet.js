const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const walletController = require('../controllers/walletController');
const auth = require('../middleware/auth');

/**
 * @route   POST /api/wallet/link
 * @desc    Link wallet address to user account
 * @access  Private
 */
router.post(
  '/link',
  [
    auth,
    body('walletAddress')
      .notEmpty()
      .withMessage('Wallet address is required')
      .isEthereumAddress()
      .withMessage('Invalid Ethereum address')
  ],
  walletController.linkWallet
);

/**
 * @route   GET /api/wallet/info
 * @desc    Get wallet information
 * @access  Private
 */
router.get('/info', auth, walletController.getWalletInfo);

/**
 * @route   DELETE /api/wallet/unlink
 * @desc    Unlink wallet from account
 * @access  Private
 */
router.delete('/unlink', auth, walletController.unlinkWallet);

module.exports = router;
