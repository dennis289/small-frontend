<template>
  <v-app :theme="themeStore.current">
    <v-layout>
      <navbar v-if="showNavbar" />
      <v-main>
        <router-view />
        <Toaster position="bottom-right" rich-colors :theme="themeStore.current" />
      </v-main>
    </v-layout>
  </v-app>
</template>

<script setup>
  import { computed } from 'vue'
  import { useRouter } from 'vue-router'
  import { Toaster } from 'vue-sonner'
  import { useThemeStore } from '@/stores/theme'
  import navbar from './components/navbar.vue'
  import 'vue-sonner/style.css'

  const router = useRouter()
  const themeStore = useThemeStore()

  const showNavbar = computed(() => {
    const publicPages = ['/login', '/signup']
    return !publicPages.includes(router.currentRoute.value.path)
  })
</script>
