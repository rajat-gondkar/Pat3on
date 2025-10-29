import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const DashboardPage = () => {
  const { user, balances, refreshBalances, loading } = useAuth();
  const navigate = useNavigate();
  const [copiedAddress, setCopiedAddress] = React.useState(false);

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
              <div className="bg-dark-primary p-4 rounded-sm border border-dark-border hover:border-white transition-colors">
                <div className="text-gray-400 text-sm mb-1">Mock USDC</div>
                <div className="text-2xl font-bold text-white">
                  {parseFloat(balances.usdc).toFixed(2)} mUSDC
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  For subscriptions
                </div>
              </div>
            ) : (
              <div className="text-gray-400">Loading balance...</div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6">
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
              <Link to="/analytics" className="bg-dark-secondary rounded-sm shadow-xl p-6 border border-dark-border hover:border-white transition-all cursor-pointer group">
                <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">📊</div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Analytics
                </h3>
                <p className="text-gray-400 text-sm">
                  Track your earnings and growth
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
    </div>
  );
};

export default DashboardPage;
