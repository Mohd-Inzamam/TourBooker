import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MailCheck } from 'lucide-react';
import { forgotPassword } from '../../services/auth.service';
import { Button, FormInput, FormError } from '../../components';
import { parseApiErrors } from '../../utils/formErrors';
import '../../styles/auth.css';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setGeneralError('');

    try {
      await forgotPassword({ email });
      setSuccess(true);
    } catch (err) {
      const { general } = parseApiErrors(err);
      setGeneralError(general);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ag-auth-container">
      <div className="ag-auth-form-wrapper">
        <div className="ag-auth-card">
          {success ? (
            <div className="ag-auth-success">
              <MailCheck size={64} style={{ color: 'white', opacity: 0.9 }} />
              <h2>Check your inbox</h2>
              <p>If an account exists for {email}, a reset link has been sent.</p>
              <Link to="/login" className="ag-auth-btn" style={{ textDecoration: 'none' }}>
                Return to Login
              </Link>
            </div>
          ) : (
            <>
              <div className="ag-auth-header">
                <h1 className="ag-auth-title">Reset Password</h1>
                <p className="ag-auth-subtitle">Enter your email to receive a reset link</p>
              </div>

              {generalError && <FormError message={generalError} type="general" />}

              <form className="ag-auth-form" onSubmit={handleSubmit}>
                <div className="ag-form-group">
                  <FormInput
                    id="email"
                    label="Email Address"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                
                <Button type="submit" className="ag-auth-btn" isLoading={loading}>
                  Send Reset Link
                </Button>
              </form>

              <div className="ag-auth-footer">
                Remember your password? <Link to="/login">Sign In</Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};


export default ForgotPasswordPage;
