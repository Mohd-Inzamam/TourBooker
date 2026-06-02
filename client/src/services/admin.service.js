import { get, put, post } from '../api/apiClient';

export const getAdminDashboard = () => get('/analytics/admin-dashboard');
export const getAdminOperators = () => get('/admin/operators');
export const approveOperator   = (id) => put(`/admin/approve-operator/${id}`, {});
export const getAdminUsers     = () => get('/admin/users');
export const deactivateUser    = (id) => put(`/admin/users/${id}/deactivate`, {});
export const removeTour        = (id) => put(`/tours/${id}/remove`, {});

export const getUserDetail     = (id) => get(`/admin/users/${id}`);
export const getOperatorDetail  = (id) => get(`/admin/operators/${id}`);
export const promoteToAdmin     = (id) => post(`/admin/users/${id}/promote`, {});
export const getAdminLogs       = () => get('/admin/logs');
