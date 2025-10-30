import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

const DashboardPage = () => {
  const { user, balances, refreshBalances, loading } = useAuth();
  const navigate = useNavigate();
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawError, setWithdrawError] = useState('');
  const [withdrawSuccess, setWithdrawSuccess] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(user.walletAddress);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const handleWithdraw = async () => {
    setWithdrawError('');
    setWithdrawSuccess('');

    // Validation
    if (!withdrawAddress || !withdrawAddress.startsWith('0x') || withdrawAddress.length !== 42) {
      setWithdrawError('Please enter a valid Ethereum address');
      return;
    }

    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0) {
      setWithdrawError('Please enter a valid amount');
      return;
    }

    if (amount > parseFloat(balances.usdc)) {
      setWithdrawError('Insufficient balance');
      return;
    }

    try {
      setWithdrawing(true);
      const response = await api.post('/custodial-wallet/withdraw', {
        toAddress: withdrawAddress,
        amount: amount
      });

      setWithdrawSuccess(`Successfully withdrew ${amount} mUSDC! Transaction: ${response.data.transactionHash}`);
      setWithdrawAddress('');
      setWithdrawAmount('');
      
      // Refresh balances after 3 seconds
      setTimeout(() => {
        refreshBalances();
        setShowWithdrawModal(false);
        setWithdrawSuccess('');
      }, 3000);
    } catch (error) {
      setWithdrawError(error.response?.data?.message || 'Withdrawal failed. Please try again.');
    } finally {
      setWithdrawing(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Welcome Section */}
        <div className="bg-dark-secondary rounded-sm shadow-2xl p-8 mb-8 border border-dark-border">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Welcome back, {user.displayName || user.email}!
              </h1>
              <p className="text-gray-400 text-lg">
                {user.role === 'author' ? 'Creator Dashboard' : 'Subscriber Dashboard'}
              </p>
            </div>
            {user.role === 'author' && (
              <Link
                to="/profile-settings"
                className="bg-dark-primary hover:bg-dark-accent border border-dark-border hover:border-white text-white px-4 py-2 rounded-sm transition-all font-semibold text-sm"
              >
                ✏️ Edit Profile
              </Link>
            )}
          </div>
        </div>

        {/* Wallet Info */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Wallet Address */}
          <div className="bg-dark-secondary rounded-sm shadow-xl p-6 border border-dark-border">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
              <span className="mr-2">👛</span>
              Your Wallet
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-400">Wallet Address</label>
                <div className="bg-dark-primary p-3 rounded-sm mt-2 border border-dark-border flex items-center justify-between gap-2">
                  <code className="text-gray-400 text-xs break-all flex-1">
                    {user.walletAddress}
                  </code>
                  <button
                    onClick={handleCopyAddress}
                    className="bg-dark-accent hover:bg-dark-border border border-dark-border text-white px-3 py-1 rounded-sm text-xs transition-all flex-shrink-0"
                    title="Copy address"
                  >
                    {copiedAddress ? '✓ Copied' : '📋 Copy'}
                  </button>
                </div>
              </div>
              <div className="text-xs text-gray-500 bg-dark-accent p-3 rounded-sm">
                💡 You can use this address to deposit ETH or mUSDC
              </div>
            </div>
          </div>

          {/* Balances */}
          <div className="bg-dark-secondary rounded-sm shadow-xl p-6 border border-dark-border">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <span className="mr-2">💰</span>
                Balance
              </h2>
              <button
                onClick={refreshBalances}
                className="text-gray-400 hover:text-gray-300 text-sm font-semibold transition-colors"
              >
                🔄 Refresh
              </button>
            </div>
            {balances ? (
              <>
                <div className="bg-dark-primary p-4 rounded-sm border border-dark-border hover:border-white transition-colors mb-3">
                  <div className="text-gray-400 text-sm mb-1">Mock USDC</div>
                  <div className="text-2xl font-bold text-white">
                    {parseFloat(balances.usdc).toFixed(2)} mUSDC
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    For subscriptions
                  </div>
                </div>
                <button
                  onClick={() => setShowWithdrawModal(true)}
                  className="w-full bg-dark-accent hover:bg-dark-border border border-dark-border hover:border-white text-white py-2 rounded-sm transition-all font-semibold text-sm"
                >
                  💸 Withdraw mUSDC
                </button>
              </>
            ) : (
              <div className="text-gray-400">Loading balance...</div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className={`grid gap-6 ${user.role === 'author' ? 'md:grid-cols-2' : 'md:grid-cols-3'}`}>
          {user.role === 'author' ? (
            <>
              <Link to="/create-plan" className="bg-dark-secondary rounded-sm shadow-xl p-6 border border-dark-border hover:border-white transition-all cursor-pointer group">
                <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">📝</div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Create Plans
                </h3>
                <p className="text-gray-400 text-sm">
                  Set up subscription tiers for your supporters
                </p>
              </Link>
              <Link to="/write-post" className="bg-dark-secondary rounded-sm shadow-xl p-6 border border-dark-border hover:border-white transition-all cursor-pointer group">
                <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">✍️</div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Write a Post
                </h3>
                <p className="text-gray-400 text-sm">
                  Share content with your subscribers
                </p>
              </Link>
            </>
          ) : (
            <>
              <Link to="/browse" className="bg-dark-secondary rounded-sm shadow-xl p-6 border border-dark-border hover:border-white transition-all cursor-pointer group">
                <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">🔍</div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Discover Creators
                </h3>
                <p className="text-gray-400 text-sm">
                  Browse and find creators to support
                </p>
              </Link>
              <Link to="/my-subscriptions" className="bg-dark-secondary rounded-sm shadow-xl p-6 border border-dark-border hover:border-white transition-all cursor-pointer group">
                <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">⭐</div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  My Subscriptions
                </h3>
                <p className="text-gray-400 text-sm">
                  View creators you're supporting
                </p>
              </Link>
              <Link to="/payment-history" className="bg-dark-secondary rounded-sm shadow-xl p-6 border border-dark-border hover:border-white transition-all cursor-pointer group">
                <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">💳</div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Payment History
                </h3>
                <p className="text-gray-400 text-sm">
                  Track your subscription payments
                </p>
              </Link>
            </>
          )}
        </div>

        {/* Get Test Tokens */}
        <div className="bg-dark-secondary border border-dark-border rounded-sm shadow-xl p-6 mt-8">
          <h2 className="text-xl font-semibold text-white mb-3 flex items-center">
            <span className="mr-2">🚰</span>
            Need Test Tokens?
          </h2>
          <p className="text-gray-400 mb-5">
            Get free Sepolia ETH and Mock USDC to test the platform
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="https://sepoliafaucet.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-dark-primary hover:bg-dark-accent border border-dark-border hover:border-white text-white px-6 py-3 rounded-sm transition-all font-semibold"
            >
              Get Sepolia ETH →
            </a>
            <a
              href={`https://sepolia.etherscan.io/address/${user.walletAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-dark-primary hover:bg-dark-accent border border-dark-border hover:border-white text-white px-6 py-3 rounded-sm transition-all font-semibold"
            >
              View on Etherscan →
            </a>
          </div>
        </div>
      </div>

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-dark-secondary border border-dark-border rounded-sm p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-white mb-4">💸 Withdraw mUSDC</h2>
            
            {/* Warning */}
            <div className="bg-yellow-500/10 border border-yellow-500/40 rounded-sm p-4 mb-6">
              <p className="text-yellow-400 text-sm font-semibold mb-2">⚠️ Important Warning</p>
              <p className="text-yellow-300 text-xs">
                Make sure the receiving address is on the <strong>Ethereum Sepolia Testnet</strong>. 
                Sending to mainnet or other networks will result in loss of funds!
              </p>
            </div>

            {/* Current Balance */}
            <div className="bg-dark-primary p-3 rounded-sm border border-dark-border mb-4">
              <p className="text-gray-400 text-xs mb-1">Available Balance</p>
              <p className="text-white text-lg font-bold">
                {parseFloat(balances?.usdc || 0).toFixed(2)} mUSDC
              </p>
            </div>

            {/* Recipient Address */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Recipient Address
              </label>
              <input
                type="text"
                value={withdrawAddress}
                onChange={(e) => setWithdrawAddress(e.target.value)}
                placeholder="0x..."
                className="w-full px-4 py-3 bg-dark-primary border border-dark-border rounded-sm text-white placeholder-gray-500 focus:outline-none focus:border-white transition-all"
              />
            </div>

            {/* Amount */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Amount (mUSDC)
              </label>
              <input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
                max={balances?.usdc || 0}
                className="w-full px-4 py-3 bg-dark-primary border border-dark-border rounded-sm text-white placeholder-gray-500 focus:outline-none focus:border-white transition-all"
              />
              <button
                onClick={() => setWithdrawAmount(balances?.usdc || '0')}
                className="text-xs text-gray-400 hover:text-white mt-2 transition-colors"
              >
                Max: {parseFloat(balances?.usdc || 0).toFixed(2)} mUSDC
              </button>
            </div>

            {/* Error Message */}
            {withdrawError && (
              <div className="bg-red-500/10 border border-red-500/40 text-red-400 px-4 py-3 rounded-sm mb-4 text-sm">
                {withdrawError}
              </div>
            )}

            {/* Success Message */}
            {withdrawSuccess && (
              <div className="bg-green-500/10 border border-green-500/40 text-green-400 px-4 py-3 rounded-sm mb-4 text-sm">
                {withdrawSuccess}
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowWithdrawModal(false);
                  setWithdrawAddress('');
                  setWithdrawAmount('');
                  setWithdrawError('');
                  setWithdrawSuccess('');
                }}
                disabled={withdrawing}
                className="flex-1 bg-dark-accent hover:bg-dark-border border border-dark-border text-white py-3 rounded-sm transition-all font-semibold disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleWithdraw}
                disabled={withdrawing || !withdrawAddress || !withdrawAmount}
                className="flex-1 bg-dark-primary hover:bg-dark-accent border border-dark-border hover:border-white text-white py-3 rounded-sm transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {withdrawing ? 'Processing...' : 'Withdraw'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
