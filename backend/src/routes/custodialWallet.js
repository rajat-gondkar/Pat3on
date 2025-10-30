const express = require('express');
const router = express.Router();
const {
  createCustodialWallet,
  getCustodialWalletInfo,
  getDepositAddress,
  fundCustodialWalletETH,
  getMasterWalletBalance,
  withdrawMockUSDC
} = require('../controllers/custodialWalletController');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Create custodial wallet for user
router.post('/create', createCustodialWallet);

// Get wallet info and balances
router.get('/info', getCustodialWalletInfo);

// Get deposit address
router.get('/deposit-address', getDepositAddress);

// Fund wallet with ETH (admin/backend)
router.post('/fund-eth', fundCustodialWalletETH);

// Get master wallet balance (admin/monitoring)
router.get('/master-balance', getMasterWalletBalance);

// Withdraw mUSDC
router.post('/withdraw', withdrawMockUSDC);

module.exports = router;
