<template>
  <VContainer fluid>
    <VRow>
      <VCol cols="3"></VCol>
      <VCol>
        <BrutalistCard max-width="600" icon="mdi-account-plus" class="ma-4">
          <template #title>
            <VIcon icon="mdi-account-plus" class="mr-6" />
            Register Student
          </template>
          <template #text>
            <p>
              Use the form below to register yourself as a student. Ensure all fields are
              filled out correctly. In order to be able to register, you must be logged in
              with your wallet and have received an invitation from the coordinator.
              <RegisterStudentForm @cancel="handleCancel" />
            </p>
          </template>
        </BrutalistCard>
      </VCol>
      <VCol cols="3"></VCol>
    </VRow>
  </VContainer>
</template>

<script>
import BrutalistButton from '@/components/BrutalistButton.vue'
import BrutalistCard from '@/components/BrutalistCard.vue'
import RegisterStudentForm from '@/components/RegisterStudentForm.vue'

export default {
  name: 'RegisterStudent',
  components: {
    BrutalistCard,
    BrutalistButton,
    RegisterStudentForm,
  },
  data: () => ({
    // Define any data properties needed for the component
  }),
  methods: {
    handleCancel() {
      // Logic to handle cancellation, e.g., reset the form or navigate away
      // Route to the student list or home page
      this.$router.push({ name: 'students' })
    },
  },
}
</script>
