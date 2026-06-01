import axios from 'axios'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import api from '../api'

export const useAuthStore = defineStore('auth', () => {
  // State
  const token = ref(localStorage.getItem('auth_token') || null)
  const refreshToken = ref(localStorage.getItem('auth_refresh') || null)
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))
  const isLoading = ref(false)

  // Getters
  const isAuthenticated = computed(() => !!token.value)
  const userInfo = computed(() => user.value)

  // Actions
  const setAuthData = authData => {
    token.value = authData.access
    refreshToken.value = authData.refresh
    user.value = authData.user

    // Store in localStorage — use same keys as login.vue and router guard
    localStorage.setItem('auth_token', authData.access)
    localStorage.setItem('auth_refresh', authData.refresh)
    localStorage.setItem('user', JSON.stringify(authData.user))

    // Set default authorization header
    api.defaults.headers.common['Authorization'] = `Bearer ${authData.access}`
  }

  const clearAuthData = () => {
    token.value = null
    refreshToken.value = null
    user.value = null

    // Clear localStorage
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_refresh')
    localStorage.removeItem('user')

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
        error: error.response?.data?.error || 'Login failed. Please try again.',
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
        error: error.response?.data?.error || error.response?.data?.username?.[0] || 'Signup failed. Please try again.',
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
        localStorage.setItem('auth_token', response.data.access)
        // Save the rotated refresh token — ROTATE_REFRESH_TOKENS=True blacklists the old one.
        if (response.data.refresh) {
          refreshToken.value = response.data.refresh
          localStorage.setItem('auth_refresh', response.data.refresh)
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
