import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import BrowseCreatorsPage from './pages/BrowseCreatorsPage';
import CreatorProfilePage from './pages/CreatorProfilePage';
import CreatePlanPage from './pages/CreatePlanPage';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-dark-primary">
          <Header />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/browse" element={<BrowseCreatorsPage />} />
            <Route path="/creator/:userId" element={<CreatorProfilePage />} />
            <Route path="/create-plan" element={<CreatePlanPage />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
