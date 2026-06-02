import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown } from 'lucide-react';
import OperatorSidebar from '../components/OperatorSidebar';
import AdminSidebar from '../components/AdminSidebar';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import '../styles/layouts.css';

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const avatarRef = useRef(null);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  // Close sidebar on mobile when route changes
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Close avatar dropdown on outside click + Escape
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (avatarRef.current && !avatarRef.current.contains(e.target)) {
        setAvatarOpen(false);
      }
    };
    const handleEsc = (e) => { if (e.key === 'Escape') setAvatarOpen(false); };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (name) => name ? name.charAt(0).toUpperCase() : 'A';
  const avatarBg = user?.role === 'admin' ? '#1C1C1E' : '#C9A84C';

  return (
    <div className="dashboard-layout">
      {/* Sidebar Overlay for Mobile */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={toggleSidebar}></div>}

      {/* Role-based Sidebar */}
      {user?.role === 'operator' ? (
        <OperatorSidebar />
      ) : user?.role === 'admin' ? (
        <AdminSidebar />
      ) : null}

      {/* Main View Area */}
      <div className="dashboard-main">
        {/* TopBar — clean, no dead elements */}
        <header className="topbar">
          <div className="topbar-left">
            <button className="menu-btn lg-hidden" onClick={toggleSidebar} aria-label="Toggle sidebar">
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            {/* Page title from role */}
            <span style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '1.1rem', color: '#1C1C1E' }}>
              {user?.role === 'admin' ? 'Admin Panel' : 'Operator Dashboard'}
            </span>
          </div>

          {/* Avatar Dropdown (wired) */}
          <div className="topbar-actions">
            <div ref={avatarRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setAvatarOpen(!avatarOpen)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  background: 'none', border: '1px solid #eaeaea',
                  borderRadius: '40px', padding: '6px 14px 6px 6px',
                  cursor: 'pointer', transition: 'all 0.2s'
                }}
                aria-label="Account menu"
              >
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  background: avatarBg, color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: '0.9rem'
                }}>
                  {getInitials(user?.name)}
                </div>
                <span style={{ fontSize: '0.9rem', fontWeight: 500, color: '#1C1C1E', maxWidth: '120px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                  {user?.name || 'Account'}
                </span>
                <ChevronDown size={14} style={{ color: '#888', transform: avatarOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>

              {/* Dropdown */}
              {avatarOpen && (
                <div style={{
                  position: 'absolute', top: '48px', right: 0,
                  background: '#fff', borderRadius: '12px',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
                  minWidth: '220px', padding: '8px 0',
                  zIndex: 1050,
                  animation: 'agAdminFadeIn 0.15s ease-out'
                }}>
                  {/* User info */}
                  <div style={{ padding: '12px 20px', borderBottom: '1px solid #f0f0f0' }}>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem', color: '#1C1C1E' }}>{user?.name}</p>
                    <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#888' }}>{user?.email}</p>
                    <span style={{
                      display: 'inline-block', marginTop: '6px',
                      fontSize: '0.7rem', padding: '2px 8px',
                      borderRadius: '20px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px',
                      background: user?.role === 'admin' ? 'rgba(28,28,30,0.08)' : 'rgba(201,168,76,0.12)',
                      color: user?.role === 'admin' ? '#1C1C1E' : '#C9A84C'
                    }}>{user?.role}</span>
                  </div>
                  {/* Sign Out */}
                  <button
                    onClick={handleLogout}
                    style={{
                      display: 'block', width: '100%', padding: '12px 20px',
                      background: 'none', border: 'none', textAlign: 'left',
                      cursor: 'pointer', color: '#e3342f', fontWeight: 600,
                      fontSize: '0.9rem', transition: 'background 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#fff5f5'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Dynamic Main View */}
        <main className="dashboard-content">
          <div className="content-container">
            {user?.role === 'operator' && user?.isApproved === false && (
              <div style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #f59e0b', borderRadius: '10px', padding: '12px 14px', marginBottom: '12px', fontWeight: 500 }}>
                Your account is pending admin approval. You can set up your profile but cannot publish tours yet.
              </div>
            )}
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
