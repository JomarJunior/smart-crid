import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomePage.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: {
        title: 'Smart CRID - Home',
      },
    },
  ],
})

router.beforeEach((to, from, next) => {
  // Set the document title based on the route meta title
  if (to.meta.title) {
    document.title = to.meta.title
  }
  next()
})

export default router
