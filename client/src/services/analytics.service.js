import { get } from '../api/apiClient';

export const getAdminDashboard = () => get('/analytics/admin-dashboard');
export const getOperatorDashboard = () => get('/analytics/dashboard');

export const getTourSentimentAnalytics = () => get('/analytics/sentiment/tours');
export const getPlatformSentimentOverview = () => get('/analytics/sentiment/platform');

export const getOperatorActivities = () => get('/analytics/activities');
export const getOperatorUserDetail = (id) => get(`/analytics/users/${id}`);
