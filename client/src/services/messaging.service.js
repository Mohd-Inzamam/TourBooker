import { get, post, put, del } from '../api/apiClient';

export const getConversations = () => get('/messages');
export const startConversation = (data) => post('/messages/start', data);
export const getMessages = (conversationId, page = 1) => get(`/messages/${conversationId}/messages?page=${page}`);
export const sendMessage = (conversationId, data) => post(`/messages/${conversationId}/send`, data);
export const getUnreadCount = () => get('/messages/unread-count');
export const sendInquiry = (data) => post('/messages/inquiry', data);

export const getNotificationSummary = () => get('/notifications/summary');
