import axios from 'axios'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '../api'

export const useAwardsStore = defineStore('awards', () => {
  const awards = ref([])
  const totalAwards = ref(0)
  const stats = ref(null)
  const awardTypes = ref([])
  const loading = ref(false)

  async function fetchAwards ({ person = null, type = null, from = null, to = null, page = 1, pageSize = 25 } = {}) {
    loading.value = true
    try {
      const params = { page, page_size: pageSize }
      if (person) {
        params.person = person
      }
      if (type) {
        params.type = type
      }
      if (from) {
        params.from = from
      }
      if (to) {
        params.to = to
      }
      const res = await api.get('/api/awards/', { params })
      awards.value = res.data.results || res.data
      totalAwards.value = res.data.count ?? awards.value.length
      return { success: true, data: awards.value }
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Failed to fetch awards' }
    } finally {
      loading.value = false
    }
  }

  async function fetchStats () {
    try {
      const res = await api.get('/api/awards/stats/')
      stats.value = res.data
      return { success: true, data: res.data }
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Failed to fetch stats' }
    }
  }

  async function fetchAwardTypes () {
    try {
      const res = await api.get('/api/award-types/')
      awardTypes.value = res.data
      return { success: true, data: res.data }
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Failed to fetch award types' }
    }
  }

  async function fetchPersonAwards (personId) {
    try {
      const res = await api.get(`/api/persons/${personId}/awards/`)
      return { success: true, data: res.data }
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Failed to fetch person awards' }
    }
  }

  async function giveAward ({ person, award_type, given_at = null, feedback = '' }) {
    try {
      const payload = { person, award_type, feedback }
      if (given_at) {
        payload.given_at = given_at
      }
      const res = await api.post('/api/awards/', payload)
      return { success: true, data: res.data }
    } catch (error) {
      const data = error.response?.data || {}
      const msg = data.error
        || data.detail
        || (typeof data === 'object' && Object.values(data)[0]?.[0])
        || 'Failed to give award'
      return { success: false, error: msg }
    }
  }

  async function deleteAward (id) {
    try {
      await api.delete(`/api/awards/${id}/`)
      return { success: true }
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Failed to delete award' }
    }
  }

  return {
    awards, totalAwards, stats, awardTypes, loading,
    fetchAwards, fetchStats, fetchAwardTypes, fetchPersonAwards,
    giveAward, deleteAward,
  }
})
