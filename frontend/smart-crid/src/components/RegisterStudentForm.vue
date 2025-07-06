<template>
  <VForm @submit.prevent="handleSubmit" class="pa-4 mt-6">
    <VSelect
      v-model="address"
      :items="allAccounts"
      label="Select Address"
      variant="outlined"
      required
    >
      <template v-slot:selection="{ item }">
        <span>{{ item.title }}</span>
      </template>
      <template v-slot:item="{ props: itemProps, item }">
        <VListItem v-bind="itemProps" title="">
          <VChip
            v-if="item.value"
            class="ma-1"
            variant="outlined"
            size="x-large"
            :color="reduceAddressDisplay(item.value)"
          >
            {{ reduceAddressDisplay(item.value) }}
          </VChip>
        </VListItem>
      </template>
    </VSelect>
    <VTextField v-model="studentId" label="DRE" variant="outlined" required />
    <VTextField v-model="studentName" label="Student Name" variant="outlined" required />
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
      <BrutalistButton prepend-icon="" type="submit" color="primary" class="ma-2">
        <VIcon icon="mdi-check" class="mr-2"></VIcon>
        Submit
      </BrutalistButton>
      <VSpacer />
      <BrutalistButton prepend-icon="" color="secondary" class="ma-2" @click="$emit('cancel')">
        <VIcon icon="mdi-close" class="mr-2"></VIcon>
        Cancel
      </BrutalistButton>
    </div>
  </VForm>
</template>

<script>
import { useBlockchainStore } from '@/stores/blockchain'
import { useStudentStore } from '@/stores/student'
import BrutalistButton from '@/components/BrutalistButton.vue'

export default {
  name: 'RegisterStudentForm',
  components: {
    BrutalistButton,
  },
  data: () => ({
    address: '',
    studentName: '',
    studentId: '',
    email: '',
    program: '',
    enrollmentYear: null,
    blockchainStore: useBlockchainStore(),
    studentStore: useStudentStore(),
  }),
  methods: {
    handleSubmit() {
      // Logic to handle form submission, e.g., call a method to register the student
      console.log('Registering student:', {
        address: this.address,
        studentId: this.studentId,
        studentName: this.studentName,
        email: this.email,
        program: this.program,
        enrollmentYear: this.enrollmentYear,
      })
      // Here you would typically call a method from your student store to register the student

      this.studentStore
        .addStudent({
          address: this.address,
          id: this.studentId,
          fullName: this.studentName,
          email: this.email,
          program: this.program,
          enrollmentYear: this.enrollmentYear,
        })
        .then(() => {
          // Handle successful registration, e.g., show a success message or redirect
          this.$emit('studentRegistered')
        })
        .catch((error) => {
          // Handle error during registration
          console.error('Error registering student:', error)
        })
    },
    reduceAddressDisplay(address) {
      // Function to reduce the address display for better readability
      return address ? `#${address.slice(2, 8)}` : ''
    },
  },
  mounted() {
    // Any initialization logic can go here
    this.blockchainStore.connect().then(() => {
      this.address = this.blockchainStore.getStudentsAccounts[0] || ''
    })
  },
  computed: {
    allAccounts() {
      if (!this.blockchainStore.isConnected) {
        return []
      }
      return this.blockchainStore.getStudentsAccounts
    },
  },
}
</script>
