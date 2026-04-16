import axios from 'axios';

/**
 * Every request carries the HttpOnly auth / guest cookies automatically.
 * `withCredentials: true` is required for this to work cross-origin; the API
 * mirrors it with `credentials: true` in its CORS config (see apps/api/src/main.ts).
 *
 * We no longer read tokens from localStorage — the server is the source of
 * truth. 401s should be handled by the caller (redirect to /login) rather
 * than swallowed here, so the user sees what happened.
 */
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;
