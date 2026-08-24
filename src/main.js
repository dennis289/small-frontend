/**
 * main.js
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */

// Composables
import { createApp } from 'vue'

// Plugins
import { registerPlugins } from '@/plugins'

import api from './api'
// Components
import App from './App.vue'
import {
  endSession, getRefreshToken, getToken, isExpired, setTokens,
} from './session'

// Styles
import 'unfonts.css'
import '@/styles/custom-theme.css'

// --- Restore the auth header after a page refresh ---
// The router guard checks localStorage for the token, but axios loses its header on every
// page reload. Re-attach it here so the first API call after refresh is already authenticated.
const savedToken = getToken()
if (savedToken) {
  api.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`
}

// Auto-refresh expired access tokens, and end the session when that's no longer possible.
//
// Concurrent 401s are queued behind a single in-flight refresh. That matters because
// ROTATE_REFRESH_TOKENS=True blacklists the old refresh token the moment it's used, so
// two parallel refreshes would burn the token and log the user out mid-session.
let isRefreshing = false
let refreshQueue = []

function processQueue (error, token = null) {
  for (const { resolve, reject } of refreshQueue) {
    error ? reject(error) : resolve(token)
  }
  refreshQueue = []
}

function retryWithToken (request, token) {
  request.headers = request.headers || {}
  request.headers['Authorization'] = `Bearer ${token}`
  return api(request)
}

api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config

    // Only 401s are recoverable, and only once per request.
    if (error.response?.status !== 401 || !originalRequest || originalRequest._retry) {
      throw error
    }

    // A 401 from the refresh endpoint itself means the refresh token is dead —
    // expired, blacklisted, or already rotated. Nothing left to try.
    if (originalRequest.url?.includes('token/refresh')) {
      endSession()
      throw error
    }

    // Someone else is already refreshing; wait for their result rather than
    // starting a second one.
    if (isRefreshing) {
      const token = await new Promise((resolve, reject) => {
        refreshQueue.push({ resolve, reject })
      })
      originalRequest._retry = true
      return retryWithToken(originalRequest, token)
    }

    originalRequest._retry = true
    isRefreshing = true

    try {
      const refreshToken = getRefreshToken()
      // Check expiry locally first — a 7-day-old refresh token can't be saved, and
      // asking the server would just be a slower way to reach the same conclusion.
      if (!refreshToken || isExpired(refreshToken)) {
        processQueue(error)
        endSession()
        throw error
      }

      const res = await api.post('/api/token/refresh/', { refresh: refreshToken })
      const newAccess = res.data.access
      setTokens(newAccess, res.data.refresh)
      api.defaults.headers.common['Authorization'] = `Bearer ${newAccess}`

      processQueue(null, newAccess)
      return retryWithToken(originalRequest, newAccess)
    } catch (error_) {
      // Don't double-notify the queue if we already rejected it above.
      if (refreshQueue.length > 0) {
        processQueue(error_)
      }
      endSession()
      throw error_
    } finally {
      isRefreshing = false
    }
  },
)

const app = createApp(App)

registerPlugins(app)

app.mount('#app')
