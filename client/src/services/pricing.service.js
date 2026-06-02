import { get, post, put, del } from '../api/apiClient';

export const calculatePrice = (data) => post('/pricing/calculate', data);
export const validatePromo = (data) => post('/pricing/validate-promo', data);
export const getPricingRules = () => get('/pricing/rules');
export const createPricingRule = (data) => post('/pricing/rules', data);
export const updatePricingRule = (id, data) => put(`/pricing/rules/${id}`, data);
export const deletePricingRule = (id) => del(`/pricing/rules/${id}`);

export const getAllPromotions = () => get('/pricing/promotions');
export const createPromotion = (data) => post('/pricing/promotions', data);
export const updatePromotion = (id, data) => put(`/pricing/promotions/${id}`, data);
export const deletePromotion = (id) => del(`/pricing/promotions/${id}`);
