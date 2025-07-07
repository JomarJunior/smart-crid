<template>
  <VForm @submit.prevent="handleSubmit" class="pa-4 mt-6">
    <VTextField
      v-model="courseName"
      label="Course Name"
      placeholder="Introduction to Computer Science"
      variant="outlined"
      required
    />
    <VTextarea
      v-model="courseDescription"
      label="Course Description"
      placeholder="A brief description of the course content and objectives."
      variant="outlined"
      rows="3"
      required
    />
    <VTextField v-model="credits" label="Credits" type="number" variant="outlined" required />
    <VTextField
      v-model="maxStudents"
      label="Maximum Students"
      type="number"
      variant="outlined"
      required
    />
    <div class="d-flex justify-center">
      <BrutalistButton
        prepend-icon=""
        type="submit"
        color="primary"
        class="ma-2"
        :loading="loading"
      >
        <VIcon icon="mdi-check" class="mr-2"></VIcon>
        Submit
      </BrutalistButton>
      <VSpacer />
      <BrutalistButton
        prepend-icon=""
        color="secondary"
        class="ma-2"
        @click="$emit('cancel')"
        :disabled="loading"
      >
        <VIcon icon="mdi-close" class="mr-2"></VIcon>
        Cancel
      </BrutalistButton>
    </div>
  </VForm>
</template>

<script>
import BrutalistButton from '@/components/BrutalistButton.vue'
import { useCoordinatorStore } from '@/stores/coordinator'

export default {
  name: 'RegisterCourseForm',
  components: {
    BrutalistButton,
  },
  data: () => ({
    courseName: '',
    courseDescription: '',
    credits: 4,
    maxStudents: 30,
    loading: false,
    coordinatorStore: useCoordinatorStore(),
  }),
  async mounted() {
    await this.coordinatorStore.connect()
    await this.coordinatorStore.fetchCourses()
  },
  methods: {
    handleSubmit() {
      const courseData = {
        name: this.courseName,
        description: this.courseDescription,
        credits: this.credits,
        maxStudents: this.maxStudents,
      }
      console.log('Submitting course registration:', courseData)

      this.loading = true
      this.coordinatorStore
        .addCourse(courseData)
        .then(() => {
          // Handle successful registration, e.g., show a success message or redirect
          this.$emit('courseRegistered')
          this.$router.push({ name: 'list-courses' })
        })
        .catch((error) => {
          // Handle error during registration
          console.error('Error registering course:', error)
        })
        .finally(() => {
          this.loading = false
        })
    },
  },
}
</script>
