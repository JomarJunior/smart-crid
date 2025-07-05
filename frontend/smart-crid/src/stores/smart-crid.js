// Central store for Smart CRID
import { defineStore } from 'pinia'
import { useTheme } from 'vuetify'

export const useSmartCridStore = defineStore('smart-crid', {
  state: () => ({
    useLightTheme: false,
    theme: useTheme(),
  }),
  actions: {
    toggleTheme() {
      this.useLightTheme = !this.useLightTheme
      this.theme.global.name = this.useLightTheme ? 'light' : 'dark'
      // to set a cookie for the theme
      document.cookie = `theme=${this.useLightTheme ? 'light' : 'dark'}; path=/; max-age=31536000` // 1 year
    },
    initializeTheme() {
      const themeCookie = document.cookie.split('; ').find(row => row.startsWith('theme='))
      if (themeCookie) {
        const themeValue = themeCookie.split('=')[1]
        this.useLightTheme = themeValue === 'light'
      } else {
        // Default to dark theme if no cookie is set
        this.useLightTheme = false
      }
      this.theme.global.name = this.useLightTheme ? 'light' : 'dark'
    },
  },
  getters: {
    isLightTheme: (state) => state.useLightTheme,
  },
})
