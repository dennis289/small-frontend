import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  const current = ref(localStorage.getItem('app_theme') || 'dark')

  function toggle () {
    current.value = current.value === 'dark' ? 'light' : 'dark'
    localStorage.setItem('app_theme', current.value)
  }

  function setTheme (theme) {
    current.value = theme
    localStorage.setItem('app_theme', theme)
  }

  return { current, toggle, setTheme }
})
