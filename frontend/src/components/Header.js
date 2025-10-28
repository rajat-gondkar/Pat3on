import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Header = () => {
  const { balances, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-dark-secondary border-b border-dark-border backdrop-blur-sm bg-opacity-90 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <span className="text-2xl font-bold text-white tracking-tight">
              Pat3on
            </span>
          </Link>

          {/* Right side */}
          <div className="flex items-center space-x-6">
            {isAuthenticated ? (
              <>
                {/* Wallet Balances - Minimal design */}
                {balances && (
                  <div className="hidden md:flex items-center space-x-4 text-xs text-gray-400 bg-dark-accent px-4 py-2 rounded-lg">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-gray-500">ETH:</span>
                      <span className="font-mono text-gray-300 font-medium">
                        {parseFloat(balances.eth).toFixed(4)}
                      </span>
                    </div>
                    <div className="h-3 w-px bg-dark-border"></div>
                    <div className="flex items-center space-x-1.5">
                      <span className="text-gray-500">mUSDC:</span>
                      <span className="font-mono text-gray-300 font-medium">
                        {parseFloat(balances.usdc).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}

                {/* User menu */}
                <div className="flex items-center space-x-3">
                  <Link
                    to="/dashboard"
                    className="text-gray-400 hover:text-white text-sm font-medium transition-colors"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="bg-dark-accent hover:bg-dark-border text-gray-300 hover:text-white px-4 py-2 rounded-lg text-sm font-medium transition-all"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-gray-400 hover:text-white text-sm font-medium transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-navy-600 hover:bg-navy-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-all shadow-lg hover:shadow-navy-600/20"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
