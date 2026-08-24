/**
 * Per-route guard helpers.
 *
 * Currently unused — `router/index.js` uses a single global `beforeEach` instead.
 * Kept for routes that need a `beforeEnter` with a `?redirect=` round-trip, which the
 * global guard doesn't do.
 */
import { useAuthStore } from '@/stores/auth'

export function requireAuth (to, from, next) {
  const authStore = useAuthStore()

  // Initialize auth state from localStorage
  authStore.initializeAuth()

  if (authStore.isAuthenticated) {
    next()
  } else {
    // Redirect to login page with return url
    next({
      path: '/login',
      query: { redirect: to.fullPath },
    })
  }
}

export function redirectIfAuthenticated (to, from, next) {
  const authStore = useAuthStore()

  // Initialize auth state from localStorage
  authStore.initializeAuth()

  if (authStore.isAuthenticated) {
    // Redirect to home if already authenticated
    next('/home')
  } else {
    next()
  }
}
