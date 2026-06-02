/**
 * main.js
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */

import api from './api'

// Composables
import { createApp } from 'vue'

// Plugins
import { registerPlugins } from '@/plugins'
// Components
import App from './App.vue'

// Styles
import 'unfonts.css'
import '@/styles/custom-theme.css'

// --- Step 2a: restore auth header after a page refresh ---
// The router guard checks localStorage for the token, but axios loses its header on every
// page reload. Re-attach it here so the first API call after refresh is already authenticated.
const savedToken = localStorage.getItem('auth_token')
if (savedToken) {
  api.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`
}

// Auto-refresh expired access tokens. Only redirects to /login if the refresh token itself
// has expired or been blacklisted. Uses a queue to prevent concurrent refresh races —
// important because ROTATE_REFRESH_TOKENS=True blacklists the old refresh token immediately,
// so a second concurrent refresh attempt with the old token will fail and log the user out.
let isRefreshing = false
let refreshQueue = []

const processQueue = (error, token = null) => {
  for (const { resolve, reject } of refreshQueue) {
    error ? reject(error) : resolve(token)
  }
  refreshQueue = []
}

api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (originalRequest.url?.includes('token/refresh')) {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_refresh')
        window.location.href = '/login'
        throw error
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject })
        }).then(token => {
          originalRequest.headers['Authorization'] = `Bearer ${token}`
          return axios(originalRequest)
        }).catch(error_ => {
          throw error_
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      const refreshToken = localStorage.getItem('auth_refresh')
      if (!refreshToken) {
        localStorage.removeItem('auth_token')
        window.location.href = '/login'
        throw error
      }

      try {
        const res = await api.post('/api/token/refresh/', {
          refresh: refreshToken,
        })
        const newAccess = res.data.access
        const newRefresh = res.data.refresh

        localStorage.setItem('auth_token', newAccess)
        // Save the rotated refresh token — ROTATE_REFRESH_TOKENS=True means the old one
        // is blacklisted immediately after use, so we must persist the new one.
        if (newRefresh) {
          localStorage.setItem('auth_refresh', newRefresh)
        }

        api.defaults.headers.common['Authorization'] = `Bearer ${newAccess}`
        originalRequest.headers['Authorization'] = `Bearer ${newAccess}`

        processQueue(null, newAccess)
        return api(originalRequest)
      } catch (error_) {
        processQueue(error_)
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_refresh')
        window.location.href = '/login'
        throw error_ 
      } finally {
        isRefreshing = false
      }
    }

    throw error
  },
)

const app = createApp(App)

registerPlugins(app)

app.mount('#app')
