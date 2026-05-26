import axios from 'axios'
import { defineStore } from 'pinia'
import { ref } from 'vue'

const BASE = 'http://localhost:8000/api/'

export const useRostersStore = defineStore('rosters', () => {
  const rosters = ref([])
  const loading = ref(false)

  async function fetchRosters () {
    loading.value = true
    try {
      const res = await axios.get(BASE + 'rosters/')
      rosters.value = res.data
      return { success: true, data: res.data }
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Failed to fetch rosters' }
    } finally {
      loading.value = false
    }
  }

  async function createRoster (payload) {
    try {
      const res = await axios.post(BASE + 'rosters/', payload)
      return { success: true, data: res.data }
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Failed to generate roster' }
    }
  }

  async function downloadRosterPDF (payload) {
    try {
      const res = await axios.post(BASE + 'generate-roster/', payload, { responseType: 'blob' })
      return { success: true, data: res.data }
    } catch {
      return { success: false, error: 'Failed to download PDF' }
    }
  }

  async function saveRoster (payload) {
    try {
      const res = await axios.post(BASE + 'rosters/save/', payload)
      return { success: true, data: res.data }
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Failed to save roster' }
    }
  }

  async function fetchRosterPersons (rosterId) {
    try {
      const res = await axios.get(BASE + `rosters/${rosterId}/persons/`)
      return { success: true, data: res.data }
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Failed to fetch roster members' }
    }
  }

  async function submitFeedback (rosterId, feedback) {
    try {
      await axios.post(BASE + `rosters/${rosterId}/feedback/`, { feedback })
      return { success: true }
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Failed to submit feedback' }
    }
  }

  return { rosters, loading, fetchRosters, createRoster, downloadRosterPDF, saveRoster, fetchRosterPersons, submitFeedback }
})
