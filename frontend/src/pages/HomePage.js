import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const HomePage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section - Full Screen */}
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-4xl mx-auto">
          <p className="text-gray-400 text-sm uppercase tracking-wider mb-6">
            WE ARE LAUNCHING OUR PLATFORM SOON.
          </p>
          
          <h1 className="text-7xl md:text-8xl font-bold text-white mb-12 tracking-tight">
            PAT3ON
          </h1>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
            <Link
              to="/register"
              className="bg-white hover:bg-gray-200 text-black px-10 py-4 text-lg font-medium transition-all"
            >
              Register
            </Link>
            <Link
              to="/login"
              className="bg-transparent hover:bg-white/10 text-white border-2 border-white px-10 py-4 text-lg font-medium transition-all"
            >
              Login
            </Link>
          </div>

          <p className="text-gray-400 text-sm mt-8">
            Scroll down to learn more
          </p>
        </div>
      </div>

      {/* Info Section - Revealed on Scroll */}
      <div className="py-24 px-6 bg-gradient-to-b from-black to-dark-secondary">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              The Web3 Creator Economy
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              A blockchain-powered subscription platform that puts creators and supporters in control.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-12 mb-24">
            <div className="text-center">
              <div className="text-5xl mb-6">🔐</div>
              <h3 className="text-xl font-semibold text-white mb-4">
                Your Wallet, Your Keys
              </h3>
              <p className="text-gray-400">
                Full control and ownership of your crypto wallet and funds.
              </p>
            </div>

            <div className="text-center">
              <div className="text-5xl mb-6">💰</div>
              <h3 className="text-xl font-semibold text-white mb-4">
                Lower Fees
              </h3>
              <p className="text-gray-400">
                Blockchain eliminates middlemen, more money goes to creators.
              </p>
            </div>

            <div className="text-center">
              <div className="text-5xl mb-6">🌍</div>
              <h3 className="text-xl font-semibold text-white mb-4">
                Global Access
              </h3>
              <p className="text-gray-400">
                Support creators worldwide with cryptocurrency. No bank required.
              </p>
            </div>
          </div>

          {/* How It Works */}
          <div className="mb-24">
            <h2 className="text-3xl font-bold text-white text-center mb-16">
              How It Works
            </h2>
            <div className="grid md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="bg-white text-black w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-6 text-xl font-bold">
                  1
                </div>
                <h4 className="text-white font-semibold mb-3">Sign Up</h4>
                <p className="text-gray-400 text-sm">
                  Create your account with email and password
                </p>
              </div>
              <div className="text-center">
                <div className="bg-white text-black w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-6 text-xl font-bold">
                  2
                </div>
                <h4 className="text-white font-semibold mb-3">Get Your Wallet</h4>
                <p className="text-gray-400 text-sm">
                  We create a secure crypto wallet for you automatically
                </p>
              </div>
              <div className="text-center">
                <div className="bg-white text-black w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-6 text-xl font-bold">
                  3
                </div>
                <h4 className="text-white font-semibold mb-3">Add Funds</h4>
                <p className="text-gray-400 text-sm">
                  Get test tokens and deposit to your wallet
                </p>
              </div>
              <div className="text-center">
                <div className="bg-white text-black w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-6 text-xl font-bold">
                  4
                </div>
                <h4 className="text-white font-semibold mb-3">Subscribe</h4>
                <p className="text-gray-400 text-sm">
                  Find creators and support them with subscriptions
                </p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center py-16 border-t border-dark-border">
            <h2 className="text-3xl font-bold text-white mb-6">
              Ready to Get Started?
            </h2>
            <Link
              to="/register"
              className="inline-block bg-white hover:bg-gray-200 text-black px-12 py-4 text-lg font-medium transition-all"
            >
              Create Free Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
