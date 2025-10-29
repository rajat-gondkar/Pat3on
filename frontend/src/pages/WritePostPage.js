import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const WritePostPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    planId: '' // Store the plan ID instead of tierAccess
  });
  const [plans, setPlans] = useState([]);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Redirect if not an author
  React.useEffect(() => {
    if (user && user.role !== 'author') {
      navigate('/dashboard');
    } else {
      fetchMyPlans();
    }
  }, [user, navigate]);

  const fetchMyPlans = async () => {
    try {
      const response = await api.get('/plans/my-plans');
      setPlans(response.data.plans || []);
    } catch (err) {
      console.error('Failed to fetch plans:', err);
      setError('Failed to load your plans');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim()) {
      setError('Title and content are required');
      return;
    }

    if (!formData.planId) {
      setError('Please select a plan');
      return;
    }

    try {
      setPosting(true);
      setError('');
      setSuccess('');

      await api.post('/posts/create', formData);

      setSuccess('Post published successfully!');
      setFormData({ title: '', content: '', planId: '' });
      
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to publish post');
    } finally {
      setPosting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="min-h-screen bg-black text-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link to="/dashboard" className="text-gray-400 hover:text-white mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-4xl font-bold mb-2">Write a Post</h1>
          <p className="text-gray-400">Share exclusive content with your subscribers</p>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-900/20 border border-red-500 text-red-200 px-4 py-3 rounded-sm mb-6">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-900/20 border border-green-500 text-green-200 px-4 py-3 rounded-sm mb-6">
            {success}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-dark-secondary rounded-sm border border-dark-border p-8">
          <div className="space-y-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">
                Post Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-dark-primary border border-dark-border rounded-sm text-white focus:outline-none focus:border-white transition-colors"
                placeholder="Enter post title..."
                required
              />
            </div>

            {/* Content */}
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-300 mb-2">
                Post Content *
              </label>
              <textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleChange}
                rows="12"
                className="w-full px-4 py-3 bg-dark-primary border border-dark-border rounded-sm text-white focus:outline-none focus:border-white transition-colors resize-none"
                placeholder="Write your post content here..."
                required
              />
              <p className="text-xs text-gray-400 mt-2">
                Share updates, exclusive content, or messages with your subscribers
              </p>
            </div>

            {/* Plan Access */}
            <div>
              <label htmlFor="planId" className="block text-sm font-medium text-gray-300 mb-2">
                Who can see this post? *
              </label>
              <select
                id="planId"
                name="planId"
                value={formData.planId}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-dark-primary border border-dark-border rounded-sm text-white focus:outline-none focus:border-white transition-colors"
                required
              >
                <option value="">Select a plan...</option>
                {plans.map((plan) => (
                  <option key={plan._id} value={plan._id}>
                    {plan.tierName} (${plan.pricePerMonth}/month)
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-2">
                Only subscribers of the selected plan can view this post
              </p>
              {plans.length === 0 && (
                <p className="text-xs text-yellow-400 mt-2">
                  ⚠️ You need to create a plan first before posting
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={posting}
                className="flex-1 bg-white text-black px-6 py-3 rounded-sm font-semibold hover:bg-gray-200 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
              >
                {posting ? 'Publishing...' : 'Publish Post'}
              </button>
              <Link
                to="/dashboard"
                className="px-6 py-3 border border-dark-border rounded-sm font-semibold hover:border-white transition-colors text-center"
              >
                Cancel
              </Link>
            </div>
          </div>
        </form>

        {/* Info Box */}
        <div className="mt-6 p-4 bg-dark-secondary rounded-sm border border-dark-border">
          <h3 className="text-sm font-semibold text-gray-400 mb-2">📝 Post Guidelines</h3>
          <ul className="text-sm text-gray-500 space-y-1">
            <li>• Posts are only visible to active subscribers</li>
            <li>• Be respectful and provide value to your supporters</li>
            <li>• You can share text, links, and updates</li>
            <li>• Subscribers will see your posts on their feed</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default WritePostPage;
