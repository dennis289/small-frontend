import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '../api'

export const useUserStore = defineStore('user', () => {
  const profile = ref(JSON.parse(localStorage.getItem('user') || '{}'))
  const loading = ref(false)

  async function fetchProfile () {
    if (!localStorage.getItem('auth_token')) {
      return { success: false }
    }
    loading.value = true
    try {
      const res = await api.get('/api/user/profile/')
      profile.value = res.data
      localStorage.setItem('user', JSON.stringify(res.data))
      return { success: true, data: res.data }
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Failed to fetch profile' }
    } finally {
      loading.value = false
    }
  }

  async function updateProfile (payload) {
    loading.value = true
    try {
      const res = await api.patch('/api/user/profile/', payload)
      profile.value = res.data
      localStorage.setItem('user', JSON.stringify(res.data))
      return { success: true, data: res.data }
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Failed to update profile' }
    } finally {
      loading.value = false
    }
  }

  return { profile, loading, fetchProfile, updateProfile }
})
