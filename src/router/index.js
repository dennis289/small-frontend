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
    redirect: '/login'
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/login'  
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/pages/login.vue')
  },
  {
    path: '/signup',
    name: 'Signup',
    component: () => import('@/pages/signup.vue')
  },
  {
    path: '/home',
    name: 'Home',
    component: () => import('@/pages/home.vue')
  },
  {
    path: '/people',
    name: 'People',
    component: () => import('@/pages/people.vue')
  },
  {
    path: '/roles',
    name: 'Roles',
    component: () => import('@/pages/roles.vue')
  },
  {
    path: '/events',
    name: 'Events',
    component: () => import('@/pages/events.vue')
  },
  {
    path: '/rosters',
    name: 'Rosters',
    component: () => import('@/pages/rosters.vue')
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

// Authentication guard
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('auth_token');
  const isAuthenticated = !!token;

  // pages that don't require authentication
  const publicPages = ['/login', '/signup'];
  const isPublicPage = publicPages.includes(to.path);

  // redirect to login if not authenticated and trying to access a restricted page
  if (to.path === '/'){
    if (isAuthenticated) {
      next('/home')
    } else{
      next('/login')
    }
    return
  }
  
  // if not authenticated and trying to access protected page
  if (!isAuthenticated && !isPublicPage) {
    return next('/login');
  }
  
  // if authenticated and trying to access public page, redirect to home
  if (isAuthenticated && isPublicPage) {
    return next('/home');
  }
  
  next();
}
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
