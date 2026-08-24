/**
 * Light/dark preference, persisted to the `app_theme` localStorage key and applied
 * by the Vuetify plugin at startup. Defaults to light, matching the design the UI
 * is drawn in; the stored preference always wins for someone who has chosen.
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  const current = ref(localStorage.getItem('app_theme') || 'light')

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
