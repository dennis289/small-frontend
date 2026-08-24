/**
 * Events store — the recurring slots that get staffed.
 *
 * An event's bound `roles` are what the generator fills for it; an event with no
 * roles produces no assignments.
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { readApiError } from '@/validation'
import api from '../api'

export const useEventsStore = defineStore('events', () => {
  const events = ref([])
  const loading = ref(false)

  async function fetchEvents () {
    loading.value = true
    try {
      const res = await api.get('/api/events/')
      events.value = res.data
      return { success: true }
    } catch (error) {
      return { success: false, error: readApiError(error, 'Failed to fetch events') }
    } finally {
      loading.value = false
    }
  }

  async function createEvent (data) {
    try {
      const res = await api.post('/api/events/', data)
      return { success: true, data: res.data }
    } catch (error) {
      return { success: false, error: readApiError(error, 'Failed to create event') }
    }
  }

  async function updateEvent (id, data) {
    try {
      const res = await api.put(`/api/events/modify/${id}/`, data)
      return { success: true, data: res.data }
    } catch (error) {
      return { success: false, error: readApiError(error, 'Failed to update event') }
    }
  }

  async function deleteEvent (id) {
    try {
      await api.delete(`/api/events/modify/${id}/`, { data: { id } })
      return { success: true }
    } catch (error) {
      return { success: false, error: readApiError(error, 'Failed to delete event') }
    }
  }

  return { events, loading, fetchEvents, createEvent, updateEvent, deleteEvent }
})
