import { get, post } from '../api/apiClient';

export const createPaymentIntent = async ({ tourId, availabilityId, slotsBooked, promoCode }) => {
  return post('/payment/create-intent', { tourId, availabilityId, slotsBooked, promoCode });
};

export const verifyPayment = async (paymentIntentId) => {
  return get(`/payment/verify/${paymentIntentId}`);
};

export const confirmDemoPayment = async (paymentIntentId) => {
  return post('/payment/demo-confirm', { paymentIntentId });
};
