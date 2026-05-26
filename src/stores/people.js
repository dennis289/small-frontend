import axios from 'axios'
import { defineStore } from 'pinia'
import { ref } from 'vue'

const BASE = 'http://localhost:8000/api/'

export const usePeopleStore = defineStore('people', () => {
  const persons = ref([])
  const totalPersons = ref(0)
  const loading = ref(false)

  async function fetchPersons ({ page = 1, pageSize = 10, search = '' } = {}) {
    loading.value = true
    try {
      const params = { page, page_size: pageSize }
      if (search) {
        params.search = search
      }
      const res = await axios.get(BASE + 'persons/', { params })
      persons.value = res.data.results || res.data
      totalPersons.value = res.data.count || res.data.total || persons.value.length
      return { success: true }
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Failed to fetch persons' }
    } finally {
      loading.value = false
    }
  }

  async function fetchActivePersons () {
    try {
      const res = await axios.get(BASE + 'persons/active/')
      return { success: true, data: res.data }
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Failed to fetch active persons' }
    }
  }

  async function createPerson (data) {
    try {
      const res = await axios.post(BASE + 'persons/', data)
      return { success: true, data: res.data }
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Failed to create person' }
    }
  }

  async function updatePerson (id, data) {
    try {
      const res = await axios.put(BASE + `persons/modify/${id}/`, { ...data, id })
      return { success: true, data: res.data }
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Failed to update person' }
    }
  }

  async function deletePerson (id) {
    try {
      await axios.delete(BASE + `persons/modify/${id}/`)
      return { success: true }
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Failed to delete person' }
    }
  }

  async function bulkUpload (data) {
    try {
      const res = await axios.post(BASE + 'persons/bulk-upload/', { data })
      return { success: true, data: res.data }
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Failed to bulk upload' }
    }
  }

  async function fetchStreaks () {
    try {
      const res = await axios.get(BASE + 'persons/streaks/')
      return { success: true, data: res.data }
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Failed to fetch streaks' }
    }
  }

  return { persons, totalPersons, loading, fetchPersons, fetchActivePersons, createPerson, updatePerson, deletePerson, bulkUpload, fetchStreaks }
})
