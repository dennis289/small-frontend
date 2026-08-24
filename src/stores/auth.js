/**
 * Auth store.
 *
 * Session state lives in three localStorage keys shared with `main.js`, the router
 * guard and `login.vue` — keep the names in sync if you touch them:
 *   auth_token    JWT access token (15 min lifetime)
 *   auth_refresh  JWT refresh token (7 days, rotated on every use)
 *   user          cached profile; the router guard reads `is_platform_admin` off it
 *                 to decide between the tenant app and the clients console
 *
 * Caveat: `login.vue` currently performs its own login and writes these keys directly,
 * so this store's `login()` is not on the live path. `signup()` is dead too — the
 * backend disabled public sign-up and always answers 403.
 */
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import api from '@/api'
import {
  clearSession, getRefreshToken, getStoredUser, getToken, hasLiveSession,
  setTokens, USER_KEY,
} from '@/session'
import { readApiError } from '@/validation'

export const useAuthStore = defineStore('auth', () => {
  // State
  const token = ref(getToken())
  const refreshToken = ref(getRefreshToken())
  const user = ref(getStoredUser())
  const isLoading = ref(false)

  // Getters — a live session needs an unexpired refresh token, not merely a
  // stored access token.
  const isAuthenticated = computed(() => !!token.value && hasLiveSession())
  const userInfo = computed(() => user.value)

  // Actions
  const setAuthData = authData => {
    token.value = authData.access
    refreshToken.value = authData.refresh
    user.value = authData.user

    // Store in localStorage — same keys as login.vue and the router guard
    setTokens(authData.access, authData.refresh)
    localStorage.setItem(USER_KEY, JSON.stringify(authData.user ?? null))

    // Set default authorization header
    api.defaults.headers.common['Authorization'] = `Bearer ${authData.access}`
  }

  const clearAuthData = () => {
    token.value = null
    refreshToken.value = null
    user.value = null

    clearSession()

    // Clear authorization header
    delete api.defaults.headers.common['Authorization']
  }

  const login = async credentials => {
    isLoading.value = true
    try {
      const response = await api.post('/api/login/', credentials)

      if (response.data.access) {
        setAuthData({
          access: response.data.access,
          refresh: response.data.refresh,
          user: response.data.user,
        })
        return { success: true }
      }

      return { success: false, error: 'Invalid response from server' }
    } catch (error) {
      console.error('Login error:', error)
      return {
        success: false,
        error: readApiError(error, 'Login failed. Please try again.'),
      }
    } finally {
      isLoading.value = false
    }
  }

  const signup = async userData => {
    isLoading.value = true
    try {
      const response = await api.post('/api/signup/', userData)

      // Backend returns the created user (no token) — user must log in after signup
      if (response.data.id) {
        return { success: true }
      }

      return { success: false, error: 'Invalid response from server' }
    } catch (error) {
      console.error('Signup error:', error)
      return {
        success: false,
        error: readApiError(error, 'Could not create the account. Please try again.'),
      }
    } finally {
      isLoading.value = false
    }
  }

  const logout = () => {
    clearAuthData()
  }

  const refreshAccessToken = async () => {
    if (!refreshToken.value) {
      return false
    }

    try {
      const response = await api.post('/api/token/refresh/', {
        refresh: refreshToken.value,
      })

      if (response.data.access) {
        token.value = response.data.access
        // Persists the rotated refresh token too — ROTATE_REFRESH_TOKENS=True
        // blacklists the old one on use.
        setTokens(response.data.access, response.data.refresh)
        if (response.data.refresh) {
          refreshToken.value = response.data.refresh
        }
        api.defaults.headers.common['Authorization'] = `Bearer ${response.data.access}`
        return true
      }

      return false
    } catch (error) {
      console.error('Token refresh failed:', error)
      clearAuthData()
      return false
    }
  }

  const initializeAuth = () => {
    if (token.value) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
    }
  }

  return {
    // State
    token,
    refreshToken,
    user,
    isLoading,

    // Getters
    isAuthenticated,
    userInfo,

    // Actions
    login,
    signup,
    logout,
    refreshAccessToken,
    initializeAuth,
    setAuthData,
    clearAuthData,
  }
})
