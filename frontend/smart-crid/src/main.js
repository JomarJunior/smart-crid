import { createApp } from 'vue'
import { createPinia } from 'pinia'

import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

import '@mdi/font/css/materialdesignicons.css'

import App from './App.vue'
import router from './router'

import brutalistTheme from './assets/themes/brutalist-crid.js'
import brutalistCridLight from './assets/themes/brutalist-crid-light'
import '@/assets/styles/main.css'

const app = createApp(App)

const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'dark',
    themes: {
      'dark': brutalistTheme,
      'light': brutalistCridLight,
    },
  },
})

app.use(vuetify)
app.use(createPinia())
app.use(router)

app.mount('#app')
