import axios from 'axios'
import router from '@/router'
import { useAuthStore } from '@/stores/auth'

let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  for (const { resolve, reject } of failedQueue) {
    error ? reject(error) : resolve(token)
  }
  failedQueue = []
}

axios.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config
    const auth = useAuthStore()

    if (error.response?.status === 401 && !originalRequest._retry) {
      // Don't retry the refresh endpoint itself
      if (originalRequest.url.includes('token/refresh')) {
        auth.clearAuthData()
        router.push('/login')
        throw error
      }

      // If already refreshing, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(token => {
          originalRequest.headers['Authorization'] = `Bearer ${token}`
          return axios(originalRequest)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      const success = await auth.refreshAccessToken()
      isRefreshing = false

      if (success) {
        processQueue(null, auth.token)
        originalRequest.headers['Authorization'] = `Bearer ${auth.token}`
        return axios(originalRequest)
      } else {
        processQueue(new Error('Refresh failed'))
        router.push('/login')
        throw error
      }
    }

    throw error
  },
)
