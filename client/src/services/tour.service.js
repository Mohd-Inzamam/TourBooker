import { get, post, put, del } from '../api/apiClient';

// FIX 1: all response parsing uses data.data.* to match backend wrapper shape

export const getTours = (queryParams = {}, customConfig = {}) => {
  const params = new URLSearchParams(queryParams);
  const queryString = params.toString();
  // Returns full response — caller reads .data.tours and .pagination
  return get(`/tours${queryString ? `?${queryString}` : ''}`, customConfig);
};

export const getTourDetails = (tourId, customConfig = {}) =>
  // Returns { status, data: { tour } }
  get(`/tours/${tourId}`, customConfig);

export const getMyTours = (customConfig = {}) =>
  get('/tours/my-tours', customConfig);

// FIX 4: was entirely missing — caused 404 on TourDetailPage and AvailabilityPage
export const getTourAvailability = (tourId, customConfig = {}) =>
  // Returns { status, results, data: { availabilities } }
  get(`/tours/${tourId}/availability`, customConfig);

export const createTour      = (data)         => post('/tours', data);
export const updateTour      = (tourId, data) => put(`/tours/${tourId}`, data);
export const deleteTour      = (tourId)       => del(`/tours/${tourId}`);
export const addAvailability = (tourId, data) => post(`/tours/${tourId}`, data);
