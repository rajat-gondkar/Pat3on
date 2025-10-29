import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const CreatorProfilePage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  const [profile, setProfile] = useState(null);
  const [plans, setPlans] = useState([]);
  const [userSubscriptions, setUserSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchCreatorData();
  }, [userId]);

  const fetchCreatorData = async () => {
    try {
      setLoading(true);
      const [profileRes, plansRes] = await Promise.all([
        api.get(`/author/profile/${userId}`),
        api.get(`/plans/author/${userId}`)
      ]);
      
      setProfile(profileRes.data.profile);
      setPlans(plansRes.data.plans);

      // Fetch user's active subscriptions if authenticated
      if (isAuthenticated) {
        try {
          const subsRes = await api.get('/subscriptions/my-subscriptions');
          setUserSubscriptions(subsRes.data.subscriptions || []);
        } catch (err) {
          console.error('Failed to fetch subscriptions:', err);
        }
      }
    } catch (err) {
      setError('Failed to load creator profile');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const isSubscribedToPlan = (planId) => {
    return userSubscriptions.some(
      sub => sub.plan?._id === planId && sub.status === 'active'
    );
  };

  const handleSubscribe = async (planId) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      setSubscribing(planId);
      setError('');
      setSuccess('');

      const response = await api.post('/subscriptions/subscribe', { planId });
      
      setSuccess('Subscription successful! You are now subscribed.');
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Subscription failed');
    } finally {
      setSubscribing(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading profile...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Creator Not Found</h2>
          <button
            onClick={() => navigate('/browse')}
            className="bg-white hover:bg-gray-200 text-black px-6 py-2 rounded-sm font-medium transition-all"
          >
            Browse Creators
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <Link to="/browse" className="text-gray-400 hover:text-white mb-4 inline-block">
          ← Back to Browse
        </Link>
        {/* Profile Header */}
        <div className="bg-dark-secondary border border-dark-border rounded-sm p-8 mb-8">
          <div className="flex items-start gap-6 mb-6">
            <div className="w-24 h-24 bg-dark-accent rounded-full flex items-center justify-center text-4xl flex-shrink-0">
              {profile.profileImage ? (
                <img
                  src={profile.profileImage}
                  alt={profile.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span>🎨</span>
              )}
            </div>
            
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white mb-2">{profile.name}</h1>
              <p className="text-gray-400 mb-4">{profile.totalSubscribers} subscribers</p>
              
              {profile.bio && (
                <p className="text-gray-300 mb-4">{profile.bio}</p>
              )}

              {/* Social Links */}
              {profile.socialLinks && (
                <div className="flex gap-4">
                  {profile.socialLinks.twitter && (
                    <a
                      href={profile.socialLinks.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      Twitter
                    </a>
                  )}
                  {profile.socialLinks.website && (
                    <a
                      href={profile.socialLinks.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      Website
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-sm mb-6">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-500/10 border border-green-500/30 text-green-400 p-4 rounded-sm mb-6">
            {success}
          </div>
        )}

        {/* Subscription Plans */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-6">Subscription Tiers</h2>
          
          {plans.length === 0 ? (
            <div className="bg-dark-secondary border border-dark-border rounded-sm p-8 text-center">
              <p className="text-gray-400">This creator hasn't set up any subscription tiers yet.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {plans.map((plan) => (
                <div
                  key={plan._id}
                  className="bg-dark-secondary border border-dark-border rounded-sm p-6 hover:border-white transition-all"
                >
                  <h3 className="text-xl font-semibold text-white mb-2">{plan.tierName}</h3>
                  <p className="text-3xl font-bold text-white mb-4">
                    {plan.pricePerMonth} <span className="text-lg text-gray-400">mUSDC/month</span>
                  </p>
                  
                  {plan.description && (
                    <p className="text-gray-400 mb-4">{plan.description}</p>
                  )}

                  {/* Benefits */}
                  {plan.benefits && plan.benefits.length > 0 && (
                    <ul className="space-y-2 mb-6">
                      {plan.benefits.map((benefit, index) => (
                        <li key={index} className="text-gray-300 text-sm flex items-start">
                          <span className="text-green-500 mr-2">✓</span>
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {isSubscribedToPlan(plan._id) ? (
                    <>
                      <div className="w-full bg-green-900/30 border border-green-500 text-green-200 py-3 rounded-sm font-semibold text-center mb-2">
                        ✓ Already Subscribed
                      </div>
                      <p className="text-gray-400 text-xs text-center">
                        You are currently subscribed to this plan
                      </p>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleSubscribe(plan._id)}
                        disabled={subscribing === plan._id || !isAuthenticated}
                        className="w-full bg-white hover:bg-gray-200 text-black py-3 rounded-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {subscribing === plan._id ? 'Processing...' : 'Subscribe Now'}
                      </button>
                      
                      {!isAuthenticated && (
                        <p className="text-gray-400 text-xs text-center mt-2">
                          Please login to subscribe
                        </p>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreatorProfilePage;
