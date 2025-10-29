import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const CreatePlanPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    tierName: '',
    description: '',
    pricePerMonth: '',
    benefits: ['']
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [myPlans, setMyPlans] = useState([]);

  useEffect(() => {
    // Check if user is an author
    if (user && user.role !== 'author') {
      navigate('/dashboard');
      return;
    }
    fetchMyPlans();
  }, [user, navigate]);

  const fetchMyPlans = async () => {
    try {
      const response = await api.get('/plans/my-plans');
      setMyPlans(response.data.plans);
    } catch (err) {
      console.error('Failed to load plans:', err);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleBenefitChange = (index, value) => {
    const newBenefits = [...formData.benefits];
    newBenefits[index] = value;
    setFormData({ ...formData, benefits: newBenefits });
  };

  const addBenefit = () => {
    setFormData({
      ...formData,
      benefits: [...formData.benefits, '']
    });
  };

  const removeBenefit = (index) => {
    const newBenefits = formData.benefits.filter((_, i) => i !== index);
    setFormData({ ...formData, benefits: newBenefits });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Filter out empty benefits
      const benefits = formData.benefits.filter(b => b.trim() !== '');
      
      await api.post('/plans', {
        tierName: formData.tierName,
        description: formData.description,
        pricePerMonth: parseFloat(formData.pricePerMonth),
        benefits
      });

      // Reset form
      setFormData({
        tierName: '',
        description: '',
        pricePerMonth: '',
        benefits: ['']
      });

      // Refresh plans list
      fetchMyPlans();
      
      alert('Plan created successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create plan');
    } finally {
      setLoading(false);
    }
  };

  const togglePlanStatus = async (planId, currentStatus) => {
    try {
      await api.put(`/plans/${planId}`, {
        isActive: !currentStatus
      });
      fetchMyPlans();
    } catch (err) {
      alert('Failed to update plan status');
    }
  };

  return (
    <div className="min-h-screen bg-black py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <Link to="/dashboard" className="text-gray-400 hover:text-white mb-4 inline-block">
          ← Back to Dashboard
        </Link>
        <h1 className="text-4xl font-bold text-white mb-8">Manage Subscription Plans</h1>

        {/* Create New Plan Form */}
        <div className="bg-dark-secondary border border-dark-border rounded-sm p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Create New Plan</h2>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-sm mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Tier Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Tier Name *
              </label>
              <input
                type="text"
                name="tierName"
                value={formData.tierName}
                onChange={handleChange}
                required
                placeholder="e.g., Basic, Premium, VIP"
                className="w-full px-4 py-3 bg-black border border-dark-border rounded-sm text-white placeholder-gray-500 focus:outline-none focus:border-white transition-all"
              />
            </div>

            {/* Price */}
            <div>
                            <label className="block text-gray-400 text-sm mb-2">
                Price per 5 Minutes (mUSDC) *
              </label>
              <input
                type="number"
                name="pricePerMonth"
                value={formData.pricePerMonth}
                onChange={handleChange}
                className="w-full bg-dark-primary text-white border border-dark-border rounded-sm px-4 py-3 focus:outline-none focus:border-white transition-colors"
                placeholder="10.00"
                step="0.01"
                min="0"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="3"
                placeholder="Describe what subscribers get..."
                className="w-full px-4 py-3 bg-black border border-dark-border rounded-sm text-white placeholder-gray-500 focus:outline-none focus:border-white transition-all resize-none"
              />
            </div>

            {/* Benefits */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Benefits
              </label>
              {formData.benefits.map((benefit, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={benefit}
                    onChange={(e) => handleBenefitChange(index, e.target.value)}
                    placeholder="e.g., Access to exclusive content"
                    className="flex-1 px-4 py-3 bg-black border border-dark-border rounded-sm text-white placeholder-gray-500 focus:outline-none focus:border-white transition-all"
                  />
                  {formData.benefits.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeBenefit(index)}
                      className="px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-sm hover:bg-red-500/20 transition-all"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addBenefit}
                className="mt-2 text-white hover:text-gray-300 transition-colors text-sm underline"
              >
                + Add another benefit
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white hover:bg-gray-200 text-black py-3 rounded-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Plan'}
            </button>
          </form>
        </div>

        {/* Existing Plans */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-6">Your Plans</h2>
          
          {myPlans.length === 0 ? (
            <div className="bg-dark-secondary border border-dark-border rounded-sm p-8 text-center">
              <p className="text-gray-400">You haven't created any plans yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {myPlans.map((plan) => (
                <div
                  key={plan._id}
                  className="bg-dark-secondary border border-dark-border rounded-sm p-6 hover:border-white transition-all"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <Link 
                        to={`/plan/${plan._id}/posts`}
                        className="text-xl font-semibold text-white hover:text-gray-300 transition-colors inline-block"
                      >
                        {plan.tierName} →
                      </Link>
                      <p className="text-xs text-gray-500 mb-2">Click to view posts</p>
                      <p className="text-2xl font-bold text-white mt-2">
                                              <div className="mb-2">
                        <span className="text-2xl font-bold text-white">
                          {plan.pricePerMonth} <span className="text-sm text-gray-400">mUSDC/5min</span>
                        </span>
                      </div>
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`px-3 py-1 rounded-sm text-sm ${plan.isActive ? 'bg-green-500/10 text-green-400' : 'bg-gray-500/10 text-gray-400'}`}>
                        {plan.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <button
                        onClick={() => togglePlanStatus(plan._id, plan.isActive)}
                        className="text-white hover:text-gray-300 text-sm underline transition-colors"
                      >
                        {plan.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </div>

                  {plan.description && (
                    <p className="text-gray-400 mb-4">{plan.description}</p>
                  )}

                  {plan.benefits && plan.benefits.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-400 mb-2">Benefits:</p>
                      <ul className="space-y-1">
                        {plan.benefits.map((benefit, index) => (
                          <li key={index} className="text-gray-300 text-sm flex items-start">
                            <span className="text-green-500 mr-2">✓</span>
                            <span>{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="mt-4 text-sm text-gray-400">
                    {plan.subscriberCount} subscriber{plan.subscriberCount !== 1 ? 's' : ''}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreatePlanPage;
