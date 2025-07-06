// Central store for Smart CRID
import { defineStore } from 'pinia'
import { useTheme } from 'vuetify'

export const useSmartCridStore = defineStore('smart-crid', {
  state: () => ({
    useLightTheme: false,
    theme: useTheme(),
    loggedAccount: null, // This will hold the logged-in account information
  }),
  actions: {
    toggleTheme() {
      this.useLightTheme = !this.useLightTheme
      this.theme.global.name = this.useLightTheme ? 'light' : 'dark'
      // to set a cookie for the theme
      document.cookie = `theme=${this.useLightTheme ? 'light' : 'dark'}; path=/; max-age=31536000` // 1 year
    },
    initialize() {
      const themeCookie = document.cookie.split('; ').find((row) => row.startsWith('theme='))
      if (themeCookie) {
        const themeValue = themeCookie.split('=')[1]
        this.useLightTheme = themeValue === 'light'
      } else {
        // Default to dark theme if no cookie is set
        this.useLightTheme = false
      }
      this.theme.global.name = this.useLightTheme ? 'light' : 'dark'

      const accountCookie = document.cookie
        .split('; ')
        .find((row) => row.startsWith('loggedAccount='))
      if (accountCookie) {
        const accountValue = JSON.parse(accountCookie.split('=')[1])
        this.loggedAccount = accountValue
      } else {
        this.loggedAccount = null // No account logged in
      }
    },
    setLoggedAccount(account) {
      this.loggedAccount = account
      // Optionally, you can also store the account in localStorage or a cookie
      localStorage.setItem('loggedAccount', JSON.stringify(account))
      document.cookie = `loggedAccount=${JSON.stringify(account)}; path=/; max-age=31536000` // 1 year
    },
  },
  getters: {
    isLightTheme: (state) => state.useLightTheme,
  },
})
