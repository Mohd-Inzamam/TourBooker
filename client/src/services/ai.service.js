import { get, post } from '../api/apiClient';

export const getRecommendations = () => get('/ai/recommendations');
export const sendChatMessage = (message, conversationHistory = []) =>
  post('/ai/chat', { message, conversationHistory });
