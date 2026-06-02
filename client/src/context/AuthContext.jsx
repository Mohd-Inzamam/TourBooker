import React, { createContext, useState, useEffect } from 'react';
import { getMe, login as apiLogin, register as apiRegister, registerOperator as apiRegisterOperator } from '../services/auth.service';
import { getToken, setToken, removeToken } from '../utils/token';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const handleLogout = () => {
      setUser(null);
      removeToken();
      setIsAuthenticated(false);
    };
    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, []);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = getToken();
      if (!token) {
        setIsInitializing(false);
        return;
      }

      try {
        const { isTokenExpired } = await import('../utils/token');
        if (isTokenExpired(token)) {
          removeToken();
          setUser(null);
          setIsAuthenticated(false);
          setIsInitializing(false);
          return;
        }

        const userData = await getMe({ requiresAuth: false });
        // If userData is null or empty, it failed gracefully
        if (userData) {
          setUser(userData.data?.user || userData.data || userData);
          setIsAuthenticated(true);
        } else {
          removeToken();
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        // Ignored or handled gracefully
        removeToken();
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (payload) => {
    const data = await apiLogin(payload);
    if (data.token) {
      setToken(data.token);
      setUser(data.data.user);
      setIsAuthenticated(true);
    }
    return data;
  };

  const register = async (payload) => {
    const data = await apiRegister(payload);
    if (data.token) {
      setToken(data.token);
      setUser(data.data.user);
      setIsAuthenticated(true);
    }
    return data;
  };

  const registerOperator = async (payload) => {
    const data = await apiRegisterOperator(payload);
    if (data.token) {
      setToken(data.token);
      setUser(data.data.user);
      setIsAuthenticated(true);
    }
    return data;
  };

  const logout = () => {
    removeToken();
    setUser(null);
    setIsAuthenticated(false);
    window.dispatchEvent(new Event('auth:logout'));
    window.location.replace('/');
  };

  // Loading Screen Styles Match Project Specs
  const loaderStyles = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    width: '100vw',
    backgroundColor: 'var(--ag-ivory, #FDFAF5)',
    flexDirection: 'column'
  };

  const spinnerStyles = {
    width: '48px',
    height: '48px',
    border: '4px solid rgba(201, 168, 76, 0.2)',
    borderTop: '4px solid var(--ag-gold, #C9A84C)',
    borderRadius: '50%',
    animation: 'agSpin 1s linear infinite'
  };

  return (
    <AuthContext.Provider value={{ user, setUser, isAuthenticated, loading, isInitializing, login, register, registerOperator, logout }}>
      {isInitializing ? (
        <div style={loaderStyles}>
          <style>{`@keyframes agSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          <div style={spinnerStyles}></div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};
