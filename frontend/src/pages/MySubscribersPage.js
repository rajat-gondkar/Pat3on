import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const MySubscribersPage = () => {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalSubscribers: 0,
    monthlyRevenue: 0,
    totalRevenue: 0
  });

  useEffect(() => {
    fetchSubscribers();
  }, []);

  const fetchSubscribers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/subscriptions/author/subscribers');
      
      const subscribersData = response.data.subscribers || [];
      setSubscribers(subscribersData);
      
      // Calculate stats
      const totalSubscribers = subscribersData.length;
      const monthlyRevenue = subscribersData.reduce((sum, sub) => {
        return sum + (sub.plan?.pricePerMonth || 0);
      }, 0);
      
      setStats({
        totalSubscribers,
        monthlyRevenue,
        totalRevenue: monthlyRevenue // For now, this is the same as monthly
      });
    } catch (err) {
      console.error('Error fetching subscribers:', err);
      setError(err.response?.data?.message || 'Failed to load subscribers');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const calculateDuration = (startDate) => {
    if (!startDate) return '0 days';
    const start = new Date(startDate);
    const now = new Date();
    const diffTime = Math.abs(now - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} month${months !== 1 ? 's' : ''}`;
    } else {
      const years = Math.floor(diffDays / 365);
      const remainingMonths = Math.floor((diffDays % 365) / 30);
      return `${years} year${years !== 1 ? 's' : ''}${remainingMonths > 0 ? `, ${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}` : ''}`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-gray-400">Loading your subscribers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link to="/dashboard" className="text-gray-400 hover:text-white mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-4xl font-bold mb-2">My Subscribers</h1>
          <p className="text-gray-400">Manage and view your subscriber base</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-dark-secondary rounded-sm border border-dark-border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Total Subscribers</p>
                <p className="text-3xl font-bold text-white">{stats.totalSubscribers}</p>
              </div>
              <div className="text-4xl">👥</div>
            </div>
          </div>

          <div className="bg-dark-secondary rounded-sm border border-dark-border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Revenue per 5 Minutes</p>
                <p className="text-3xl font-bold text-white">${stats.monthlyRevenue.toFixed(2)}</p>
              </div>
              <div className="text-4xl">💰</div>
            </div>
          </div>

          <div className="bg-dark-secondary rounded-sm border border-dark-border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Active Plans</p>
                <p className="text-3xl font-bold text-white">
                  {[...new Set(subscribers.map(s => s.plan?._id))].length}
                </p>
              </div>
              <div className="text-4xl">📊</div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-500 text-red-200 px-4 py-3 rounded-sm mb-6">
            {error}
          </div>
        )}

        {/* Subscribers List */}
        {subscribers.length === 0 ? (
          <div className="bg-dark-secondary rounded-sm border border-dark-border p-12 text-center">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-xl font-semibold mb-2">No Subscribers Yet</h3>
            <p className="text-gray-400 mb-6">
              When people subscribe to your plans, they'll appear here.
            </p>
            <Link
              to="/dashboard"
              className="inline-block bg-white text-black px-6 py-2 rounded-sm font-semibold hover:bg-gray-200 transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        ) : (
          <div className="bg-dark-secondary rounded-sm border border-dark-border overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-dark-primary border-b border-dark-border font-semibold text-sm">
              <div className="col-span-3">Subscriber</div>
              <div className="col-span-2">Plan</div>
              <div className="col-span-2">Started</div>
              <div className="col-span-2">Duration</div>
              <div className="col-span-2">Revenue</div>
              <div className="col-span-1">Status</div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-dark-border">
              {subscribers.map((subscription) => (
                <div
                  key={subscription._id}
                  className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-dark-primary transition-colors"
                >
                  {/* Subscriber Info */}
                  <div className="col-span-3">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center font-bold mr-3">
                        {subscription.user?.displayName?.[0]?.toUpperCase() || 
                         subscription.user?.email?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="font-semibold text-white">
                          {subscription.user?.displayName || 'Anonymous User'}
                        </p>
                        <p className="text-sm text-gray-400 truncate">
                          {subscription.user?.email || 'No email'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Plan */}
                  <div className="col-span-2 flex items-center">
                    <div>
                      <p className="font-semibold text-white">
                        {subscription.plan?.name || 'Unknown Plan'}
                      </p>
                      <p className="text-sm text-gray-400">
                        {subscription.plan?.tier || 'N/A'}
                      </p>
                    </div>
                  </div>

                  {/* Start Date */}
                  <div className="col-span-2 flex items-center">
                    <div>
                      <p className="text-white">{formatDate(subscription.startDate)}</p>
                      <p className="text-sm text-gray-400">Start date</p>
                    </div>
                  </div>

                  {/* Duration */}
                  <div className="col-span-2 flex items-center">
                    <div>
                      <p className="text-white">{calculateDuration(subscription.startDate)}</p>
                      <p className="text-sm text-gray-400">Active time</p>
                    </div>
                  </div>

                  {/* Revenue */}
                  <div className="col-span-2 flex items-center">
                    <div>
                      <p className="font-semibold text-white">
                        ${subscription.plan?.pricePerMonth?.toFixed(2) || '0.00'}
                      </p>
                      <p className="text-sm text-gray-400">/month</p>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="col-span-1 flex items-center">
                    <div className="flex flex-col items-start">
                      <span className="px-2 py-1 bg-green-900/30 border border-green-500 text-green-200 text-xs rounded-sm">
                        Active
                      </span>
                      {subscription.autoRenew && (
                        <span className="mt-1 text-xs text-gray-400">Auto-renew</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Additional Info */}
        {subscribers.length > 0 && (
          <div className="mt-6 text-center text-sm text-gray-400">
            Showing {subscribers.length} active subscriber{subscribers.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  );
};

export default MySubscribersPage;
