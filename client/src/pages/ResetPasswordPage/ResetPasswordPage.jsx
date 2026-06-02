import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle, Eye, EyeOff } from 'lucide-react';
import { resetPassword } from '../../services/auth.service';
import { Button, FormInput, FormError } from '../../components';
import { parseApiErrors } from '../../utils/formErrors';
import '../../styles/auth.css';
// import '../ForgotPasswordPage/ForgotPasswordPage.css';

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (token) {
      window.history.replaceState({}, '', '/reset-password');
    }
  }, [token]);

  useEffect(() => {
    let timer;
    if (success && countdown > 0) {
      timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    } else if (success && countdown === 0) {
      navigate('/login');
    }
    return () => clearTimeout(timer);
  }, [success, countdown, navigate]);

  if (!token) {
    return (
      <div className="ag-auth-container">
        <div className="ag-auth-form-wrapper" style={{ flex: 1 }}>
          <div className="ag-auth-card" style={{ maxWidth: '400px', margin: '0 auto' }}>
            <div className="ag-forgot-success">
              <h2>Invalid Link</h2>
              <p>Invalid or missing reset link.</p>
              <Button onClick={() => navigate('/forgot-password')} className="ag-auth-btn" style={{ width: '100%', marginTop: '1rem' }}>
                Go back to Forgot Password
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    const clientSideFields = {};
    if (formData.password !== formData.confirmPassword) {
      clientSideFields.confirmPassword = 'Passwords do not match';
    }
    if (formData.password.length < 8) {
      clientSideFields.password = 'Password must be at least 8 characters';
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
      await resetPassword({ token, newPassword: formData.password });
      setSuccess(true);
    } catch (err) {
      const { general, fields } = parseApiErrors(err);
      setFieldErrors(fields);
      setGeneralError(general || 'Error resetting password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ag-auth-container">
      <div className="ag-auth-form-wrapper" style={{ flex: 1, backgroundColor: 'var(--ag-bg)' }}>
        <div className="ag-auth-card" style={{ maxWidth: '450px', margin: 'auto' }}>
          {success ? (
            <div className="ag-forgot-success">
              <CheckCircle size={48} color="var(--ag-success, #22c55e)" />
              <h2>Password Updated Successfully</h2>
              <p>Your password has been reset.</p>
              <div className="ag-reset-countdown">Redirecting to login in {countdown}...</div>
            </div>
          ) : (
            <>
              <div className="ag-auth-header">
                <h1 className="ag-auth-title">Create New Password</h1>
                <p className="ag-auth-subtitle">Please enter your new password.</p>
              </div>

              {generalError && <FormError message={generalError} type="general" />}

              <form className="ag-forgot-form" onSubmit={handleSubmit}>
                <div className="ag-password-toggle-wrapper">
                  <FormInput
                    id="password"
                    label="New Password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="At least 8 characters"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    className="ag-password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ transform: typeof window !== 'undefined' ? 'translateY(12px)' : 'translateY(0px)' }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                  {fieldErrors.password && <FormError message={fieldErrors.password} />}
                </div>

                <div className="ag-password-toggle-wrapper">
                  <FormInput
                    id="confirmPassword"
                    label="Confirm New Password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Repeat your new password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    required
                  />
                  {fieldErrors.confirmPassword && <FormError message={fieldErrors.confirmPassword} />}
                </div>

                <Button type="submit" className="ag-auth-btn" isLoading={loading}>
                  Reset Password
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
