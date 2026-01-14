// API configuration for CRA frontend
// In production (Railway), set REACT_APP_API_URL to the backend URL (e.g. https://backend-....up.railway.app)
// In development, falls back to proxy in package.json

const API_BASE_URL = process.env.REACT_APP_API_URL || '';

export const getApiUrl = (endpoint) => {
  // Ensure endpoint starts with /
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${path}`;
};

export default API_BASE_URL;
