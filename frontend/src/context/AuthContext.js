import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [balances, setBalances] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  const loadUser = React.useCallback(async () => {
    try {
      const response = await authAPI.getMe();
      setUser(response.data.data);
      setBalances(response.data.data.balances);
    } catch (error) {
      console.error('Failed to load user:', error);
      logout();
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (token) {
      loadUser();
    } else {
      setLoading(false);
    }
  }, [token, loadUser]);

  const login = async (credentials) => {
    const response = await authAPI.login(credentials);
    const { token, user, balances } = response.data.data;
    localStorage.setItem('token', token);
    setToken(token);
    setUser(user);
    setBalances(balances);
    return response.data;
  };

  const register = async (userData) => {
    const response = await authAPI.register(userData);
    return response.data; // Contains privateKey - don't store in state!
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setBalances(null);
  };

  const value = {
    user,
    balances,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshBalances: loadUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
