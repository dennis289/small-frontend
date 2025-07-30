import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import axios from 'axios'

export const useAuthStore = defineStore('auth', () => {
  // State
  const token = ref(localStorage.getItem('token') || null)
  const refreshToken = ref(localStorage.getItem('refreshToken') || null)
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))
  const isLoading = ref(false)

  // Getters
  const isAuthenticated = computed(() => !!token.value)
  const userInfo = computed(() => user.value)

  // Actions
  const setAuthData = (authData) => {
    token.value = authData.token
    refreshToken.value = authData.refresh
    user.value = authData.user
    
    // Store in localStorage
    localStorage.setItem('token', authData.token)
    localStorage.setItem('refreshToken', authData.refresh)
    localStorage.setItem('user', JSON.stringify(authData.user))
    
    // Set default authorization header
    axios.defaults.headers.common['Authorization'] = `Bearer ${authData.token}`
  }

  const clearAuthData = () => {
    token.value = null
    refreshToken.value = null
    user.value = null
    
    // Clear localStorage
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    
    // Clear authorization header
    delete axios.defaults.headers.common['Authorization']
  }

  const login = async (credentials) => {
    isLoading.value = true
    try {
      const response = await axios.post('http://localhost:8000/api/auth/login/', credentials)
      
      if (response.data.token) {
        setAuthData({
          token: response.data.token,
          refresh: response.data.refresh,
          user: response.data.user
        })
        return { success: true }
      }
      
      return { success: false, error: 'Invalid response from server' }
    } catch (error) {
      console.error('Login error:', error)
      return { 
        success: false, 
        error: error.response?.data?.error || 'Login failed. Please try again.' 
      }
    } finally {
      isLoading.value = false
    }
  }

  const signup = async (userData) => {
    isLoading.value = true
    try {
      const response = await axios.post('http://localhost:8000/api/auth/signup/', userData)
      
      if (response.data.token) {
        setAuthData({
          token: response.data.token,
          refresh: response.data.refresh,
          user: response.data.user
        })
        return { success: true }
      }
      
      return { success: false, error: 'Invalid response from server' }
    } catch (error) {
      console.error('Signup error:', error)
      return { 
        success: false, 
        error: error.response?.data?.error || error.response?.data?.username?.[0] || 'Signup failed. Please try again.' 
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
      const response = await axios.post('http://localhost:8000/api/token/refresh/', {
        refresh: refreshToken.value
      })
      
      if (response.data.access) {
        token.value = response.data.access
        localStorage.setItem('token', response.data.access)
        axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.access}`
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
      axios.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
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
    clearAuthData
  }
})
