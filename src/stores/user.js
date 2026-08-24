/**
 * Logged-in user's own profile (distinct from `Persons`, who are scheduled but
 * don't log in).
 *
 * Both actions mirror the response into the `user` localStorage key, which the router
 * guard and navbar read. Note `PATCH /api/user/profile/` returns a reduced payload
 * without `client` / `is_platform_admin`, so caching it verbatim drops those flags.
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getStoredUser, getToken, USER_KEY } from '@/session'
import { readApiError } from '@/validation'
import api from '../api'

export const useUserStore = defineStore('user', () => {
  const profile = ref(getStoredUser() || {})
  const loading = ref(false)

  /**
   * Merge a profile response into the cached user rather than replacing it.
   *
   * PATCH /api/user/profile/ answers with a reduced payload that has no `client` or
   * `is_platform_admin`. Overwriting the cache with it strips those flags, and the
   * router guard reads `is_platform_admin` from the cache — so a superadmin who saved
   * their profile would be bounced out of the clients console on the next navigation.
   */
  function cacheProfile (data) {
    const merged = { ...getStoredUser(), ...data }
    localStorage.setItem(USER_KEY, JSON.stringify(merged))
    return merged
  }

  async function fetchProfile () {
    if (!getToken()) {
      return { success: false }
    }
    loading.value = true
    try {
      const res = await api.get('/api/user/profile/')
      profile.value = cacheProfile(res.data)
      return { success: true, data: res.data }
    } catch (error) {
      return { success: false, error: readApiError(error, 'Failed to fetch profile') }
    } finally {
      loading.value = false
    }
  }

  async function updateProfile (payload) {
    loading.value = true
    try {
      const res = await api.patch('/api/user/profile/', payload)
      profile.value = cacheProfile(res.data)
      return { success: true, data: res.data }
    } catch (error) {
      return { success: false, error: readApiError(error, 'Failed to update profile') }
    } finally {
      loading.value = false
    }
  }

  return { profile, loading, fetchProfile, updateProfile }
})
