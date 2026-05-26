import axios from 'axios'
import { defineStore } from 'pinia'
import { ref } from 'vue'

const BASE = 'http://localhost:8000/api/'

export const useRolesStore = defineStore('roles', () => {
  const roles = ref([])
  const loading = ref(false)

  async function fetchRoles () {
    loading.value = true
    try {
      const res = await axios.get(BASE + 'roles/')
      roles.value = res.data
      return { success: true }
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Failed to fetch roles' }
    } finally {
      loading.value = false
    }
  }

  async function createRole (data) {
    try {
      const res = await axios.post(BASE + 'roles/', data)
      return { success: true, data: res.data }
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Failed to create role' }
    }
  }

  async function updateRole (id, data) {
    try {
      const res = await axios.put(BASE + `roles/modify/${id}/`, { ...data, id })
      return { success: true, data: res.data }
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Failed to update role' }
    }
  }

  async function deleteRole (id) {
    try {
      await axios.delete(BASE + `roles/modify/${id}/`)
      return { success: true }
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Failed to delete role' }
    }
  }

  return { roles, loading, fetchRoles, createRole, updateRole, deleteRole }
})
