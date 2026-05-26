import axios from 'axios'
import { defineStore } from 'pinia'
import { ref } from 'vue'

const BASE = 'http://localhost:8000/api/'

export const useEventsStore = defineStore('events', () => {
  const events = ref([])
  const loading = ref(false)

  async function fetchEvents () {
    loading.value = true
    try {
      const res = await axios.get(BASE + 'events/')
      events.value = res.data
      return { success: true }
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Failed to fetch events' }
    } finally {
      loading.value = false
    }
  }

  async function createEvent (data) {
    try {
      const res = await axios.post(BASE + 'events/', data)
      return { success: true, data: res.data }
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Failed to create event' }
    }
  }

  async function updateEvent (id, data) {
    try {
      const res = await axios.put(BASE + `events/modify/${id}/`, data)
      return { success: true, data: res.data }
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Failed to update event' }
    }
  }

  async function deleteEvent (id) {
    try {
      await axios.delete(BASE + `events/modify/${id}/`, { data: { id } })
      return { success: true }
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Failed to delete event' }
    }
  }

  return { events, loading, fetchEvents, createEvent, updateEvent, deleteEvent }
})
