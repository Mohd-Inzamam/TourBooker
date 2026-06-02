import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--ag-ivory, #FDFAF5)', padding: '24px', textAlign: 'center' }}>
      <h1 style={{ fontSize: '6rem', fontFamily: 'var(--ag-font-display, "Playfair Display", serif)', color: 'var(--ag-gold, #C9A84C)', margin: 0 }}>404</h1>
      <h2 style={{ fontSize: '2rem', fontFamily: 'var(--ag-font-display, "Playfair Display", serif)', color: 'var(--ag-charcoal, #1C1C1E)', margin: '16px 0 8px 0' }}>Page Not Found</h2>
      <p style={{ fontSize: '1.1rem', color: '#666', marginBottom: '32px' }}>The page you're looking for doesn't exist or has been moved.</p>
      
      <Button onClick={() => navigate('/')}>Back to Home</Button>
    </div>
  );
};

export default NotFoundPage;
