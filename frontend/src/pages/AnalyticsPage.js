import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const AnalyticsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analytics, setAnalytics] = useState({
    totalSubscribers: 0,
    activeSubscribers: 0,
    monthlyRevenue: 0,
    totalRevenue: 0,
    avgRevenuePerSubscriber: 0,
    subscriberGrowth: [],
    revenueByPlan: [],
    recentSubscriptions: []
  });

  useEffect(() => {
    if (user && user.role !== 'author') {
      navigate('/dashboard');
      return;
    }
    fetchAnalytics();
  }, [user, navigate]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch subscribers
      const subsRes = await api.get('/subscriptions/author/subscribers');
      const subscribers = subsRes.data.subscribers || [];

      // Fetch author profile for stats
      const profileRes = await api.get('/author/my-profile');
      const profile = profileRes.data.profile;

      // Calculate metrics
      const activeSubscribers = subscribers.filter(s => s.status === 'active').length;
      const monthlyRevenue = subscribers.reduce((sum, sub) => {
        return sum + (sub.plan?.pricePerMonth || 0);
      }, 0);

      // Revenue by plan
      const revenueByPlan = {};
      subscribers.forEach(sub => {
        const planName = sub.plan?.tierName || 'Unknown';
        const price = sub.plan?.pricePerMonth || 0;
        if (!revenueByPlan[planName]) {
          revenueByPlan[planName] = { count: 0, revenue: 0 };
        }
        revenueByPlan[planName].count += 1;
        revenueByPlan[planName].revenue += price;
      });

      const revenueByPlanArray = Object.keys(revenueByPlan).map(planName => ({
        plan: planName,
        subscribers: revenueByPlan[planName].count,
        revenue: revenueByPlan[planName].revenue
      }));

      // Recent subscriptions (last 5)
      const recentSubs = subscribers
        .sort((a, b) => new Date(b.startDate) - new Date(a.startDate))
        .slice(0, 5);

      setAnalytics({
        totalSubscribers: profile.totalSubscribers || 0,
        activeSubscribers,
        monthlyRevenue,
        totalRevenue: monthlyRevenue, // For now, same as monthly
        avgRevenuePerSubscriber: activeSubscribers > 0 ? monthlyRevenue / activeSubscribers : 0,
        revenueByPlan: revenueByPlanArray,
        recentSubscriptions: recentSubs
      });
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError(err.response?.data?.message || 'Failed to load analytics');
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

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-gray-400">Loading analytics...</p>
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
          <h1 className="text-4xl font-bold mb-2">Analytics Dashboard</h1>
          <p className="text-gray-400">Track your performance and growth</p>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-500 text-red-200 px-4 py-3 rounded-sm mb-6">
            {error}
          </div>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-dark-secondary rounded-sm border border-dark-border p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-400 text-sm">Total Subscribers</p>
              <span className="text-3xl">👥</span>
            </div>
            <p className="text-4xl font-bold text-white">{analytics.totalSubscribers}</p>
            <p className="text-xs text-gray-500 mt-2">All-time subscribers</p>
          </div>

          <div className="bg-dark-secondary rounded-sm border border-dark-border p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-400 text-sm">Active Subscribers</p>
              <span className="text-3xl">✅</span>
            </div>
            <p className="text-4xl font-bold text-green-400">{analytics.activeSubscribers}</p>
            <p className="text-xs text-gray-500 mt-2">Currently subscribed</p>
          </div>

          <div className="bg-dark-secondary rounded-sm border border-dark-border p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-400 text-sm">Revenue per 5 Minutes</p>
              <span className="text-3xl">💰</span>
            </div>
            <p className="text-4xl font-bold text-white">${analytics.monthlyRevenue.toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-2">Recurring income every 5 minutes</p>
          </div>

          <div className="bg-dark-secondary rounded-sm border border-dark-border p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-400 text-sm">Avg per Subscriber</p>
              <span className="text-3xl">📊</span>
            </div>
            <p className="text-4xl font-bold text-white">${analytics.avgRevenuePerSubscriber.toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-2">Average revenue per user</p>
          </div>
        </div>

        {/* Revenue by Plan */}
        <div className="bg-dark-secondary rounded-sm border border-dark-border p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">Revenue by Plan</h2>
          {analytics.revenueByPlan.length === 0 ? (
            <p className="text-gray-400">No subscription data available</p>
          ) : (
            <div className="space-y-4">
              {analytics.revenueByPlan.map((item, index) => (
                <div key={index} className="bg-dark-primary p-4 rounded-sm border border-dark-border">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-semibold text-white">{item.plan}</h3>
                    <span className="text-sm text-gray-400">{item.subscribers} subscriber{item.subscribers !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex-1 bg-dark-secondary rounded-full h-2 mr-4">
                      <div
                        className="bg-white h-2 rounded-full"
                        style={{
                          width: `${(item.revenue / analytics.monthlyRevenue) * 100}%`
                        }}
                      ></div>
                    </div>
                    <span className="text-xl font-bold text-white">${item.revenue.toFixed(2)}/mo</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Subscriptions */}
        <div className="bg-dark-secondary rounded-sm border border-dark-border p-6">
          <h2 className="text-2xl font-bold mb-4">Recent Subscriptions</h2>
          {analytics.recentSubscriptions.length === 0 ? (
            <p className="text-gray-400">No recent subscriptions</p>
          ) : (
            <div className="space-y-3">
              {analytics.recentSubscriptions.map((sub) => (
                <div key={sub._id} className="flex items-center justify-between p-4 bg-dark-primary rounded-sm border border-dark-border">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center font-bold">
                      {sub.user?.displayName?.[0]?.toUpperCase() || sub.user?.email?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <p className="font-semibold text-white">
                        {sub.user?.displayName || 'Anonymous User'}
                      </p>
                      <p className="text-sm text-gray-400">{sub.plan?.tierName || 'Unknown Plan'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-white">${sub.plan?.pricePerMonth?.toFixed(2) || '0.00'}/5min</p>
                    <p className="text-sm text-gray-400">{formatDate(sub.startDate)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Growth Tips */}
        <div className="mt-8 p-6 bg-dark-secondary rounded-sm border border-dark-border">
          <h3 className="text-xl font-semibold mb-4">💡 Growth Tips</h3>
          <ul className="space-y-2 text-gray-300">
            <li>• Post regularly to keep your subscribers engaged</li>
            <li>• Offer exclusive content to higher-tier subscribers</li>
            <li>• Engage with your community through updates</li>
            <li>• Consider creating special promotions for new subscribers</li>
            <li>• Monitor your analytics to understand what works</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
