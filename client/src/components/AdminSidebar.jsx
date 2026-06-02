import React from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import { LayoutDashboard, Building2, Users, Map, LogOut, Ticket } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import '../styles/layouts.css';

const NAV_ITEMS = [
  { label: 'Overview',  path: '/admin/dashboard', icon: <LayoutDashboard size={20} />, end: true },
  { label: 'Operators', path: '/admin/operators',  icon: <Building2 size={20} /> },
  { label: 'Users',     path: '/admin/users',      icon: <Users size={20} /> },
  { label: 'Tours',     path: '/admin/tours',      icon: <Map size={20} /> },
  { label: 'Promotions',path: '/admin/promotions', icon: <Ticket size={20} /> }
];

const AdminSidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside style={{
      width: '260px', minHeight: '100vh', background: 'var(--ag-ivory, #FDFAF5)',
      borderRight: '1px solid #eaeaea', display: 'flex', flexDirection: 'column',
      flexShrink: 0
    }}>
      {/* Top */}
      <div style={{ padding: '28px 24px', borderBottom: '1px solid #eaeaea' }}>
        <Link to="/admin/dashboard" style={{ textDecoration: 'none' }}>
        <p style={{
          margin: '0 0 6px', fontSize: '0.7rem', fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--ag-gold, #C9A84C)'
        }}>Admin Panel</p>
        <h2 style={{
          margin: 0, fontFamily: 'Playfair Display, serif',
          fontSize: '1.15rem', color: 'var(--ag-charcoal, #1C1C1E)'
        }}>
          {user?.name || 'Administrator'}
        </h2>
        </Link>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '20px 12px' }}>
        {NAV_ITEMS.map(({ label, path, icon, end }) => (
          <NavLink
            key={path}
            to={path}
            end={end}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            style={({ isActive }) => ({
              borderLeft: isActive ? '3px solid var(--ag-gold)' : '3px solid transparent',
              color: isActive ? 'var(--ag-gold, #C9A84C)' : 'var(--ag-charcoal, #1C1C1E)',
              background: isActive ? 'rgba(201,168,76,0.06)' : 'transparent',
              borderRadius: '0 8px 8px 0',
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '10px 16px', textDecoration: 'none',
              fontWeight: 500, marginBottom: '4px', transition: 'all 0.2s'
            })}
          >
            {icon} <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div style={{ padding: '16px 12px', borderTop: '1px solid #eaeaea' }}>
        <button
          onClick={handleLogout}
          style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            width: '100%', background: 'none', border: 'none',
            padding: '10px 16px', cursor: 'pointer',
            color: 'var(--ag-danger, #e3342f)', fontSize: '0.95rem', fontWeight: 500
          }}
        >
          <LogOut size={18} /> Sign Out
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
