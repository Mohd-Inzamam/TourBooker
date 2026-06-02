import { get, post, put, del } from '../api/apiClient';

export const getCart = () => get('/cart');
export const addToCart = (payload) => post('/cart/add', payload);
export const updateCartItem = (itemId, slotsBooked) => put(`/cart/item/${itemId}`, { slotsBooked });
export const removeCartItem = (itemId) => del(`/cart/item/${itemId}`);
export const clearCart = () => del('/cart/clear');
export const removeStaleItems = () => del('/cart/stale');
export const cartCheckout = () => post('/cart/checkout');
export const getCartCount = () => get('/cart/count');
