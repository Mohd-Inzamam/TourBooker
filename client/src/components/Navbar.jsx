import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu as MenuIcon, X, ShoppingCart, MessageSquare } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../context/CartContext';
import { useNotifications } from '../context/NotificationContext';
import { Button } from './Button';
import '../styles/navbar.css';

const Navbar = () => {
  const getLogoDestination = (currentUser) => {
    if (!currentUser) return '/';
    if (currentUser.role === 'admin') return '/admin/dashboard';
    if (currentUser.role === 'operator') return '/operator/dashboard';
    return '/';
  };
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  
  // Safely grab cart hooks, fallback if it hasn't injected bounds
  const cartContext = useCart();
  const cartCount = cartContext?.cartCount || 0;

  const notifications = useNotifications();
  const unreadMessages = notifications?.unreadMessages || 0;

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click + Escape key
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    const handleEsc = (e) => { if (e.key === 'Escape') setDropdownOpen(false); };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, []);

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    setDrawerOpen(false);
    navigate('/login');
  };

  const getInitials = (name) => name ? name.charAt(0).toUpperCase() : 'U';
  const getFirstName = (name) => name ? name.split(' ')[0] : 'User';

  const renderDropdown = () => {
    if (!user) return null;

    if (user.role === 'operator') {
      return (
        <div className={`ag-nav-dropdown ${dropdownOpen ? 'show' : ''}`}>
          <Link to="/profile" className="ag-dropdown-item" onClick={() => setDropdownOpen(false)}>My Profile</Link>
          <Link to="/operator/dashboard" className="ag-dropdown-item" onClick={() => setDropdownOpen(false)}>My Dashboard</Link>
          <Link to="/operator/tours" className="ag-dropdown-item" onClick={() => setDropdownOpen(false)}>My Tours</Link>
          <div className="ag-dropdown-divider"></div>
          <button className="ag-dropdown-item danger" style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer' }} onClick={handleLogout}>Sign Out</button>
        </div>
      );
    }
    if (user.role === 'admin') {
      return (
        <div className={`ag-nav-dropdown ${dropdownOpen ? 'show' : ''}`}>
          <Link to="/profile" className="ag-dropdown-item" onClick={() => setDropdownOpen(false)}>My Profile</Link>
          <Link to="/admin/dashboard" className="ag-dropdown-item" onClick={() => setDropdownOpen(false)}>Admin Panel</Link>
          <div className="ag-dropdown-divider"></div>
          <button className="ag-dropdown-item danger" style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer' }} onClick={handleLogout}>Sign Out</button>
        </div>
      );
    }

    // Default User
    return (
      <div className={`ag-nav-dropdown ${dropdownOpen ? 'show' : ''}`}>
        <Link to="/profile" className="ag-dropdown-item" onClick={() => setDropdownOpen(false)}>My Profile</Link>
        <Link to="/my-bookings" className="ag-dropdown-item" onClick={() => setDropdownOpen(false)}>My Bookings</Link>
        <div className="ag-dropdown-divider"></div>
        <button className="ag-dropdown-item danger" style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer' }} onClick={handleLogout}>Sign Out</button>
      </div>
    );
  };

  const renderRightContent = () => {
    if (!isAuthenticated) {
      return (
        <>
          <Button variant="ghost" onClick={() => navigate('/login')}>Sign In</Button>
          <Button onClick={() => navigate('/register')} style={{ padding: '8px 24px' }}>Get Started</Button>
        </>
      );
    }

    const circleClass = user?.role === 'admin' ? 'charcoal' : 'gold';
    const displayName = user?.role === 'admin' ? 'Admin' : `Hi, ${getFirstName(user?.name)}`;
    const initials = getInitials(user?.name);

    return (
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {isAuthenticated && (
           <button className="ag-nav-link" style={{ position: 'relative', background: 'none', border: 'none', padding: 0, marginRight: user?.role === 'user' ? '20px' : '24px', display: 'flex', alignItems: 'center', cursor: 'pointer', color: 'var(--ag-text-main)' }} onClick={() => navigate('/messages')}>
             <MessageSquare size={24} />
             {unreadMessages > 0 && (
               <span style={{ position: 'absolute', top: '-8px', right: '-8px', background: 'var(--ag-primary)', color: '#fff', fontSize: '0.65rem', minWidth: '18px', height: '18px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                 {unreadMessages}
               </span>
             )}
           </button>
        )}
        {isAuthenticated && user?.role === 'user' && (
           <button className="ag-nav-link" style={{ position: 'relative', background: 'none', border: 'none', padding: 0, marginRight: '24px', display: 'flex', alignItems: 'center', cursor: 'pointer', color: 'var(--ag-text-main)' }} onClick={() => navigate('/cart')}>
             <ShoppingCart size={24} />
             {cartCount > 0 && (
               <span style={{ position: 'absolute', top: '-8px', right: '-8px', background: 'var(--ag-primary)', color: '#fff', fontSize: '0.65rem', minWidth: '18px', height: '18px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                 {cartCount}
               </span>
             )}
           </button>
        )}
        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <button className="ag-avatar-btn" onClick={() => setDropdownOpen(!dropdownOpen)}>
            <p>{displayName}</p>
            <div className={`ag-avatar-circle ${circleClass}`}>{initials}</div>
          </button>
          {renderDropdown()}
        </div>
      </div>
    );
  };

  return (
    <>
      <header className="ag-navbar">
        <Link to={getLogoDestination(user)} className="ag-nav-brand">
          LOXLEY & MARCH • VOYAGES<span className="ag-nav-dot">.</span>
        </Link>

        <div className="ag-nav-center">
          <Link to="/tours" className="ag-nav-link">Explore Tours</Link>
          {isAuthenticated && user?.role === 'user' && (
            <Link to="/my-bookings" className="ag-nav-link">My Bookings</Link>
          )}
        </div>

        <div className="ag-nav-right">
          {renderRightContent()}
        </div>

        <button className="ag-mobile-toggle" onClick={() => setDrawerOpen(true)}>
          <MenuIcon size={24} />
        </button>
      </header>

      {/* Mobile Drawer Overlay */}
      {drawerOpen && <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1999, background: 'rgba(0,0,0,0.5)' }} onClick={() => setDrawerOpen(false)}></div>}

      {/* Mobile Drawer */}
      <div className={`ag-mobile-drawer ${drawerOpen ? 'open' : ''}`}>
        <div className="ag-mobile-drawer-inner">
          <button className="ag-drawer-close" onClick={() => setDrawerOpen(false)}><X size={24} /></button>
          <div className="ag-mobile-links">
            <Link to="/tours" onClick={() => setDrawerOpen(false)}>Explore Tours</Link>
            {isAuthenticated && user?.role === 'user' && (
              <Link to="/my-bookings" onClick={() => setDrawerOpen(false)}>My Bookings</Link>
            )}

            <div style={{ height: '1px', background: '#eaeaea', margin: '16px 0' }}></div>

            {!isAuthenticated ? (
              <>
                <Link to="/login" onClick={() => setDrawerOpen(false)}>Sign In</Link>
                <Link to="/register" onClick={() => setDrawerOpen(false)}>Get Started</Link>
              </>
            ) : (
              <>
                {user.role === 'operator' && (
                  <>
                    <Link to="/operator/dashboard" onClick={() => setDrawerOpen(false)}>My Dashboard</Link>
                    <Link to="/operator/tours" onClick={() => setDrawerOpen(false)}>My Tours</Link>
                  </>
                )}
                {user.role === 'admin' && <Link to="/admin/dashboard" onClick={() => setDrawerOpen(false)}>Admin Panel</Link>}

                <button
                  onClick={handleLogout}
                  style={{ background: 'none', border: 'none', padding: 0, color: 'var(--ag-danger)', fontSize: '1.2rem', fontWeight: 500, textAlign: 'left', cursor: 'pointer', marginTop: '16px' }}
                >
                  Sign Out
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;
