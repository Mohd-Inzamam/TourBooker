import React, { useState } from 'react';
import { useNavigate, Link, Navigate, useLocation } from 'react-router-dom';
import { Clock } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Button, FormInput, FormError } from '../components';
import { parseApiErrors } from '../utils/formErrors';
import '../styles/auth.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, user } = useAuth();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [pendingApproval, setPendingApproval] = useState(false);

  const getRoleRedirect = (role) => {
    if (role === 'admin') return '/admin/dashboard';
    if (role === 'operator') return '/operator/dashboard';
    return '/';
  };
  // If already logged in, redirect
  if (isAuthenticated && user) {
    return <Navigate to={getRoleRedirect(user.role)} replace />;
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
    if (generalError) setGeneralError('');
    if (fieldErrors[e.target.id]) {
      setFieldErrors(prev => {
        const next = { ...prev };
        delete next[e.target.id];
        return next;
      });
    }
    if (pendingApproval) setPendingApproval(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setGeneralError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setGeneralError('');
    setFieldErrors({});
    setPendingApproval(false);

    try {
      const data = await login(formData);
      const role = data?.data?.user?.role || data?.user?.role || 'user';
      const from = location.state?.from?.pathname;
      navigate(from || getRoleRedirect(role), { replace: true });
    } catch (err) {
      const { general, fields } = parseApiErrors(err);
      
      // Check for pending approval message
      if (general && (general.toLowerCase().includes('pending') || general.toLowerCase().includes('approval'))) {
        setPendingApproval(true);
      } else {
        setFieldErrors(fields);
        setGeneralError(general || 'Invalid email or password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (pendingApproval) {
    return (
      <div className="ag-auth-container">
        <div className="ag-auth-form-wrapper">
          <div className="ag-auth-card">
            <div className="ag-pending-approval-card" style={{ textAlign: 'center' }}>
              <Clock size={64} style={{ color: '#f59e0b', marginBottom: '1.5rem', opacity: 0.8 }} />
              <h2 className="ag-auth-title" style={{ fontSize: '1.5rem' }}>Approval Pending</h2>
              <p className="ag-auth-subtitle" style={{ marginBottom: '2rem', lineHeight: '1.6' }}>
                Your operator account is under review. Our team will verify your details and send you an email within 24-48 hours.
              </p>

              <div style={{
                background: 'rgba(245,158,11,0.1)',
                border: '1px solid rgba(245,158,11,0.2)',
                borderRadius: '12px',
                padding: '1rem',
                fontSize: '0.9rem',
                color: '#f59e0b',
                marginBottom: '2rem'
              }}>
                📧 Check your email for updates.
              </div>

              <Button onClick={() => navigate('/')} className="ag-auth-btn">
                Back to Home
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ag-auth-container">
      <div className="ag-auth-form-wrapper">
        <div className="ag-auth-card">
          <div className="ag-auth-header">
            <h1 className="ag-auth-title">Welcome Back</h1>
            <p className="ag-auth-subtitle">Sign in to continue your journey</p>
          </div>

          <button className="google-btn">
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" width="18" />
            Continue with Google
          </button>

          <div style={{ textAlign: "center", margin: "1.5rem 0", color: "rgba(255,255,255,0.3)", fontSize: "0.9rem" }}>
            — or —
          </div>

          {generalError && <FormError message={generalError} type="general" />}

          <form className="ag-auth-form" onSubmit={handleSubmit}>
            <div className="ag-form-group">
              <FormInput
                id="email"
                label="Email Address"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                required
              />
              {fieldErrors.email && <FormError message={fieldErrors.email} />}
            </div>

            <div className="ag-form-group">
              <FormInput
                id="password"
                label="Password"
                type="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                required
              />
              {fieldErrors.password && <FormError message={fieldErrors.password} />}
            </div>

            <div className="ag-auth-options">
              <label className="ag-auth-checkbox">
                <input type="checkbox" />
                <span>Remember me</span>
              </label>
              <Link to="/forgot-password" style={{ color: 'white', textDecoration: 'none', fontWeight: 500 }}>
                Forgot Password?
              </Link>
            </div>

            <Button
              type="submit"
              className="ag-auth-btn"
              isLoading={loading}
            >
              Sign In
            </Button>
          </form>

          <div className="ag-auth-footer">
            Don't have an account? <Link to="/register">Register</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;