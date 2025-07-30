import { useAuthStore } from '@/stores/auth'

export function requireAuth(to, from, next) {
  const authStore = useAuthStore()
  
  // Initialize auth state from localStorage
  authStore.initializeAuth()
  
  if (!authStore.isAuthenticated) {
    // Redirect to login page with return url
    next({
      path: '/login',
      query: { redirect: to.fullPath }
    })
  } else {
    next()
  }
}

export function redirectIfAuthenticated(to, from, next) {
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
