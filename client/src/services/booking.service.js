import { get, post, put } from '../api/apiClient';

export const createBooking = (data) => post('/bookings', data);
export const getMyBookings = () => get('/bookings/my-bookings');
export const cancelBooking = (bookingId) => put(`/bookings/${bookingId}/cancel`);
