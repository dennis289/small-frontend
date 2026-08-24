/**
 * Roles store — the jobs people can be assigned to.
 *
 * `is_special_role` changes how the generator treats a role: normal roles are filled
 * once per event, special roles once per day across all events (up to
 * `max_assignments` people).
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { readApiError } from '@/validation'
import api from '../api'

export const useRolesStore = defineStore('roles', () => {
  const roles = ref([])
  const loading = ref(false)

  async function fetchRoles () {
    loading.value = true
    try {
      const res = await api.get('/api/roles/')
      roles.value = res.data
      return { success: true }
    } catch (error) {
      return { success: false, error: readApiError(error, 'Failed to fetch roles') }
    } finally {
      loading.value = false
    }
  }

  async function createRole (data) {
    try {
      const res = await api.post('/api/roles/', data)
      return { success: true, data: res.data }
    } catch (error) {
      return { success: false, error: readApiError(error, 'Failed to create role') }
    }
  }

  async function updateRole (id, data) {
    try {
      const res = await api.put(`/api/roles/modify/${id}/`, { ...data, id })
      return { success: true, data: res.data }
    } catch (error) {
      return { success: false, error: readApiError(error, 'Failed to update role') }
    }
  }

  async function deleteRole (id) {
    try {
      await api.delete(`/api/roles/modify/${id}/`)
      return { success: true }
    } catch (error) {
      return { success: false, error: readApiError(error, 'Failed to delete role') }
    }
  }

  /**
   * Persist a new role arrangement.
   *
   * `ids` is the full list in the order they should appear; the backend positions
   * each one by its index. It answers with the re-sorted roles, which replace the
   * local list so the page and the server can't drift apart.
   */
  async function reorderRoles (ids) {
    try {
      const res = await api.post('/api/roles/reorder/', { order: ids })
      roles.value = res.data
      return { success: true, data: res.data }
    } catch (error) {
      return { success: false, error: readApiError(error, 'Failed to save the new order') }
    }
  }

  return { roles, loading, fetchRoles, createRole, updateRole, deleteRole, reorderRoles }
})
