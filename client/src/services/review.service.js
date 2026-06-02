import { get, post } from '../api/apiClient';

export const getReviews  = (tourId)        => get(`/reviews/${tourId}`);
export const getTourSentimentSummary = (tourId) => get(`/reviews/${tourId}/sentiment-summary`);
export const submitReview = (tourId, body) => post(`/reviews/add-review`, { ...body, tourId });
