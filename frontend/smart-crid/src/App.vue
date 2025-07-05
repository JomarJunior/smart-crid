<template>
  <VApp>
    <AppBar :title="appTitle" :items="navigationItems" />
    <VMain>
      <RouterView />
    </VMain>
  </VApp>
</template>

<script>
import { RouterLink, RouterView } from 'vue-router'
import AppBar from './components/AppBar.vue'

export default {
  name: 'App',
  components: {
    RouterLink,
    RouterView,
    AppBar,
  },
  data: () => ({}),
  computed: {
    appTitle() {
      // If development, return a different title
      return 'Smart CRID'
    },
    navigationItems() {
      return [
        { name: 'Home', path: '/' },
        { name: 'About', path: '/about' },
        { name: 'Contact', path: '/contact' },
      ]
    },
  },
}
</script>