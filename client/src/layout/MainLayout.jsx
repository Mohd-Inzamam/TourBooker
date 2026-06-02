import React from 'react';
import { Outlet, Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Navbar from '../components/Navbar';
import '../styles/layouts.css';

const MainLayout = () => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  const isMessagesPage = location.pathname === '/messages';
  const isAdminOrOperator = user?.role === 'admin' || user?.role === 'operator';
  const shouldHideNavbar = isAdminOrOperator && isMessagesPage;

  if (isAuthenticated && user?.role === 'admin' && !isMessagesPage) return <Navigate to="/admin/dashboard" replace />;
  if (isAuthenticated && user?.role === 'operator' && !isMessagesPage) return <Navigate to="/operator/dashboard" replace />;

  return (
    <div className="main-layout" style={{ paddingTop: shouldHideNavbar ? '0' : '80px' }}>
      {/* Fixed Navbar component handles all global state mapping */}
      {!shouldHideNavbar && <Navbar />}

      {/* Scrollable Content Area */}
      <main className="content-area">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-brand">
            <h2>LOXLEY & MARCH • VOYAGES</h2>
            <p>Your gateway to premium traveling experiences and curated tours.</p>
          </div>
          <div className="footer-links">
            <div>
              <h3>Explore</h3>
              <Link to="/tours">All Tours</Link>
            </div>
            <div>
              <h3>Account</h3>
              <Link to="/login">Sign In</Link>
              <Link to="/register">Register</Link>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} LOXLEY & MARCH • VOYAGES Tours. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
