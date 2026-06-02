import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { updateProfile, changePassword } from '../services/auth.service';
import { Button, FormInput, FormError } from '../components';
import { parseApiErrors } from '../utils/formErrors';
import '../styles/profile.css';

/* ── Helpers ─────────────────────────────────────────────── */
const getInitials = (name = '') => {
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0][0]?.toUpperCase() || 'U';
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
};

const ROLE_LABEL = { user: 'Traveller', operator: 'Operator', admin: 'Administrator' };
const ROLE_CLASS = { user: '--user', operator: '--operator', admin: '--admin' };

/* ── Password strength calculator ───────────────────────── */
const getStrength = (pwd) => {
  if (!pwd) return null;
  const hasLower  = /[a-z]/.test(pwd);
  const hasUpper  = /[A-Z]/.test(pwd);
  const hasDigit  = /\d/.test(pwd);
  const hasSymbol = /[^a-zA-Z0-9]/.test(pwd);
  const score     = [pwd.length >= 8, hasLower, hasUpper, hasDigit, hasSymbol].filter(Boolean).length;
  if (score <= 2) return { label: 'Weak',   cls: 'weak',   width: '33%'  };
  if (score <= 3) return { label: 'Fair',   cls: 'fair',   width: '66%'  };
  return            { label: 'Strong', cls: 'strong', width: '100%' };
};

/* ── Quick link rows ─────────────────────────────────────── */
const QUICK_LINKS = {
  user: [
    { icon: '📅', label: 'My Bookings', to: '/my-bookings' },
    { icon: '🗺️', label: 'Explore Tours', to: '/tours' },
  ],
  operator: [
    { icon: '📊', label: 'My Dashboard', to: '/operator/dashboard' },
    { icon: '🗺️', label: 'My Tours', to: '/operator/tours' },
    { icon: '➕', label: 'Create New Tour', to: '/operator/tours/create' },
  ],
  admin: [
    { icon: '⚙️', label: 'Admin Dashboard', to: '/admin/dashboard' },
    { icon: '👥', label: 'Manage Users', to: '/admin/users' },
  ],
};

/* ════════════════════════════════════════════════════════════
   ProfilePage
   ════════════════════════════════════════════════════════════ */
const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, setUser, logout } = useAuth();

  /* ── Profile edit state ─────────────────────────────── */
  const [editMode, setEditMode]         = useState(false);
  const [editName, setEditName]         = useState('');
  const [editEmail, setEditEmail]       = useState('');
  const [editLoading, setEditLoading]   = useState(false);
  const [editGeneralErr, setEditGeneralErr] = useState('');
  const [editSuccess, setEditSuccess]   = useState('');
  const [editFieldErrs, setEditFieldErrs] = useState({});

  /* ── Password state ─────────────────────────────────── */
  const [pwdCurrent, setPwdCurrent]         = useState('');
  const [pwdNew, setPwdNew]                 = useState('');
  const [pwdConfirm, setPwdConfirm]         = useState('');
  const [pwdLoading, setPwdLoading]         = useState(false);
  const [pwdGeneralErr, setPwdGeneralErr]   = useState('');
  const [pwdSuccess, setPwdSuccess]         = useState('');
  const [pwdFieldErrs, setPwdFieldErrs]     = useState({});

  /* ── Activity stats ─────────────────────────────────── */
  const [stats, setStats]       = useState({ bookings: null, reviews: null });
  const [statsLoading, setStatsLoading] = useState(false);

  /* ── Danger zone modal ──────────────────────────────── */
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteInput, setDeleteInput]         = useState('');
  const [deleteToast, setDeleteToast]         = useState('');

  /* ── Redirect if not logged in ──────────────────────── */
  useEffect(() => {
    if (!user) navigate('/login', { replace: true });
  }, [user, navigate]);

  /* ── Pre-fill edit fields when user changes ─────────── */
  useEffect(() => {
    if (user) { setEditName(user.name || ''); setEditEmail(user.email || ''); }
  }, [user]);

  /* ── Fetch activity stats (non-blocking, best-effort) ── */
  useEffect(() => {
    if (!user) return;
    if (user.role === 'user') {
      setStatsLoading(true);
      Promise.all([
        fetch('/api/bookings/my-bookings', {
          headers: { Authorization: `Bearer ${localStorage.getItem('ag_token')}` }
        }).then(r => r.json()).then(d => (d.data?.bookings || d.data || []).length).catch(() => null),
        fetch('/api/reviews/my-reviews', {  // best-effort — may not exist yet
          headers: { Authorization: `Bearer ${localStorage.getItem('ag_token')}` }
        }).then(r => r.json()).then(d => (d.data?.reviews || d.data || []).length).catch(() => null)
      ]).then(([bookings, reviews]) => {
        setStats({ bookings, reviews });
        setStatsLoading(false);
      });
    }
    if (user.role === 'operator') {
      setStatsLoading(true);
      fetch('/api/analytics/dashboard', {
        headers: { Authorization: `Bearer ${localStorage.getItem('ag_token')}` }
      })
        .then(r => r.json())
        .then(d => {
          const data = d.data || d;
          setStats({ tours: data.totalTours ?? null, bookings: data.totalBookings ?? null });
        })
        .catch(() => setStats({ tours: null, bookings: null }))
        .finally(() => setStatsLoading(false));
    }
  }, [user]);

  /* ── Profile edit handlers ──────────────────────────── */
  const handleEditOpen = () => {
    setEditMode(true);
    setEditGeneralErr(''); setEditSuccess(''); setEditFieldErrs({});
    setEditName(user?.name || ''); setEditEmail(user?.email || '');
  };

  const handleEditCancel = () => {
    setEditMode(false); setEditGeneralErr(''); setEditFieldErrs({});
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!editName.trim())              errs.name  = 'Name is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editEmail)) errs.email = 'Enter a valid email address.';
    if (Object.keys(errs).length) { setEditFieldErrs(errs); return; }

    setEditLoading(true); setEditGeneralErr(''); setEditFieldErrs({});
    try {
      const res = await updateProfile({ name: editName.trim(), email: editEmail.trim() });
      const updated = res.data?.user || res.user;
      if (updated && setUser) setUser(prev => ({ ...prev, ...updated }));
      setEditSuccess('Profile updated successfully');
      setEditMode(false);
      setTimeout(() => setEditSuccess(''), 4000);
    } catch (err) {
      const { general, fields } = parseApiErrors(err);
      setEditFieldErrs(fields);
      setEditGeneralErr(general || 'Failed to update profile. Please try again.');
    } finally {
      setEditLoading(false);
    }
  };

  /* ── Password handlers ──────────────────────────────── */
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!pwdCurrent)            errs.current = 'Current password is required.';
    if (pwdNew.length < 8)      errs.newPwd  = 'New password must be at least 8 characters.';
    if (pwdNew !== pwdConfirm)  errs.confirm = 'Passwords do not match.';
    if (Object.keys(errs).length) { setPwdFieldErrs(errs); return; }

    setPwdLoading(true); setPwdGeneralErr(''); setPwdFieldErrs({});
    try {
      await changePassword({ currentPassword: pwdCurrent, newPassword: pwdNew });
      setPwdSuccess('Password updated successfully');
      setPwdCurrent(''); setPwdNew(''); setPwdConfirm('');
      setTimeout(() => setPwdSuccess(''), 4000);
    } catch (err) {
      const { general, fields } = parseApiErrors(err);
      setPwdFieldErrs(fields);
      setPwdGeneralErr(general || 'Failed to update password. Please try again.');
    } finally {
      setPwdLoading(false);
    }
  };

  /* ── Delete account handler (cosmetic) ──────────────── */
  const handleDeleteRequest = () => {
    setDeleteToast('Account deletion is not available yet. Please contact support.');
    setShowDeleteModal(false);
    setDeleteInput('');
    setTimeout(() => setDeleteToast(''), 5000);
  };

  if (!user) return null;

  const initials    = getInitials(user.name);
  const roleLabel   = ROLE_LABEL[user.role] || user.role;
  const roleCls     = ROLE_CLASS[user.role] || '';
  const memberSince = formatDate(user.createdAt);
  const strength    = getStrength(pwdNew);
  const quickLinks  = QUICK_LINKS[user.role] || QUICK_LINKS.user;

  /* ── Render ─────────────────────────────────────────── */
  return (
    <div>
      {/* ── HERO ─────────────────────────────────────── */}
      <div className="ag-profile-hero">
        <div className="ag-profile-avatar" aria-hidden="true">
          <span className="ag-profile-avatar-initials">{initials}</span>
        </div>
        <h1 className="ag-profile-name">{user.name}</h1>
        <p className="ag-profile-email-text">{user.email}</p>
        <span className={`ag-profile-role-badge ag-profile-role-badge${roleCls}`}>{roleLabel}</span>
        <p className="ag-profile-member-since">Member since {memberSince}</p>
      </div>

      {/* ── MAIN CONTENT ─────────────────────────────── */}
      <div className="ag-profile-main">

        {/* ── Global success toast (profile save) */}
        {editSuccess && (
          <div className="ag-profile-success-msg">
            <span>✓</span><span>{editSuccess}</span>
          </div>
        )}

        {/* ── Delete account toast */}
        {deleteToast && (
          <div className="ag-profile-success-msg" style={{ background: '#fff3cd', color: '#856404', border: '1px solid #ffc107' }}>
            <span>ℹ️</span><span>{deleteToast}</span>
          </div>
        )}

        {/* ─────────────────────────────────────────────────
            CARD 1: Personal Information
        ───────────────────────────────────────────────── */}
        <div className="ag-profile-card">
          <div className="ag-profile-card-header">
            <div>
              <h2 className="ag-profile-card-title">Personal Information</h2>
            </div>
            {!editMode && (
              <button className="ag-edit-btn" onClick={handleEditOpen} aria-label="Edit profile">
                ✏️ Edit
              </button>
            )}
            {editMode && (
              <button className="ag-edit-btn" onClick={handleEditCancel}>✕ Cancel</button>
            )}
          </div>

          {/* ── View mode */}
          {!editMode && (
            <>
              <div className="ag-profile-info-row">
                <span className="ag-profile-info-label">Full Name</span>
                <span className="ag-profile-info-value">{user.name}</span>
              </div>
              <div className="ag-profile-info-row">
                <span className="ag-profile-info-label">Email Address</span>
                <span className="ag-profile-info-value">{user.email}</span>
              </div>
              <div className="ag-profile-info-row">
                <span className="ag-profile-info-label">Account Role</span>
                <span className={`ag-profile-role-badge ag-profile-role-badge${roleCls}`} style={{ marginTop: '4px' }}>{roleLabel}</span>
              </div>
              <div className="ag-profile-info-row">
                <span className="ag-profile-info-label">Member Since</span>
                <span className="ag-profile-info-value">{memberSince}</span>
              </div>
            </>
          )}

          {/* ── Edit mode */}
          {editMode && (
            <form onSubmit={handleEditSave} noValidate>
              <div style={{ marginBottom: '16px' }}>
                <FormInput
                  id="profile-name"
                  label="Full Name"
                  type="text"
                  value={editName}
                  onChange={e => { setEditName(e.target.value); setEditFieldErrs(p => ({ ...p, name: '' })); setEditGeneralErr(''); }}
                  disabled={editLoading}
                  required
                />
                {editFieldErrs.name && <FormError message={editFieldErrs.name} />}
              </div>
              <div style={{ marginBottom: '16px' }}>
                <FormInput
                  id="profile-email"
                  label="Email Address"
                  type="email"
                  value={editEmail}
                  onChange={e => { setEditEmail(e.target.value); setEditFieldErrs(p => ({ ...p, email: '' })); setEditGeneralErr(''); }}
                  disabled={editLoading}
                  required
                />
                {editFieldErrs.email && <FormError message={editFieldErrs.email} />}
              </div>

              {editGeneralErr && <FormError message={editGeneralErr} type="general" />}

              <div className="ag-profile-edit-actions">
                <Button type="submit" isLoading={editLoading} disabled={editLoading}>
                  Save Changes
                </Button>
                <Button type="button" variant="ghost" onClick={handleEditCancel} disabled={editLoading}>
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </div>

        {/* ─────────────────────────────────────────────────
            CARD 2: Security / Change Password
        ───────────────────────────────────────────────── */}
        <div className="ag-profile-card">
          <div className="ag-profile-card-header">
            <div>
              <h2 className="ag-profile-card-title">Security</h2>
              <p className="ag-profile-card-subtitle">Keep your account secure</p>
            </div>
          </div>

          {pwdSuccess && (
            <div className="ag-profile-success-msg" style={{ marginBottom: '16px' }}>
              <span>✓</span><span>{pwdSuccess}</span>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} noValidate>
            <div style={{ marginBottom: '16px' }}>
              <FormInput
                id="pwd-current"
                label="Current Password"
                type="password"
                value={pwdCurrent}
                onChange={e => { setPwdCurrent(e.target.value); setPwdFieldErrs(p => ({ ...p, current: '' })); setPwdGeneralErr(''); }}
                disabled={pwdLoading}
                placeholder="Enter current password"
                required
              />
              {pwdFieldErrs.current && <FormError message={pwdFieldErrs.current} />}
            </div>

            <div style={{ marginBottom: '16px' }}>
              <FormInput
                id="pwd-new"
                label="New Password"
                type="password"
                value={pwdNew}
                onChange={e => { setPwdNew(e.target.value); setPwdFieldErrs(p => ({ ...p, newPwd: '' })); setPwdGeneralErr(''); }}
                disabled={pwdLoading}
                placeholder="Min 8 characters"
                required
              />
              {/* Strength indicator */}
              {pwdNew && strength && (
                <div className="ag-password-strength-wrap">
                  <div className="ag-password-strength-track">
                    <div
                      className={`ag-password-strength-bar ag-password-strength-bar--${strength.cls}`}
                      style={{ width: strength.width }}
                    />
                  </div>
                  <span className={`ag-password-strength-label ag-password-strength-label--${strength.cls}`}>
                    {strength.label}
                  </span>
                </div>
              )}
              {pwdFieldErrs.newPwd && <FormError message={pwdFieldErrs.newPwd} />}
            </div>

            <div style={{ marginBottom: '20px' }}>
              <FormInput
                id="pwd-confirm"
                label="Confirm New Password"
                type="password"
                value={pwdConfirm}
                onChange={e => { setPwdConfirm(e.target.value); setPwdFieldErrs(p => ({ ...p, confirm: '' })); setPwdGeneralErr(''); }}
                disabled={pwdLoading}
                placeholder="Re-enter new password"
                required
              />
              {pwdFieldErrs.confirm && <FormError message={pwdFieldErrs.confirm} />}
            </div>

            {pwdGeneralErr && <FormError message={pwdGeneralErr} type="general" />}

            <Button type="submit" isLoading={pwdLoading} disabled={pwdLoading} style={{ width: '100%' }}>
              Update Password
            </Button>
          </form>
        </div>

        {/* ─────────────────────────────────────────────────
            CARD 3: Account Activity
        ───────────────────────────────────────────────── */}
        <div className="ag-profile-card">
          <div className="ag-profile-card-header" style={{ marginBottom: 0 }}>
            <h2 className="ag-profile-card-title">Account Activity</h2>
          </div>

          <div className="ag-activity-stats" style={{ marginTop: '24px' }}>
            {user.role === 'user' && (
              <>
                <div className="ag-activity-stat">
                  {statsLoading ? <div className="ag-activity-stat-skel" /> : (
                    <span className="ag-activity-stat-number">{stats.bookings ?? '—'}</span>
                  )}
                  <span className="ag-activity-stat-label">Bookings</span>
                </div>
                <div className="ag-activity-stat">
                  {statsLoading ? <div className="ag-activity-stat-skel" /> : (
                    <span className="ag-activity-stat-number">{stats.reviews ?? '—'}</span>
                  )}
                  <span className="ag-activity-stat-label">Reviews</span>
                </div>
                <div className="ag-activity-stat">
                  <span className="ag-activity-stat-number" style={{ fontSize: '1.1rem' }}>{memberSince}</span>
                  <span className="ag-activity-stat-label">Member Since</span>
                </div>
              </>
            )}

            {user.role === 'operator' && (
              <>
                <div className="ag-activity-stat">
                  {statsLoading ? <div className="ag-activity-stat-skel" /> : (
                    <span className="ag-activity-stat-number">{stats.tours ?? '—'}</span>
                  )}
                  <span className="ag-activity-stat-label">Total Tours</span>
                </div>
                <div className="ag-activity-stat">
                  {statsLoading ? <div className="ag-activity-stat-skel" /> : (
                    <span className="ag-activity-stat-number">{stats.bookings ?? '—'}</span>
                  )}
                  <span className="ag-activity-stat-label">Total Bookings</span>
                </div>
                <div className="ag-activity-stat">
                  <span className="ag-activity-stat-number" style={{ fontSize: '1rem' }}>{memberSince}</span>
                  <span className="ag-activity-stat-label">Member Since</span>
                </div>
              </>
            )}

            {user.role === 'admin' && (
              <>
                <div className="ag-activity-stat" style={{ gridColumn: '1 / -1' }}>
                  <span className="ag-activity-stat-number" style={{ fontSize: '1rem' }}>{memberSince}</span>
                  <span className="ag-activity-stat-label">Member Since</span>
                </div>
                <div className="ag-activity-stat" style={{ gridColumn: '1 / -1' }}>
                  <span className="ag-activity-stat-number" style={{ fontSize: '0.9rem', color: '#1C1C1E' }}>Administrator Account</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ─────────────────────────────────────────────────
            CARD 4: Quick Links
        ───────────────────────────────────────────────── */}
        <div className="ag-profile-card">
          <div className="ag-profile-card-header">
            <h2 className="ag-profile-card-title">Quick Actions</h2>
          </div>
          <ul className="ag-quick-links-list">
            {quickLinks.map(({ icon, label, to }) => (
              <li key={to}>
                <Link to={to} className="ag-quick-link">
                  <div className="ag-quick-link-left">
                    <div className="ag-quick-link-icon" aria-hidden="true">{icon}</div>
                    <span>{label}</span>
                  </div>
                  <span className="ag-quick-link-chevron">›</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* ─────────────────────────────────────────────────
            DANGER ZONE
        ───────────────────────────────────────────────── */}
        <div className="ag-danger-zone">
          <div className="ag-danger-zone-header">
            <h2 className="ag-danger-zone-title">Danger Zone</h2>
            <p className="ag-danger-zone-subtitle">Irreversible and destructive actions</p>
          </div>
          <div className="ag-danger-row">
            <div className="ag-danger-text">
              <p>Delete Account</p>
              <small>Permanently delete your account and all associated data.</small>
            </div>
            <Button
              variant="ghost"
              onClick={() => setShowDeleteModal(true)}
              style={{ color: '#e3342f', border: '1.5px solid #e3342f', whiteSpace: 'nowrap' }}
            >
              Delete Account
            </Button>
          </div>
        </div>
      </div>

      {/* ── Delete Confirmation Modal ─────────────────── */}
      {showDeleteModal && (
        <div
          className="ag-profile-modal-overlay"
          onClick={e => { if (e.target === e.currentTarget) setShowDeleteModal(false); }}
        >
          <div className="ag-profile-modal">
            <h3>Are you absolutely sure?</h3>
            <p>
              This action cannot be undone. All your data will be permanently deleted.
              Please type your email address to confirm.
            </p>
            <FormInput
              id="delete-confirm-email"
              label="Type your email to confirm"
              type="email"
              value={deleteInput}
              onChange={e => setDeleteInput(e.target.value)}
              placeholder={user.email}
            />
            <div className="ag-profile-modal-actions" style={{ marginTop: '20px' }}>
              <Button variant="ghost" onClick={() => { setShowDeleteModal(false); setDeleteInput(''); }} style={{ flex: 1 }}>
                Cancel
              </Button>
              <Button
                onClick={handleDeleteRequest}
                disabled={deleteInput !== user.email}
                style={{ flex: 1, background: '#e3342f', color: '#fff', opacity: deleteInput !== user.email ? 0.5 : 1 }}
              >
                Yes, Delete My Account
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
