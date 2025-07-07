import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomePage.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: HomeView,
      meta: {
        title: "Smart CRID - Home",
      },
    },
    {
      path: "/students",
      name: "students",
      component: () => import("../views/student/StudentsHome.vue"),
      meta: {
        title: "Smart CRID - Students",
      },
    },
    {
      path: "/students/list",
      name: "list-students",
      component: () => import("../views/student/ListStudents.vue"),
    },
    {
      path: "/students/register",
      name: "register-student",
      component: () => import("../views/student/RegisterStudent.vue"),
      meta: {
        title: "Smart CRID - Register Student",
      },
    },
    {
      path: "/coordinators",
      name: "coordinators",
      component: () => import("../views/coordinator/CoordinatorHome.vue"),
      meta: {
        title: "Smart CRID - Coordinators",
      },
    },
    {
      path: "/coordinators/courses/register",
      name: "register-course",
      component: () => import("../views/coordinator/RegisterCourse.vue"),
      meta: {
        title: "Smart CRID - Register Course",
      },
    },
    {
      path: "/coordinators/courses/list",
      name: "list-courses",
      component: () => import("../views/coordinator/ListCourses.vue"),
      meta: {
        title: "Smart CRID - List Courses",
      },
    },
    {
      path: "/roles",
      name: "roles",
      component: () => import("../views/role/RoleHome.vue"),
      meta: {
        title: "Smart CRID - Roles",
      },
    },
    {
      path: "/roles/add-student",
      name: "add-student-role",
      component: () => import("../views/role/AddStudent.vue"),
      meta: {
        title: "Smart CRID - Add Student Role",
      },
    },
    {
      path: "/roles/add-coordinator",
      name: "add-coordinator-role",
      component: () => import("../views/role/AddCoordinator.vue"),
      meta: {
        title: "Smart CRID - Add Coordinator Role",
      },
    },
  ],
});

router.beforeEach((to, from, next) => {
  // Set the document title based on the route meta title
  if (to.meta.title) {
    document.title = to.meta.title;
  }
  next();
});

export default router;
