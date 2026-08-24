/**
 * Routes and the navigation guard.
 *
 * Route meta flags:
 *   meta.public         reachable without a token (the shareable feedback form)
 *   meta.platformAdmin  superadmins only (the clients console)
 *   meta.roles          tenant roles allowed here; omit to allow every role
 *
 * Role gating here is *navigational only* — it stops people landing on a page
 * full of buttons that would 403. The real enforcement is the permission class on
 * each API endpoint; see `small_app/permissions.py`.
 *
 * The guard reads localStorage (via `@/session`) rather than the auth store, because
 * it runs before Pinia is guaranteed to be hydrated. It gates on whether the refresh
 * token is still alive: an expired *access* token passes, since the 401 interceptor
 * in `main.js` renews it transparently, but an expired refresh token means the
 * session is over and the user is sent to /login with a `?redirect=` back to where
 * they were going.
 */

// Composables
import { createRouter, createWebHistory } from 'vue-router'
import {
  clearSession, getRole, hasLiveSession, homeRoute, isPlatformAdmin,
  ROLE_ADMIN, ROLE_MEMBER, ROLE_SCHEDULER,
} from '@/session'

const ALL_ROLES = [ROLE_ADMIN, ROLE_SCHEDULER, ROLE_MEMBER]
const SCHEDULING = [ROLE_ADMIN, ROLE_SCHEDULER]

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
  // Read-only published schedule — the one page every role can open.
  {
    path: '/schedule',
    name: 'Schedule',
    component: () => import('@/pages/schedule.vue'),
    meta: { roles: ALL_ROLES },
  },
  {
    path: '/home',
    name: 'Home',
    component: () => import('@/pages/home.vue'),
    meta: { roles: [ROLE_ADMIN] },
  },
  // Setup data. Schedulers can *read* these through the API (the roster generator
  // needs it) but managing them is an admin job, so the pages are admin-only.
  {
    path: '/people',
    name: 'People',
    component: () => import('@/pages/people.vue'),
    meta: { roles: [ROLE_ADMIN] },
  },
  {
    path: '/roles',
    name: 'Roles',
    component: () => import('@/pages/roles.vue'),
    meta: { roles: [ROLE_ADMIN] },
  },
  {
    path: '/events',
    name: 'Events',
    component: () => import('@/pages/events.vue'),
    meta: { roles: [ROLE_ADMIN] },
  },
  {
    path: '/users',
    name: 'Users',
    component: () => import('@/pages/users.vue'),
    meta: { roles: [ROLE_ADMIN] },
  },
  // The rostering workflow.
  {
    path: '/rosters',
    name: 'Rosters',
    component: () => import('@/pages/rosters.vue'),
    meta: { roles: SCHEDULING },
  },
  {
    path: '/feedback',
    name: 'Feedback',
    component: () => import('@/pages/feedback.vue'),
    meta: { roles: SCHEDULING },
  },
  {
    path: '/streaks',
    name: 'Streaks',
    component: () => import('@/pages/streaks.vue'),
    meta: { roles: SCHEDULING },
  },
  // Recognition — admin only.
  {
    path: '/awards',
    name: 'Awards',
    component: () => import('@/pages/awards.vue'),
    meta: { roles: [ROLE_ADMIN] },
  },
  // Password reset — both public: a locked-out user has no token by definition.
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: () => import('@/pages/forgot-password.vue'),
    meta: { public: true },
  },
  {
    path: '/reset-password',
    name: 'ResetPassword',
    component: () => import('@/pages/reset-password.vue'),
    meta: { public: true },
  },
  {
    path: '/feedback/share/:token',
    name: 'FeedbackShare',
    component: () => import('@/pages/feedback-share.vue'),
    meta: { public: true },
  },
  {
    path: '/admin/clients',
    name: 'AdminClients',
    component: () => import('@/pages/admin-clients.vue'),
    meta: { platformAdmin: true },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

// Authentication guard
router.beforeEach((to, from, next) => {
  // A live session needs an unexpired *refresh* token; an expired access token is
  // routine and gets renewed by the interceptor. Once the refresh token is dead
  // there's nothing to recover, so drop the stale keys here rather than letting the
  // user reach a page that will only fail its first API call.
  const isAuthenticated = hasLiveSession()
  if (!isAuthenticated) {
    clearSession()
  }
  const platformAdmin = isPlatformAdmin()
  const role = getRole()
  // Where this user belongs by default — differs per role.
  const homeFor = homeRoute()

  // pages that don't require authentication (static paths + any route with meta.public)
  const publicPages = new Set(['/login'])
  const isPublicPage = publicPages.has(to.path) || to.matched.some(r => r.meta?.public)

  if (to.path === '/') {
    return next(isAuthenticated ? homeFor : '/login')
  }

  // if not authenticated and trying to access protected page — remember where they
  // were headed so login can return them there
  if (!isAuthenticated && !isPublicPage) {
    return next(
      to.fullPath && to.fullPath !== '/'
        ? { path: '/login', query: { redirect: to.fullPath } }
        : '/login',
    )
  }

  // platform-admin-only routes (the clients console)
  if (to.meta?.platformAdmin && !platformAdmin) {
    return next(homeFor)
  }

  // Tenant-role routes. Platform admins have no tenant role and own no tenant
  // data, so they're sent back to their console rather than shown an empty page.
  const roleBlocked = platformAdmin || !to.meta?.roles?.includes(role)
  if (isAuthenticated && to.meta?.roles && roleBlocked) {
    return next(homeFor)
  }

  // if authenticated and on login/signup, send them to their home — but leave shareable
  // public routes (meta.public) alone so admins can preview share links while logged in.
  if (isAuthenticated && publicPages.has(to.path)) {
    return next(homeFor)
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
