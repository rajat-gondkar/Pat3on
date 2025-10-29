import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';

const Header = () => {
  const { balances, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="bg-black border-b border-dark-border sticky top-0 z-50 backdrop-blur-sm bg-black/90">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link 
            to={isAuthenticated ? "/dashboard" : "/"} 
            className="text-2xl font-bold text-white hover:text-gray-300 transition-colors"
          >
            Pat3on
          </Link>

          {/* Navigation */}
          <nav className="flex items-center space-x-6">
            {isAuthenticated ? (
              <>
                {/* Balance Display - Top Right */}
                {balances && (
                  <div className="bg-dark-accent px-4 py-2 rounded-full text-xs text-gray-300 border border-dark-border">
                    <span className="font-medium">ETH:</span> {parseFloat(balances.eth).toFixed(4)}
                    <span className="mx-2">|</span>
                    <span className="font-medium">mUSDC:</span> {parseFloat(balances.usdc).toFixed(2)}
                  </div>
                )}
                
                {/* Notification Bell */}
                <NotificationBell />
                
                <Link
                  to="/dashboard"
                  className="text-white hover:text-gray-300 font-medium transition-colors"
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="bg-transparent hover:bg-white/10 border border-white text-white px-5 py-2 font-medium transition-all"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-white hover:text-gray-300 font-medium transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-white hover:bg-gray-200 text-black px-6 py-2 font-medium transition-all"
                >
                  Register
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
