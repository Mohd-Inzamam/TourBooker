import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { LayoutDashboard, Map, PlusCircle, LogOut, ClipboardList, Tag } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import '../styles/layouts.css';

const OperatorSidebar = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    window.location.href = '/login'; // Force clear flush
  };

  return (
    <aside className="sidebar open" style={{ background: 'var(--ag-ivory)', borderRight: '1px solid #eaeaea', width: '260px' }}>
      <div className="sidebar-header" style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '24px', borderBottom: '1px solid #eaeaea' }}>
        <Link to="/operator/dashboard" style={{ textDecoration: 'none', color: 'inherit' }}>
        <h2 style={{ fontFamily: 'var(--ag-font-display)', margin: '0 0 4px 0', fontSize: '1.2rem' }}>
          {user?.name || 'Operator'}
        </h2>
        <span style={{ fontSize: '0.8rem', color: '#666', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Operator Account
        </span>
        </Link>
      </div>

      <nav className="sidebar-nav" style={{ padding: '24px 16px', flex: 1 }}>
        <NavLink 
          to="/operator/dashboard" 
          end
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          style={({ isActive }) => ({
            borderLeft: isActive ? '3px solid var(--ag-gold)' : '3px solid transparent',
            color: isActive ? 'var(--ag-gold)' : 'var(--ag-charcoal)',
            background: isActive ? 'rgba(201, 168, 76, 0.05)' : 'transparent',
            borderRadius: '0 8px 8px 0'
          })}
        >
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </NavLink>

        <NavLink 
          to="/operator/tours" 
          end
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          style={({ isActive }) => ({
            borderLeft: isActive ? '3px solid var(--ag-gold)' : '3px solid transparent',
            color: isActive ? 'var(--ag-gold)' : 'var(--ag-charcoal)',
            background: isActive ? 'rgba(201, 168, 76, 0.05)' : 'transparent',
            borderRadius: '0 8px 8px 0'
          })}
        >
          <Map size={20} />
          <span>My Tours</span>
        </NavLink>

        <NavLink 
          to="/operator/bookings" 
          end
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          style={({ isActive }) => ({
            borderLeft: isActive ? '3px solid var(--ag-gold)' : '3px solid transparent',
            color: isActive ? 'var(--ag-gold)' : 'var(--ag-charcoal)',
            background: isActive ? 'rgba(201, 168, 76, 0.05)' : 'transparent',
            borderRadius: '0 8px 8px 0'
          })}
        >
          <ClipboardList size={20} />
          <span>Bookings</span>
        </NavLink>

        <NavLink 
          to="/operator/pricing" 
          end
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          style={({ isActive }) => ({
            borderLeft: isActive ? '3px solid var(--ag-gold)' : '3px solid transparent',
            color: isActive ? 'var(--ag-gold)' : 'var(--ag-charcoal)',
            background: isActive ? 'rgba(201, 168, 76, 0.05)' : 'transparent',
            borderRadius: '0 8px 8px 0'
          })}
        >
          <Tag size={20} />
          <span>Pricing Rules</span>
        </NavLink>

        <NavLink 
          to="/operator/tours/create" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          style={({ isActive }) => ({
            borderLeft: isActive ? '3px solid var(--ag-gold)' : '3px solid transparent',
            color: isActive ? 'var(--ag-gold)' : 'var(--ag-charcoal)',
            background: isActive ? 'rgba(201, 168, 76, 0.05)' : 'transparent',
            borderRadius: '0 8px 8px 0'
          })}
        >
          <PlusCircle size={20} />
          <span>Create Tour</span>
        </NavLink>
      </nav>

      <div className="sidebar-footer" style={{ padding: '24px 16px', borderTop: '1px solid #eaeaea' }}>
        <button 
          onClick={handleLogout}
          style={{ 
            display: 'flex', alignItems: 'center', gap: '12px', 
            background: 'none', border: 'none', width: '100%', 
            padding: '12px', cursor: 'pointer', color: 'var(--ag-danger)',
            fontSize: '1rem', fontWeight: 500
          }}
        >
          <LogOut size={20} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default OperatorSidebar;
