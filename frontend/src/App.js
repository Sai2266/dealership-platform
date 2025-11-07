import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthPage from './AuthPage';
import DealerDashboard from './DealerDashboard';
import UploadPage from './UploadPage';
import DocumentsList from './DocumentsList';

const LoadingScreen = () => <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>;

const ProtectedRoute = ({ element, isLoggedIn }) => isLoggedIn ? element : <Navigate to="/auth" />;

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    setIsLoggedIn(!!token);
    setLoading(false);
  }, []);

  if (loading) return <LoadingScreen />;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<AuthPage setIsLoggedIn={setIsLoggedIn} />} />
        <Route path="/dashboard" element={<ProtectedRoute element={<DealerDashboard />} isLoggedIn={isLoggedIn} />} />
        <Route path="/upload" element={<ProtectedRoute element={<UploadPage />} isLoggedIn={isLoggedIn} />} />
        <Route path="/documents" element={<ProtectedRoute element={<DocumentsList />} isLoggedIn={isLoggedIn} />} />
        <Route path="/" element={<Navigate to={isLoggedIn ? "/dashboard" : "/auth"} />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}