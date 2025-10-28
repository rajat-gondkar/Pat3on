import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const DashboardPage = () => {
  const { user, balances, refreshBalances, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

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
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome back, {user.email}!
          </h1>
          <p className="text-gray-400 text-lg">
            {user.role === 'author' ? 'Creator Dashboard' : 'Subscriber Dashboard'}
          </p>
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
                <div className="bg-dark-primary p-3 rounded-sm mt-2 border border-dark-border">
                  <code className="text-gray-400 text-xs break-all">
                    {user.walletAddress}
                  </code>
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
                Balances
              </h2>
              <button
                onClick={refreshBalances}
                className="text-gray-400 hover:text-gray-300 text-sm font-semibold transition-colors"
              >
                🔄 Refresh
              </button>
            </div>
            {balances ? (
              <div className="space-y-4">
                <div className="bg-dark-primary p-4 rounded-sm border border-dark-border hover:border-white transition-colors">
                  <div className="text-gray-400 text-sm mb-1">Ethereum (ETH)</div>
                  <div className="text-2xl font-bold text-white">
                    {parseFloat(balances.eth).toFixed(4)} ETH
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    For gas fees
                  </div>
                </div>
                <div className="bg-dark-primary p-4 rounded-sm border border-dark-border hover:border-white transition-colors">
                  <div className="text-gray-400 text-sm mb-1">Mock USDC</div>
                  <div className="text-2xl font-bold text-white">
                    {parseFloat(balances.usdc).toFixed(2)} mUSDC
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    For subscriptions
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-gray-400">Loading balances...</div>
            )}
          </div>
        </div>

        {/* Get Test Tokens */}
        <div className="bg-white/20 border border-navy-600/40 rounded-sm shadow-xl p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-3 flex items-center">
            <span className="mr-2">🚰</span>
            Need Test Tokens?
          </h2>
          <p className="text-gray-300 mb-5">
            Get free Sepolia ETH and Mock USDC to test the platform
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="https://sepoliafaucet.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white hover:bg-gray-200 text-white px-6 py-3 rounded-sm transition-all shadow-lg hover:shadow-gray-500/30 font-semibold"
            >
              Get Sepolia ETH →
            </a>
            <a
              href={`https://sepolia.etherscan.io/address/${user.walletAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-dark-secondary hover:bg-dark-accent border border-dark-border text-white px-6 py-3 rounded-sm transition-all font-semibold"
            >
              View on Etherscan →
            </a>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6">
          {user.role === 'author' ? (
            <>
              <div className="bg-dark-secondary rounded-sm shadow-xl p-6 border border-dark-border hover:border-white transition-all cursor-pointer group">
                <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">📝</div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Create Plans
                </h3>
                <p className="text-gray-400 text-sm">
                  Set up subscription tiers for your supporters
                </p>
              </div>
              <div className="bg-dark-secondary rounded-sm shadow-xl p-6 border border-dark-border hover:border-white transition-all cursor-pointer group">
                <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">👥</div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  My Subscribers
                </h3>
                <p className="text-gray-400 text-sm">
                  View and manage your subscriber list
                </p>
              </div>
              <div className="bg-dark-secondary rounded-sm shadow-xl p-6 border border-dark-border hover:border-white transition-all cursor-pointer group">
                <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">📊</div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Analytics
                </h3>
                <p className="text-gray-400 text-sm">
                  Track your earnings and growth
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="bg-dark-secondary rounded-sm shadow-xl p-6 border border-dark-border hover:border-white transition-all cursor-pointer group">
                <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">🔍</div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Discover Creators
                </h3>
                <p className="text-gray-400 text-sm">
                  Browse and find creators to support
                </p>
              </div>
              <div className="bg-dark-secondary rounded-sm shadow-xl p-6 border border-dark-border hover:border-white transition-all cursor-pointer group">
                <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">⭐</div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  My Subscriptions
                </h3>
                <p className="text-gray-400 text-sm">
                  View creators you're supporting
                </p>
              </div>
              <div className="bg-dark-secondary rounded-sm shadow-xl p-6 border border-dark-border hover:border-white transition-all cursor-pointer group">
                <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">💳</div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Payment History
                </h3>
                <p className="text-gray-400 text-sm">
                  Track your subscription payments
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
