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
    {
      path: '/students',
      name: 'students',
      component: () => import('../views/student/StudentsHome.vue'),
      meta: {
        title: 'Smart CRID - Students',
      },
    },
    {
      path: '/students/register',
      name: 'register-student',
      component: () => import('../views/student/RegisterStudent.vue'),
      meta: {
        title: 'Smart CRID - Register Student',
      },
    },
    {
      path: '/roles',
      name: 'roles',
      component: () => import('../views/role/RoleHome.vue'),
      meta: {
        title: 'Smart CRID - Roles',
      },
    },
    {
      path: '/roles/add-student',
      name: 'add-student-role',
      component: () => import('../views/role/AddStudent.vue'),
      meta: {
        title: 'Smart CRID - Add Student Role',
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
