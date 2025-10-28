import React from 'react';
import { Link } from 'react-router-dom';

const HomePage = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-20">
          <h1 className="text-6xl md:text-7xl font-bold text-white mb-6 tracking-tight">
            Welcome to <span className="text-navy-500">Pat3on</span>
          </h1>
          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            The Web3 subscription platform that empowers creators and gives users true
            ownership. Built on blockchain technology.
          </p>
          <div className="flex justify-center space-x-4">
            <Link
              to="/register"
              className="bg-navy-600 hover:bg-navy-700 text-white px-8 py-4 rounded-lg font-semibold transition-all text-lg shadow-xl hover:shadow-navy-600/30"
            >
              Get Started
            </Link>
            <Link
              to="/login"
              className="bg-dark-secondary hover:bg-dark-accent border border-dark-border text-white px-8 py-4 rounded-lg font-semibold transition-all text-lg"
            >
              Login
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mt-24">
          <div className="bg-dark-secondary rounded-xl p-8 border border-dark-border hover:border-navy-600 transition-all group">
            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">🔐</div>
            <h3 className="text-xl font-semibold text-white mb-3">
              Your Wallet, Your Keys
            </h3>
            <p className="text-gray-400 leading-relaxed">
              We create a secure wallet for you and give you the private key. You have
              full control and ownership.
            </p>
          </div>

          <div className="bg-dark-secondary rounded-xl p-8 border border-dark-border hover:border-navy-600 transition-all group">
            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">💰</div>
            <h3 className="text-xl font-semibold text-white mb-3">Lower Fees</h3>
            <p className="text-gray-400 leading-relaxed">
              Blockchain technology eliminates middlemen, meaning more money goes to
              creators you love.
            </p>
          </div>

          <div className="bg-dark-secondary rounded-xl p-8 border border-dark-border hover:border-navy-600 transition-all group">
            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">🌍</div>
            <h3 className="text-xl font-semibold text-white mb-3">Global Access</h3>
            <p className="text-gray-400 leading-relaxed">
              Support creators from anywhere in the world with cryptocurrency. No bank
              required.
            </p>
          </div>
        </div>

        {/* How It Works */}
        <div className="mt-32">
          <h2 className="text-4xl font-bold text-white text-center mb-16">
            How It Works
          </h2>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-navy-600 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5 text-white font-bold text-xl shadow-lg">
                1
              </div>
              <h4 className="text-white font-semibold mb-3 text-lg">Sign Up</h4>
              <p className="text-gray-400 text-sm leading-relaxed">
                Create your account with email and password
              </p>
            </div>
            <div className="text-center">
              <div className="bg-navy-600 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5 text-white font-bold text-xl shadow-lg">
                2
              </div>
              <h4 className="text-white font-semibold mb-3 text-lg">Get Your Wallet</h4>
              <p className="text-gray-400 text-sm leading-relaxed">
                We automatically create a secure crypto wallet for you
              </p>
            </div>
            <div className="text-center">
              <div className="bg-navy-600 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5 text-white font-bold text-xl shadow-lg">
                3
              </div>
              <h4 className="text-white font-semibold mb-3 text-lg">Add Funds</h4>
              <p className="text-gray-400 text-sm leading-relaxed">
                Get test tokens and deposit to your wallet
              </p>
            </div>
            <div className="text-center">
              <div className="bg-navy-600 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5 text-white font-bold text-xl shadow-lg">
                4
              </div>
              <h4 className="text-white font-semibold mb-3 text-lg">Subscribe</h4>
              <p className="text-gray-400 text-sm leading-relaxed">
                Find creators and support them with subscriptions
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-32 text-center bg-dark-secondary rounded-2xl p-16 border border-dark-border">
          <h2 className="text-4xl font-bold text-white mb-5">
            Ready to Join the Web3 Creator Economy?
          </h2>
          <p className="text-gray-400 mb-8 text-lg max-w-2xl mx-auto">
            Start your journey on Pat3on today. No crypto knowledge required.
          </p>
          <Link
            to="/register"
            className="inline-block bg-navy-600 hover:bg-navy-700 text-white px-10 py-4 rounded-lg font-semibold transition-all text-lg shadow-xl hover:shadow-navy-600/30"
          >
            Create Free Account →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
