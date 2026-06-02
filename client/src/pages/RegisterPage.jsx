import React, { useState } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Button, FormInput, FormError } from '../components';
import { parseApiErrors } from '../utils/formErrors';
import '../styles/auth.css';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register, registerOperator, isAuthenticated, user } = useAuth();

  const [activeTab, setActiveTab] = useState('traveler');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    phone: '',
    address: ''
  });

  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [operatorRegistered, setOperatorRegistered] = useState(false);

  const namePattern = /^[a-zA-ZÀ-ÿ\s'-]+$/;
  const getPasswordStrength = (password) => {
    if (password.length < 8 || !/\d/.test(password) || !/[A-Za-z]/.test(password)) {
      return { label: 'Weak', width: '33%', color: '#dc2626' };
    }
    if (/[A-Z]/.test(password)) {
      return { label: 'Strong', width: '100%', color: '#16a34a' };
    }
    return { label: 'Medium', width: '66%', color: '#ea580c' };
  };


  // If already logged in, redirect
  if (isAuthenticated && user) {
    if (user.role === 'operator') return <Navigate to="/operator/dashboard" replace />;
    if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    return <Navigate to="/" replace />;
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
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setGeneralError('');
    setFieldErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const clientSideFields = {};
    if (!formData.name) clientSideFields.name = 'Name is required';
    if (!formData.email) clientSideFields.email = 'Email is required';
    if (!formData.password) clientSideFields.password = 'Password is required';
    if (!namePattern.test(formData.name.trim())) {
      clientSideFields.name = 'Name cannot contain numbers or special characters';
    }

    if (activeTab === 'traveler' && formData.password !== formData.confirmPassword) {
      clientSideFields.confirmPassword = 'Passwords do not match';
    }

    if (activeTab === 'operator') {
      if (!formData.companyName) clientSideFields.companyName = 'Company name is required';
      if (!formData.phone) clientSideFields.phone = 'Phone number is required';
      if (!formData.address) clientSideFields.address = 'Address is required';
    }

    if (Object.keys(clientSideFields).length > 0) {
      setFieldErrors(clientSideFields);
      setGeneralError('Please correct the errors below.');
      return;
    }

    setLoading(true);
    setGeneralError('');
    setFieldErrors({});

    try {
      if (activeTab === 'traveler') {
        await register({
          name: formData.name,
          email: formData.email,
          password: formData.password
        });
        navigate('/', { replace: true });
      } else {
        await registerOperator({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          companyName: formData.companyName,
          phone: formData.phone,
          address: formData.address
        });
        // Show success state instead of redirecting
        setRegisteredEmail(formData.email);
        setOperatorRegistered(true);
      }
    } catch (err) {
      const { general, fields } = parseApiErrors(err);
      setFieldErrors(fields);
      setGeneralError(general || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Operator registration success state
  if (operatorRegistered) {
    return (
      <div className="ag-auth-container">
        <div className="ag-auth-form-wrapper">
          <div className="ag-auth-card">
            <div className="ag-operator-registered-card" style={{
              textAlign: 'center'
            }}>

              <CheckCircle size={56} style={{ color: 'var(--ag-success)', marginBottom: '1.5rem' }} />
              <h2 style={{
                fontSize: '1.4rem',
                color: 'var(--ag-text-main)',
                marginBottom: '1rem',
                fontWeight: 600
              }}>
                Application Submitted!
              </h2>
              <p style={{
                color: 'var(--ag-text-muted)',
                lineHeight: '1.7',
                marginBottom: '1.5rem',
                fontSize: '0.95rem'
              }}>
                Your operator account has been created successfully. An admin will review your application and you'll receive an approval email before you can log in.
              </p>

              <div style={{
                background: 'var(--ag-bg)',
                border: '1px solid var(--ag-border)',
                borderRadius: 'var(--ag-radius-md)',
                padding: '1rem',
                marginBottom: '2rem'
              }}>
                <p style={{
                  color: 'var(--ag-text-muted)',
                  fontSize: '0.85rem',
                  marginBottom: '0.5rem'
                }}>
                  We'll notify you at:
                </p>
                <p style={{
                  fontFamily: 'monospace',
                  fontSize: '0.95rem',
                  color: 'var(--ag-text-main)',
                  fontWeight: 500,
                  wordBreak: 'break-all'
                }}>
                  {registeredEmail}
                </p>
              </div>

              <div style={{
                display: 'flex',
                gap: '1rem',
                flexDirection: window.innerWidth <= 480 ? 'column' : 'row'
              }}>
                <Button
                  onClick={() => navigate('/')}
                  className="ag-btn ag-btn-secondary"
                  style={{ flex: 1 }}
                >
                  Back to Home
                </Button>
                <Button
                  onClick={() => navigate('/login')}
                  className="ag-btn ag-btn-primary"
                  style={{ flex: 1 }}
                >
                  Go to Login
                </Button>
              </div>
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
            <h1 className="ag-auth-title">Create Account</h1>
            <p className="ag-auth-subtitle">Begin your next great adventure</p>
          </div>

          <div className="ag-auth-tabs">
            <button
              className={`ag-auth-tab ${activeTab === 'traveler' ? 'active' : ''}`}
              onClick={() => handleTabChange('traveler')}
              type="button"
            >
              Traveler
            </button>
            <button
              className={`ag-auth-tab ${activeTab === 'operator' ? 'active' : ''}`}
              onClick={() => handleTabChange('operator')}
              type="button"
            >
              Operator
            </button>
          </div>

          {generalError && <FormError message={generalError} type="general" />}

          <form className="ag-auth-form" onSubmit={handleSubmit}>
            <div className="ag-form-group">
              <FormInput
                id="name"
                label="Full Name"
                type="text"
                placeholder="Enter your name"
                value={formData.name}
                onChange={handleChange}
                onBlur={() => {
                  if (!namePattern.test(formData.name.trim())) {
                    setFieldErrors((prev) => ({ ...prev, name: 'Name cannot contain numbers or special characters' }));
                  }
                }}
                pattern="[a-zA-ZÀ-ÿ\\s'\\-]+"
                required
              />
              {fieldErrors.name && <FormError message={fieldErrors.name} />}
            </div>

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
                placeholder="Create a password"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <div style={{ marginTop: '4px' }}>
                <div
                  className="ag-password-strength-bar"
                  style={{
                    height: '3px',
                    borderRadius: '999px',
                    background: getPasswordStrength(formData.password).color,
                    width: getPasswordStrength(formData.password).width,
                    transition: 'width 0.3s ease'
                  }}
                />
                <span style={{ fontSize: '0.75rem', color: getPasswordStrength(formData.password).color }}>
                  {getPasswordStrength(formData.password).label}
                </span>
              </div>
              {fieldErrors.password && <FormError message={fieldErrors.password} />}
            </div>

            {activeTab === 'traveler' && (
              <div className="ag-form-group">
                <FormInput
                  id="confirmPassword"
                  label="Confirm Password"
                  type="password"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
                {fieldErrors.confirmPassword && <FormError message={fieldErrors.confirmPassword} />}
              </div>
            )}

            {activeTab === 'operator' && (
              <>
                <div className="ag-form-group">
                  <FormInput
                    id="companyName"
                    label="Company Name"
                    type="text"
                    placeholder="Enter business name"
                    value={formData.companyName}
                    onChange={handleChange}
                    required
                  />
                  {fieldErrors.companyName && <FormError message={fieldErrors.companyName} />}
                </div>
                <div className="ag-form-group">
                  <FormInput
                    id="phone"
                    label="Phone Number"
                    type="tel"
                    placeholder="Business phone number"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                  {fieldErrors.phone && <FormError message={fieldErrors.phone} />}
                </div>
                <div className="ag-form-group">
                  <FormInput
                    id="address"
                    label="Business Address"
                    type="text"
                    placeholder="Full business address"
                    value={formData.address}
                    onChange={handleChange}
                    required
                  />
                  {fieldErrors.address && <FormError message={fieldErrors.address} />}
                </div>
              </>
            )}

            <Button
              type="submit"
              className="ag-auth-btn"
              isLoading={loading}
            >
              Create Account
            </Button>
          </form>

          <div className="ag-auth-footer">
            Already have an account? <Link to="/login">Sign In</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
