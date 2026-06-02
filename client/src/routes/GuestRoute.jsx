import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const GuestRoute = ({ children }) => {
  const { isAuthenticated, isInitializing, user } = useAuth();

  // If globally loading, do nothing (AuthContext handles full-screen spinner)
  if (isInitializing) return null;

  // Reroute active sessions backward out of /login & /register
  if (isAuthenticated && user) {
    if (user.role === 'operator') return <Navigate to="/operator/dashboard" replace />;
    if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    return <Navigate to="/" replace />;
  }

  return children ? children : <Outlet />;
};

export default GuestRoute;
