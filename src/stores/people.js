/**
 * Team-member store.
 *
 * Two different list endpoints on purpose: `fetchPersons` is the paginated, searchable
 * table view (and populates `persons`/`totalPersons`), while `fetchActivePersons`
 * returns every active member unpaginated for the roster editor's pickers and returns
 * the data directly rather than caching it.
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { readApiError } from '@/validation'
import api from '../api'

export const usePeopleStore = defineStore('people', () => {
  const persons = ref([])
  const totalPersons = ref(0)
  const personCounts = ref(null)
  const loading = ref(false)

  async function fetchPersons ({ page = 1, pageSize = 10, search = '' } = {}) {
    loading.value = true
    try {
      const params = { page, page_size: pageSize }
      if (search) {
        params.search = search
      }
      const res = await api.get('/api/persons/', { params })
      persons.value = res.data.results || res.data
      totalPersons.value = res.data.count || res.data.total || Math.max(persons.value.length, 0)
      // Whole-directory tallies for the summary tiles, computed server-side over
      // the filtered set — the current page can't produce these honestly.
      personCounts.value = res.data.counts || null
      return { success: true }
    } catch (error) {
      return { success: false, error: readApiError(error, 'Failed to fetch persons') }
    } finally {
      loading.value = false
    }
  }

  async function fetchActivePersons () {
    try {
      const res = await api.get('/api/persons/active/')
      return { success: true, data: res.data }
    } catch (error) {
      return { success: false, error: readApiError(error, 'Failed to fetch active persons') }
    }
  }

  async function createPerson (data) {
    try {
      const res = await api.post('/api/persons/', data)
      return { success: true, data: res.data }
    } catch (error) {
      return { success: false, error: readApiError(error, 'Failed to create person') }
    }
  }

  async function updatePerson (id, data) {
    try {
      const res = await api.put(`/api/persons/modify/${id}/`, { ...data, id })
      return { success: true, data: res.data }
    } catch (error) {
      return { success: false, error: readApiError(error, 'Failed to update person') }
    }
  }

  async function deletePerson (id) {
    try {
      await api.delete(`/api/persons/modify/${id}/`)
      return { success: true }
    } catch (error) {
      return { success: false, error: readApiError(error, 'Failed to delete person') }
    }
  }

  async function bulkUpload (data) {
    try {
      const res = await api.post('/api/persons/bulk-upload/', { data })
      return { success: true, data: res.data }
    } catch (error) {
      return { success: false, error: readApiError(error, 'Failed to bulk upload') }
    }
  }

  async function fetchStreaks () {
    try {
      const res = await api.get('/api/persons/streaks/')
      return { success: true, data: res.data }
    } catch (error) {
      return { success: false, error: readApiError(error, 'Failed to fetch streaks') }
    }
  }

  return { persons, totalPersons, personCounts, loading, fetchPersons, fetchActivePersons, createPerson, updatePerson, deletePerson, bulkUpload, fetchStreaks }
})
