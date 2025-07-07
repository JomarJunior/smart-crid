<template>
  <VContainer fluid>
    <VRow>
      <VCol>
        <BrutalistCard class="mb-4">
          <template #title>
            <h2>List of Students</h2>
          </template>
          <template #text>
            <div class="d-flex justify-left flex-column">
              <p>Here you can see all registered students.</p>
              <p>A student must receive a permission before registering themselves.</p>
              <p>If you have permission, you can register yourself through the registration form accessed via the button below.</p>
              <br>
              <BrutalistButton
                prepend-icon="mdi-plus"
                color="primary"
                :to="{ name: 'register-student' }"
              >
                Register New Student
              </BrutalistButton>
            </div>
          </template>
        </BrutalistCard>
        <div class="d-flex flex-wrap justify-center">
          <StudentCard
            v-for="student in students"
            :key="student.id"
            :student="student"
            width="400"
          />
        </div>
      </VCol>
    </VRow>
  </VContainer>
</template>

<script>
import { useStudentStore } from '@/stores/student'
import StudentCard from '@/components/StudentCard.vue'
import BrutalistCard from '@/components/BrutalistCard.vue'
import BrutalistButton from '@/components/BrutalistButton.vue'

export default {
  name: 'ListStudents',
  components: {
    StudentCard,
    BrutalistCard,
    BrutalistButton,
  },
  data: () => ({
    studentStore: useStudentStore(),
  }),
  computed: {
    students() {
      return this.studentStore.students
    },
  },
  async mounted() {
    await this.studentStore.connect()
    await this.studentStore.fetchStudents()
  },
}
</script>
