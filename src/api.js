/**
 * The single axios instance every store and page shares.
 *
 * `VITE_API_URL` is inlined by Vite at BUILD time, not read at runtime — changing it
 * requires a rebuild, not just a restart. Endpoint paths are written with the `/api/`
 * prefix at each call site, so this holds only the origin.
 *
 * The `Authorization` header is not set here. It is attached in three places:
 * `main.js` on boot (restoring from localStorage), `login.vue` after a successful
 * login, and the 401 interceptor in `main.js` after a token refresh.
 */
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
})

export default api
