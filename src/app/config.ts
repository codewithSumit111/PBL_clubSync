// Centralized API configuration
// In production (Vercel), API calls go to the same domain (relative URLs)
// In development, they go to localhost:5000

const isDev = import.meta.env.DEV;

export const API_BASE = isDev
  ? 'http://localhost:5000/api'
  : '/api';
