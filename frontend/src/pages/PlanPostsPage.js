import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const PlanPostsPage = () => {
  const { planId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPlanPosts();
  }, [planId]);

  const fetchPlanPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/posts/plan/${planId}`);
      setPosts(response.data.posts || []);
      setPlan(response.data.plan);
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError(err.response?.data?.message || 'Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-gray-400">Loading posts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-900/20 border border-red-500 text-red-200 px-6 py-4 rounded-sm mb-6">
            <p className="font-semibold mb-2">Access Denied</p>
            <p>{error}</p>
          </div>
          <Link
            to="/my-subscriptions"
            className="inline-block bg-white text-black px-6 py-3 rounded-sm font-semibold hover:bg-gray-200 transition-colors"
          >
            ← Back to My Subscriptions
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link to="/my-subscriptions" className="text-gray-400 hover:text-white mb-4 inline-block">
            ← Back to My Subscriptions
          </Link>
          
          {plan && (
            <div className="bg-dark-secondary rounded-sm border border-dark-border p-6 mb-6">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-3xl font-bold mb-2">{plan.tierName} Posts</h1>
                  <p className="text-gray-400 mb-2">
                    by {plan.authorId?.displayName || 'Unknown Author'}
                  </p>
                  <p className="text-lg text-white">
                    ${plan.pricePerMonth} <span className="text-sm text-gray-400">/ month</span>
                  </p>
                </div>
                <div className="bg-green-900/30 border border-green-500 text-green-200 px-4 py-2 rounded-sm text-sm font-semibold">
                  ✓ Subscribed
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Posts List */}
        {posts.length === 0 ? (
          <div className="bg-dark-secondary rounded-sm border border-dark-border p-12 text-center">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-xl font-semibold mb-2">No Posts Yet</h3>
            <p className="text-gray-400">
              The creator hasn't posted any content for this plan yet. Check back later!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <article
                key={post._id}
                className="bg-dark-secondary rounded-sm border border-dark-border p-6 hover:border-white transition-all"
              >
                {/* Post Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center font-bold">
                      {post.authorId?.displayName?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <p className="font-semibold text-white">
                        {post.authorId?.displayName || 'Anonymous'}
                      </p>
                      <p className="text-sm text-gray-400">
                        {formatDate(post.createdAt)}
                      </p>
                    </div>
                  </div>
                  
                  <span className="text-xs bg-dark-primary border border-dark-border px-3 py-1 rounded-sm text-gray-400">
                    {plan?.tierName}
                  </span>
                </div>

                {/* Post Content */}
                <h2 className="text-2xl font-bold text-white mb-3">{post.title}</h2>
                <div className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {post.content}
                </div>

                {/* Post Footer */}
                <div className="mt-6 pt-4 border-t border-dark-border flex items-center gap-6 text-sm text-gray-400">
                  <button className="hover:text-white transition-colors flex items-center gap-2">
                    <span>👍</span>
                    <span>{post.likes || 0} likes</span>
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Info Box */}
        {posts.length > 0 && (
          <div className="mt-8 p-4 bg-dark-secondary rounded-sm border border-dark-border text-center">
            <p className="text-sm text-gray-400">
              Showing {posts.length} post{posts.length !== 1 ? 's' : ''} for the {plan?.tierName} plan
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlanPostsPage;
