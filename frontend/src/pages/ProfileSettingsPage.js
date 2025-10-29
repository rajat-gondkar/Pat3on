import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const ProfileSettingsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    profileImage: '',
    socialLinks: {
      twitter: '',
      instagram: '',
      youtube: '',
      website: ''
    }
  });

  useEffect(() => {
    // Redirect if not an author
    if (user && user.role !== 'author') {
      navigate('/dashboard');
      return;
    }

    fetchProfile();
  }, [user, navigate]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get('/author/my-profile');
      const profile = response.data.profile;

      setFormData({
        name: profile.name || '',
        bio: profile.bio || '',
        profileImage: profile.profileImage || '',
        socialLinks: {
          twitter: profile.socialLinks?.twitter || '',
          instagram: profile.socialLinks?.instagram || '',
          youtube: profile.socialLinks?.youtube || '',
          website: profile.socialLinks?.website || ''
        }
      });
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err.response?.data?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSocialLinkChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [name]: value
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);

    try {
      // Validate required fields
      if (!formData.name.trim()) {
        setError('Name is required');
        setSaving(false);
        return;
      }

      await api.put('/author/profile', formData);

      setSuccess('Profile updated successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-gray-400">Loading profile settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link to="/dashboard" className="text-gray-400 hover:text-white mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-4xl font-bold mb-2">Profile Settings</h1>
          <p className="text-gray-400">Manage your public author profile</p>
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
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-dark-secondary rounded-sm border border-dark-border p-6">
            <h2 className="text-xl font-semibold mb-4">Basic Information</h2>

            <div className="space-y-4">
              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                  Display Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-dark-primary border border-dark-border rounded-sm text-white focus:outline-none focus:border-white transition-colors"
                  placeholder="Your display name"
                  required
                />
                <p className="text-xs text-gray-400 mt-1">
                  This is how your name appears to subscribers
                </p>
              </div>

              {/* Bio */}
              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-gray-300 mb-2">
                  Bio
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  rows="4"
                  className="w-full px-4 py-2 bg-dark-primary border border-dark-border rounded-sm text-white focus:outline-none focus:border-white transition-colors resize-none"
                  placeholder="Tell your audience about yourself..."
                />
                <p className="text-xs text-gray-400 mt-1">
                  A brief description of what you create
                </p>
              </div>

              {/* Profile Image */}
              <div>
                <label htmlFor="profileImage" className="block text-sm font-medium text-gray-300 mb-2">
                  Profile Image URL
                </label>
                <input
                  type="url"
                  id="profileImage"
                  name="profileImage"
                  value={formData.profileImage}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-dark-primary border border-dark-border rounded-sm text-white focus:outline-none focus:border-white transition-colors"
                  placeholder="https://example.com/image.jpg"
                />
                <p className="text-xs text-gray-400 mt-1">
                  URL to your profile picture (optional)
                </p>
                {formData.profileImage && (
                  <div className="mt-3">
                    <p className="text-xs text-gray-400 mb-2">Preview:</p>
                    <img
                      src={formData.profileImage}
                      alt="Profile preview"
                      className="w-24 h-24 rounded-full object-cover border-2 border-dark-border"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div className="bg-dark-secondary rounded-sm border border-dark-border p-6">
            <h2 className="text-xl font-semibold mb-4">Social Links</h2>
            <p className="text-gray-400 text-sm mb-4">
              Connect your social media accounts (all optional)
            </p>

            <div className="space-y-4">
              {/* Twitter */}
              <div>
                <label htmlFor="twitter" className="block text-sm font-medium text-gray-300 mb-2">
                  <span className="inline-block w-5">🐦</span> Twitter
                </label>
                <input
                  type="url"
                  id="twitter"
                  name="twitter"
                  value={formData.socialLinks.twitter}
                  onChange={handleSocialLinkChange}
                  className="w-full px-4 py-2 bg-dark-primary border border-dark-border rounded-sm text-white focus:outline-none focus:border-white transition-colors"
                  placeholder="https://twitter.com/username"
                />
              </div>

              {/* Instagram */}
              <div>
                <label htmlFor="instagram" className="block text-sm font-medium text-gray-300 mb-2">
                  <span className="inline-block w-5">📷</span> Instagram
                </label>
                <input
                  type="url"
                  id="instagram"
                  name="instagram"
                  value={formData.socialLinks.instagram}
                  onChange={handleSocialLinkChange}
                  className="w-full px-4 py-2 bg-dark-primary border border-dark-border rounded-sm text-white focus:outline-none focus:border-white transition-colors"
                  placeholder="https://instagram.com/username"
                />
              </div>

              {/* YouTube */}
              <div>
                <label htmlFor="youtube" className="block text-sm font-medium text-gray-300 mb-2">
                  <span className="inline-block w-5">▶️</span> YouTube
                </label>
                <input
                  type="url"
                  id="youtube"
                  name="youtube"
                  value={formData.socialLinks.youtube}
                  onChange={handleSocialLinkChange}
                  className="w-full px-4 py-2 bg-dark-primary border border-dark-border rounded-sm text-white focus:outline-none focus:border-white transition-colors"
                  placeholder="https://youtube.com/c/channel"
                />
              </div>

              {/* Website */}
              <div>
                <label htmlFor="website" className="block text-sm font-medium text-gray-300 mb-2">
                  <span className="inline-block w-5">🌐</span> Website
                </label>
                <input
                  type="url"
                  id="website"
                  name="website"
                  value={formData.socialLinks.website}
                  onChange={handleSocialLinkChange}
                  className="w-full px-4 py-2 bg-dark-primary border border-dark-border rounded-sm text-white focus:outline-none focus:border-white transition-colors"
                  placeholder="https://yourwebsite.com"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-white text-black px-6 py-3 rounded-sm font-semibold hover:bg-gray-200 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <Link
              to="/dashboard"
              className="px-6 py-3 border border-dark-border rounded-sm font-semibold hover:border-white transition-colors text-center"
            >
              Cancel
            </Link>
          </div>
        </form>

        {/* Account Info */}
        <div className="mt-8 p-4 bg-dark-secondary rounded-sm border border-dark-border">
          <h3 className="text-sm font-semibold text-gray-400 mb-2">Account Information</h3>
          <p className="text-sm text-gray-500">
            Email: <span className="text-white">{user?.email}</span>
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Role: <span className="text-white capitalize">{user?.role}</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettingsPage;
