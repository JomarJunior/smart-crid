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
import { useBlockchainStore } from './stores/blockchain'
import { useStudentStore } from './stores/student'
import AppBar from './components/AppBar.vue'

export default {
  name: 'App',
  components: {
    RouterLink,
    RouterView,
    AppBar,
  },
  data: () => ({
    blockchain: useBlockchainStore(),
    student: useStudentStore(),
  }),
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
  mounted() {
    // Initialize the blockchain store
    console.log('Initializing blockchain store...')
    this.blockchain.connect().then(() => {
      this.student
        .connect()
        .then(() => {
          console.log('Student store connected successfully.')
          this.student.fetchStudents()
        })
        .catch((error) => {
          console.error('Error connecting student store:', error)
        })
    })
  },
}
</script>
