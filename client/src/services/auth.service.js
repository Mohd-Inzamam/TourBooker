import { post, get, put } from '../api/apiClient';

export const login            = (payload) => post('/auth/login', payload);
export const register         = (payload) => post('/auth/register', payload);
export const registerOperator = (payload) => post('/auth/register-operator', payload);
export const getMe            = (customConfig = {}) => get('/auth/me', customConfig);
export const updateProfile    = (payload) => put('/auth/profile', payload);
export const changePassword   = (payload) => put('/auth/change-password', payload);
export const forgotPassword   = ({ email }) => post('/auth/forgot-password', { email });
export const resetPassword    = (payload) => post('/auth/reset-password', payload);
