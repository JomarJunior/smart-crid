<template>
  <VContainer fluid>
    <VRow>
      <VCol>
        <BrutalistCard class="mb-4">
          <template #title>
            <h2>List of Courses</h2>
          </template>
          <template #text>
            <div class="d-flex justify-left flex-column">
              <p>Here you can see all registered courses.</p>
              <p>Students can request enrollment in these courses.</p>
              <p>
                Coordinators and professors can register new courses through the registration form
                accessed via the button below.
              </p>
              <br />
              <BrutalistButton
                v-if="canRegisterCourse"
                prepend-icon="mdi-plus"
                color="primary"
                :to="{ name: 'register-course' }"
              >
                Register New Course
              </BrutalistButton>
            </div>
          </template>
        </BrutalistCard>
        <div class="d-flex flex-wrap justify-center">
          <CourseCard v-for="course in courses" :key="course.id" :course="course" width="400" />
        </div>
      </VCol>
    </VRow>
  </VContainer>
</template>

<script>
import { useCoordinatorStore } from '@/stores/coordinator'
import { useSmartCridStore } from '@/stores/smart-crid'
import { useAccessControlStore } from '@/stores/access-control'
import CourseCard from '@/components/CourseCard.vue'
import BrutalistCard from '@/components/BrutalistCard.vue'
import BrutalistButton from '@/components/BrutalistButton.vue'

export default {
  name: 'ListCourses',
  components: {
    CourseCard,
    BrutalistCard,
    BrutalistButton,
  },
  data: () => ({
    coordinatorStore: useCoordinatorStore(),
    smartCridStore: useSmartCridStore(),
    accessControlStore: useAccessControlStore(),
  }),
  computed: {
    canRegisterCourse() {
      // Check if the user has permission to register courses
      const isAdmin = this.accessControlStore.isAdmin(this.smartCridStore.loggedAccount)
      const isCoordinator = this.accessControlStore.isCoordinator(this.smartCridStore.loggedAccount)
      return isAdmin || isCoordinator
    },
    courses() {
      return this.coordinatorStore.courses
    },
  },
  async mounted() {
    await this.coordinatorStore.connect()
    await this.coordinatorStore.fetchCourses()
  },
}
</script>
