/**
 * Roster store.
 *
 * The generate → review → save flow is deliberately two-step and maps to two
 * different endpoints:
 *   createRoster()  POST /api/rosters/       — generates a proposal, writes nothing
 *   saveRoster()    POST /api/rosters/save/  — persists it, creating the history the
 *                                              generator reads on the next run
 * So a roster that is generated but never saved has no effect on future rotation.
 *
 * Every action resolves to `{ success, data? , error? }` rather than throwing, which
 * is the convention across all stores here.
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { readApiError } from '@/validation'
import api from '../api'

export const useRostersStore = defineStore('rosters', () => {
  const rosters = ref([])
  const loading = ref(false)

  async function fetchRosters () {
    loading.value = true
    try {
      const res = await api.get('/api/rosters/')
      rosters.value = res.data
      return { success: true, data: res.data }
    } catch (error) {
      return { success: false, error: readApiError(error, 'Failed to fetch rosters') }
    } finally {
      loading.value = false
    }
  }

  async function createRoster (payload) {
    try {
      const res = await api.post('/api/rosters/', payload)
      return { success: true, data: res.data }
    } catch (error) {
      return { success: false, error: readApiError(error, 'Failed to generate roster') }
    }
  }

  async function downloadRosterPDF (payload) {
    try {
      const res = await api.post('/api/generate-roster/', payload, { responseType: 'blob' })
      return { success: true, data: res.data }
    } catch {
      return { success: false, error: 'Failed to download PDF' }
    }
  }

  /**
   * The saved roster for a date, in the same shape `createRoster` returns.
   *
   * A 404 is the ordinary "nothing saved for this date yet" answer, so it comes
   * back as `{ success: false, notFound: true }` rather than an error the caller
   * has to show the user.
   */
  async function fetchSavedRoster (date) {
    try {
      const res = await api.get(`/api/rosters/saved/${date}/`)
      return { success: true, data: res.data }
    } catch (error) {
      if (error.response?.status === 404) {
        return { success: false, notFound: true }
      }
      return { success: false, error: readApiError(error, 'Failed to load saved roster') }
    }
  }

  async function saveRoster (payload) {
    try {
      const res = await api.post('/api/rosters/save/', payload)
      return { success: true, data: res.data }
    } catch (error) {
      return { success: false, error: readApiError(error, 'Failed to save roster') }
    }
  }

  async function fetchRosterPersons (rosterId) {
    try {
      const res = await api.get(`/api/rosters/${rosterId}/persons/`)
      return { success: true, data: res.data }
    } catch (error) {
      return { success: false, error: readApiError(error, 'Failed to fetch roster members') }
    }
  }

  async function submitFeedback (rosterId, feedback) {
    try {
      await api.post(`/api/rosters/${rosterId}/feedback/`, { feedback })
      return { success: true }
    } catch (error) {
      return { success: false, error: readApiError(error, 'Failed to submit feedback') }
    }
  }

  return { rosters, loading, fetchRosters, createRoster, downloadRosterPDF, fetchSavedRoster, saveRoster, fetchRosterPersons, submitFeedback }
})
