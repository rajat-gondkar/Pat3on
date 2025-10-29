import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../services/api';

const MySubscriptionsPage = () => {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelModal, setCancelModal] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/subscriptions/my-subscriptions');
      // Filter to only show active subscriptions
      const activeSubscriptions = response.data.subscriptions.filter(
        sub => sub.status === 'active'
      );
      setSubscriptions(activeSubscriptions);
    } catch (err) {
      setError('Failed to load subscriptions');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async (subscriptionId) => {
    try {
      setCancelling(true);
      await api.post(`/subscriptions/cancel/${subscriptionId}`);
      setCancelModal(null);
      fetchSubscriptions(); // Refresh list
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel subscription');
      console.error(err);
    } finally {
      setCancelling(false);
    }
  };

  const handleToggleAutoRenew = async (subscriptionId, currentValue) => {
    try {
      await api.patch(`/subscriptions/${subscriptionId}/auto-renew`, {
        autoRenew: !currentValue
      });
      fetchSubscriptions(); // Refresh list
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update auto-renew');
      console.error(err);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getTimeUntilRenewal = (endDate) => {
    const now = new Date();
    const end = new Date(endDate);
    const diffMs = end - now;
    
    if (diffMs <= 0) return 'Expires now';
    
    const seconds = Math.floor(diffMs / 1000);
    const minutes = Math.floor(seconds / 60);
    
    if (minutes > 0) {
      const remainingSeconds = seconds % 60;
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${seconds}s`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading subscriptions...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black py-12 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link to="/dashboard" className="text-gray-400 hover:text-white mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-4xl font-bold text-white mb-2">My Subscriptions</h1>
          <p className="text-gray-400 text-lg">
            Manage your active subscriptions and renewals
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-sm mb-6">
            {error}
          </div>
        )}

        {/* Subscriptions List */}
        {subscriptions.length === 0 ? (
          <div className="text-center py-20 bg-dark-secondary rounded-sm border border-dark-border">
            <div className="text-6xl mb-4">📭</div>
            <h2 className="text-2xl font-semibold text-white mb-2">No Active Subscriptions</h2>
            <p className="text-gray-400 mb-6">
              You haven't subscribed to any creators yet
            </p>
            <Link
              to="/browse"
              className="bg-white hover:bg-gray-200 text-black px-6 py-3 rounded-sm font-semibold transition-all inline-block"
            >
              Browse Creators
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {subscriptions.map((subscription) => {
              const timeLeft = getTimeUntilRenewal(subscription.endDate);
              const isExpiringSoon = new Date(subscription.endDate) - new Date() <= 60000; // Less than 1 minute

              return (
                <div
                  key={subscription._id}
                  className="bg-dark-secondary border border-dark-border rounded-sm p-6 hover:border-white transition-all"
                >
                  <div className="flex items-start justify-between">
                    {/* Subscription Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <Link
                          to={`/plan/${subscription.planId?._id}/posts`}
                          className="text-2xl font-bold text-white hover:text-gray-300 transition-colors"
                        >
                          {subscription.planId?.tierName || 'Plan'} →
                        </Link>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            subscription.status === 'active'
                              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                              : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                          }`}
                        >
                          {subscription.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mb-3">Click plan name to view exclusive posts</p>

                      <Link
                        to={`/creator/${subscription.authorId}`}
                        className="text-gray-400 hover:text-white transition-colors mb-4 inline-block"
                      >
                        Creator: {subscription.authorId?.email || 'Unknown'}
                      </Link>

                      {subscription.planId?.description && (
                        <p className="text-gray-400 mb-4">
                          {subscription.planId.description}
                        </p>
                      )}

                      {/* Benefits */}
                      {subscription.planId?.benefits && subscription.planId.benefits.length > 0 && (
                        <div className="mb-4">
                          <p className="text-sm text-gray-500 mb-2">Benefits:</p>
                          <ul className="space-y-1">
                            {subscription.planId.benefits.map((benefit, idx) => (
                              <li key={idx} className="text-sm text-gray-400 flex items-center">
                                <span className="mr-2">✓</span>
                                {benefit}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Dates & Price */}
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Started</p>
                          <p className="text-white font-semibold">
                            {formatDate(subscription.startDate)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">
                            {subscription.autoRenew ? 'Next Renewal' : 'Expires'}
                          </p>
                          <p className={`font-semibold ${isExpiringSoon && subscription.autoRenew ? 'text-yellow-400' : 'text-white'}`}>
                            {formatDate(subscription.endDate)}
                          </p>
                          {subscription.status === 'active' && (
                            <p className="text-xs text-gray-500 mt-1">
                                                          <span className={`text-xs ${isExpiringSoon ? 'text-red-400' : 'text-gray-400'}`}>
                              {timeLeft} remaining
                            </span>
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Price */}
                      <div className="bg-dark-primary border border-dark-border rounded-sm p-4 mb-4 inline-block">
                      <p className="text-xs text-gray-500 mb-1">Price per 5 Minutes</p>
                      <p className="text-lg font-bold text-white">
                        {subscription.planId?.pricePerMonth || 0} mUSDC
                      </p>
                      </div>

                      {/* Transaction Hash */}
                      {subscription.transactionHash && (
                        <div className="mb-4">
                          <p className="text-xs text-gray-500 mb-1">Transaction</p>
                          <a
                            href={`https://sepolia.etherscan.io/tx/${subscription.transactionHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-400 hover:text-white text-sm break-all transition-colors"
                          >
                            {subscription.transactionHash}
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    {subscription.status === 'active' && (
                      <div className="ml-6 flex flex-col gap-3">
                        {/* Auto-Renew Toggle */}
                        <div className="bg-dark-primary border border-dark-border rounded-sm p-4">
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={subscription.autoRenew}
                              onChange={() => handleToggleAutoRenew(subscription._id, subscription.autoRenew)}
                              className="mr-3 w-5 h-5"
                            />
                            <div>
                              <p className="text-white font-semibold text-sm">Auto-Renew</p>
                              <p className="text-xs text-gray-500">
                                {subscription.autoRenew ? 'Enabled' : 'Disabled'}
                              </p>
                            </div>
                          </label>
                        </div>

                        {/* Cancel Button */}
                        <button
                          onClick={() => setCancelModal(subscription)}
                          className="bg-transparent hover:bg-white/10 border border-white text-white px-6 py-3 rounded-sm font-semibold transition-all whitespace-nowrap"
                        >
                          Cancel Subscription
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Cancel Confirmation Modal */}
        {cancelModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 px-4">
            <div className="bg-dark-secondary border border-dark-border rounded-sm p-8 max-w-md w-full">
              <h3 className="text-2xl font-bold text-white mb-4">
                Cancel Subscription?
              </h3>
              <p className="text-gray-400 mb-2">
                Are you sure you want to cancel your subscription to:
              </p>
              <p className="text-white font-semibold mb-4">
                {cancelModal.planId?.tierName} ({cancelModal.planId?.pricePerMonth} mUSDC/5min)
              </p>
              <p className="text-gray-400 text-sm mb-6">
                Your subscription will end on {formatDate(cancelModal.endDate)} and won't be renewed.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setCancelModal(null)}
                  disabled={cancelling}
                  className="flex-1 bg-dark-accent hover:bg-dark-border border border-dark-border text-white px-6 py-3 rounded-sm font-semibold transition-all"
                >
                  Keep Subscription
                </button>
                <button
                  onClick={() => handleCancelSubscription(cancelModal._id)}
                  disabled={cancelling}
                  className="flex-1 bg-white hover:bg-gray-200 text-black px-6 py-3 rounded-sm font-semibold transition-all"
                >
                  {cancelling ? 'Cancelling...' : 'Yes, Cancel'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MySubscriptionsPage;
