<template>
  <VForm @submit.prevent="handleSubmit" class="pa-4 mt-6">
    <VTextField v-model="studentId" label="DRE" variant="outlined" required />
    <VTextField v-model="studentName" label="First Name" variant="outlined" required />
    <VTextField v-model="studentLastName" label="Last Name" variant="outlined" required />
    <VTextField v-model="email" label="Email Address" type="email" variant="outlined" required />
    <VTextField v-model="program" label="Program" variant="outlined" required />
    <VTextField
      v-model="enrollmentYear"
      label="Enrollment Year"
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
import { useStudentStore } from '@/stores/student'
import { useSmartCridStore } from '@/stores/smart-crid'
import BrutalistButton from '@/components/BrutalistButton.vue'

export default {
  name: 'RegisterStudentForm',
  components: {
    BrutalistButton,
  },
  data: () => ({
    address: '',
    studentName: '',
    studentLastName: '',
    studentId: '',
    email: '',
    program: '',
    enrollmentYear: null,
    studentStore: useStudentStore(),
    smartCRID: useSmartCridStore(),
    loading: false,
  }),
  methods: {
    handleSubmit() {
      this.loading = true
      this.studentStore
        .addStudent({
          address: this.smartCRID.loggedAccount,
          id: this.studentId,
          fullName: this.studentName + ' ' + this.studentLastName,
          email: this.email,
          program: this.program,
          enrollmentYear: this.enrollmentYear,
        })
        .then(() => {
          // Handle successful registration, e.g., show a success message or redirect
          this.$emit('studentRegistered')
          this.$router.push({ name: 'list-students' })
        })
        .catch((error) => {
          // Handle error during registration
          console.error('Error registering student:', error)
        })
        .finally(() => {
          this.loading = false
        })
    },
  },
}
</script>
