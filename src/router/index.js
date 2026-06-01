/**
 * router/index.ts
 *
 * Manual routes configuration
 */

// Composables
import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/login',
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/login',
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/pages/login.vue'),
  },
  {
    path: '/signup',
    name: 'Signup',
    component: () => import('@/pages/signup.vue'),
  },
  {
    path: '/home',
    name: 'Home',
    component: () => import('@/pages/home.vue'),
  },
  {
    path: '/people',
    name: 'People',
    component: () => import('@/pages/people.vue'),
  },
  {
    path: '/roles',
    name: 'Roles',
    component: () => import('@/pages/roles.vue'),
  },
  {
    path: '/events',
    name: 'Events',
    component: () => import('@/pages/events.vue'),
  },
  {
    path: '/rosters',
    name: 'Rosters',
    component: () => import('@/pages/rosters.vue'),
  },
  {
    path: '/feedback',
    name: 'Feedback',
    component: () => import('@/pages/feedback.vue'),
  },
  {
    path: '/streaks',
    name: 'Streaks',
    component: () => import('@/pages/streaks.vue'),
  },
  {
    path: '/awards',
    name: 'Awards',
    component: () => import('@/pages/awards.vue'),
  },
  {
    path: '/feedback/share/:token',
    name: 'FeedbackShare',
    component: () => import('@/pages/feedback-share.vue'),
    meta: { public: true },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

// Authentication guard
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('auth_token')
  const isAuthenticated = !!token

  // pages that don't require authentication (static paths + any route with meta.public)
  const publicPages = ['/login', '/signup']
  const isPublicPage = publicPages.includes(to.path) || to.matched.some(r => r.meta?.public)

  // redirect to login if not authenticated and trying to access a restricted page
  if (to.path === '/') {
    if (isAuthenticated) {
      next('/home')
    } else {
      next('/login')
    }
    return
  }

  // if not authenticated and trying to access protected page
  if (!isAuthenticated && !isPublicPage) {
    return next('/login')
  }

  // if authenticated and on login/signup, send them home — but leave shareable public
  // routes (meta.public) alone so admins can preview share links while logged in.
  if (isAuthenticated && publicPages.includes(to.path)) {
    return next('/home')
  }

  next()
},
)
router.onError((err, to) => {
  if (err?.message?.includes?.('Failed to fetch dynamically imported module')) {
    if (localStorage.getItem('vuetify:dynamic-reload')) {
      console.error('Dynamic import error, reloading page did not fix it', err)
    } else {
      console.log('Reloading page to fix dynamic import error')
      localStorage.setItem('vuetify:dynamic-reload', 'true')
      location.assign(to.fullPath)
    }
  } else {
    console.error(err)
  }
})

router.isReady().then(() => {
  localStorage.removeItem('vuetify:dynamic-reload')
})

export default router
