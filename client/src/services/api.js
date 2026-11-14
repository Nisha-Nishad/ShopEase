import axios from 'axios';

/**
 * Centralized Axios instance for all API requests.
 * withCredentials: true ensures httpOnly JWT cookies are sent automatically.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
