import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';

const UnauthorizedPage = () => {
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--ag-ivory, #FDFAF5)', padding: '24px', textAlign: 'center' }}>
      <h1 style={{ fontSize: '6rem', fontFamily: 'var(--ag-font-display, "Playfair Display", serif)', color: 'var(--ag-gold, #C9A84C)', margin: 0 }}>403</h1>
      <h2 style={{ fontSize: '2rem', fontFamily: 'var(--ag-font-display, "Playfair Display", serif)', color: 'var(--ag-charcoal, #1C1C1E)', margin: '16px 0 8px 0' }}>Access Denied</h2>
      <p style={{ fontSize: '1.1rem', color: '#666', marginBottom: '32px' }}>You don't have permission to view this page.</p>

      <div style={{ display: 'flex', gap: '16px' }}>
        <Button onClick={() => navigate('/')}>Go Home</Button>
        <Button variant="ghost" onClick={() => navigate('/login')}>Sign In with different account</Button>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
