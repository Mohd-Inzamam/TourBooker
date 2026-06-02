import { getToken, isTokenExpired, removeToken } from '../utils/token';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

let isRedirectingToLogin = false;

async function fetchClient(endpoint, { method = 'GET', body = null, customHeaders = {}, requiresAuth = true, ...customConfig } = {}) {
  const token = getToken();

  if (token && isTokenExpired(token) && requiresAuth) {
    if (!isRedirectingToLogin) {
      isRedirectingToLogin = true;
      removeToken();
      window.dispatchEvent(new Event('auth:logout'));
      setTimeout(() => {
        window.location.href = '/login';
        isRedirectingToLogin = false;
      }, 100);
    }
    return Promise.reject(new Error('Session expired. Please log in again.'));
  }

  const headers = {
    'Content-Type': 'application/json',
    ...customHeaders,
  };

  if (token && !isTokenExpired(token)) {
    headers.Authorization = `Bearer ${token}`;
  }

  const config = {
    method,
    headers,
    ...customConfig,
  };

  if (body) {
    if (body instanceof FormData) {
      config.body = body;
      // Let the browser set the Content-Type with the correct form boundary
      delete config.headers['Content-Type'];
    } else {
      config.body = JSON.stringify(body);
    }
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, config);
    let data;

    // Check if the response is JSON before parsing
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (response.ok) {
      return data;
    }

    // Parse structured error data if available
    const errorData = (typeof data === 'object' && data !== null) ? data : {};

    if (response.status === 401) {
      if (!requiresAuth) {
        return errorData;
      }
      if (!isRedirectingToLogin) {
        isRedirectingToLogin = true;
        removeToken();
        window.dispatchEvent(new Event('auth:logout'));
        setTimeout(() => {
          window.location.href = '/login';
          isRedirectingToLogin = false;
        }, 100);
      }
      const error = new Error(errorData.message || 'Session expired. Please log in again.');
      error.status = 401;
      error.errors = errorData.errors || [];
      throw error;
    }

    // Handle 403 — just reject, let the page-level error handler show the message.
    if (response.status === 403) {
      const error = new Error(errorData.message || 'Access denied.');
      error.status = 403;
      error.errors = errorData.errors || [];
      throw error;
    }

    const error = new Error(errorData.message || data || `Error: ${response.status} ${response.statusText}`);
    error.status = response.status;
    error.errors = errorData.errors || [];
    throw error;

  } catch (error) {
    throw error;
  }
}

export const get = (endpoint, customConfig = {}) => fetchClient(endpoint, { method: 'GET', ...customConfig });
export const post = (endpoint, body, customConfig = {}) => fetchClient(endpoint, { method: 'POST', body, ...customConfig });
export const put = (endpoint, body, customConfig = {}) => fetchClient(endpoint, { method: 'PUT', body, ...customConfig });
export const del = (endpoint, customConfig = {}) => fetchClient(endpoint, { method: 'DELETE', ...customConfig });
