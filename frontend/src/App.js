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
import MySubscriptionsPage from './pages/MySubscriptionsPage';
import MySubscribersPage from './pages/MySubscribersPage';
import ProfileSettingsPage from './pages/ProfileSettingsPage';
import PaymentHistoryPage from './pages/PaymentHistoryPage';
import WritePostPage from './pages/WritePostPage';
import AnalyticsPage from './pages/AnalyticsPage';
import PlanPostsPage from './pages/PlanPostsPage';

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
            <Route path="/my-subscriptions" element={<MySubscriptionsPage />} />
            <Route path="/my-subscribers" element={<MySubscribersPage />} />
            <Route path="/profile-settings" element={<ProfileSettingsPage />} />
            <Route path="/payment-history" element={<PaymentHistoryPage />} />
            <Route path="/write-post" element={<WritePostPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/plan/:planId/posts" element={<PlanPostsPage />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
