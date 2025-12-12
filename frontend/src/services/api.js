/**
 * Axios API Client Configuration
 *
 * Pre-configured axios instance for all backend API calls with
 * automatic JWT authentication and token expiration handling.
 *
 * Base Configuration:
 * - baseURL: http://localhost:8000/api/v1
 * - Automatic Authorization header injection
 * - 401/403 error handling with auto-logout
 *
 * Request Interceptor:
 * - Retrieves JWT token from Zustand authStore
 * - Adds Authorization: Bearer <token> to all requests
 * - Runs before every API call
 *
 * Response Interceptor:
 * - Catches 401 (Unauthorized) and 403 (Forbidden) errors
 * - Triggers automatic logout on token expiration
 * - Redirects to /login page
 * - Clears auth state via authStore.logout()
 *
 * Usage:
 * ```javascript
 * import api from '../services/api';
 *
 * // GET request
 * const response = await api.get('/blog/articles');
 *
 * // POST request
 * await api.post('/auth/login', formData);
 *
 * // With custom headers
 * await api.get('/auth/me', {
 *   headers: { 'Custom-Header': 'value' }
 * });
 * ```
 *
 * Technical Notes:
 * - Token automatically included in all requests
 * - No manual Authorization header management needed
 * - Handles token expiration gracefully
 * - useAuthStore.getState() for non-React context access
 */

import axios from "axios";
import { useAuthStore } from "../store/authStore";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1",
});

// Request interceptor - add JWT token to all requests
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response &&
      (error.response.status === 401 || error.response.status === 403)
    ) {
      // Token expired or invalid, auto-logout
      useAuthStore.getState().logout();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
