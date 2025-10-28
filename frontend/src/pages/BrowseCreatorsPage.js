import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const BrowseCreatorsPage = () => {
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCreators();
  }, [search]);

  const fetchCreators = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/author/all?search=${search}`);
      setCreators(response.data.profiles);
    } catch (err) {
      setError('Failed to load creators');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading creators...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black py-12 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Discover Creators</h1>
          <p className="text-gray-400 text-lg mb-8">
            Find and support your favorite creators on Pat3on
          </p>

          {/* Search */}
          <input
            type="text"
            placeholder="Search creators..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-md px-4 py-3 bg-dark-secondary border border-dark-border rounded-sm text-white placeholder-gray-500 focus:outline-none focus:border-white transition-all"
          />
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-sm mb-6">
            {error}
          </div>
        )}

        {/* Creators Grid */}
        {creators.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg">No creators found</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {creators.map((creator) => (
              <Link
                key={creator._id}
                to={`/creator/${creator.userId}`}
                className="bg-dark-secondary border border-dark-border rounded-sm p-6 hover:border-white transition-all group"
              >
                {/* Profile Image */}
                <div className="flex items-center mb-4">
                  <div className="w-16 h-16 bg-dark-accent rounded-full flex items-center justify-center text-2xl mr-4">
                    {creator.profileImage ? (
                      <img
                        src={creator.profileImage}
                        alt={creator.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span>🎨</span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white group-hover:text-gray-300 transition-colors">
                      {creator.name}
                    </h3>
                    <p className="text-gray-400 text-sm">
                      {creator.totalSubscribers} subscribers
                    </p>
                  </div>
                </div>

                {/* Bio */}
                {creator.bio && (
                  <p className="text-gray-400 text-sm mb-4 line-clamp-3">
                    {creator.bio}
                  </p>
                )}

                {/* Plans Count */}
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">
                    {creator.plans?.length || 0} subscription {creator.plans?.length === 1 ? 'tier' : 'tiers'}
                  </span>
                  <span className="text-white group-hover:underline">
                    View Profile →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BrowseCreatorsPage;
