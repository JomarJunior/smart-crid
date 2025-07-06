<template>
  <VContainer v-if="canAccess">
    <BrutalistCard>
      <template #title>
        <div class="d-flex">
          <span class="ml-2">Add Student</span>
          <VSpacer />
          <BrutalistButton
            class="mt-3"
            :loading="loading"
            :disabled="!selectedAddressesIndices.length"
            @click="submit"
          >
            Set Student Role
          </BrutalistButton>
        </div>
      </template>
      <template #text>
        <VProgressLinear v-if="loading" class="mt-3" color="primary" indeterminate height="4" />
        <div class="d-flex flex-wrap justify-center">
          <BrutalistCard
            v-for="(account, index) in blockchainStore.getStudentsAccounts"
            :key="index"
            class="text-body-1 brutalist-shadow-animated"
            :style="{
              backgroundColor: isSelected(index) ? 'rgb(var(--v-theme-accent))' : 'transparent',
            }"
            max-width="200"
            @click="toggleSelectedAddressesIndices(index)"
          >
            <template #title>
              <span class="ml-2">{{ getRole(account) }}</span>
            </template>
            <template #text>
              <p
                class="text-body-1"
                :style="{
                  color: isSelected(index)
                    ? 'rgb(var(--v-theme-background))'
                    : getColorString(account),
                }"
              >
                {{ account }}
              </p>
            </template>
          </BrutalistCard>
        </div>
      </template>
    </BrutalistCard>
  </VContainer>
  <VContainer v-else>
    <BrutalistCard>
      <template #title>
        <span class="ml-2">!!!!!!!!!!!!!! Access Denied !!!!!!!!!!!!!!</span>
      </template>
      <template #text>
        <p class="text-body-1">
          You do not have permission to access this page or perform this action.
        </p>
        <p class="text-body-1">
          If you believe this is an error, please contact your administrator.
        </p>
      </template>
      <BrutalistButton :to="'/'" color="secondary">Go to Home</BrutalistButton>
    </BrutalistCard>
  </VContainer>
</template>

<script>
import BrutalistButton from '@/components/BrutalistButton.vue'
import BrutalistCard from '@/components/BrutalistCard.vue'

import { useAccessControlStore } from '@/stores/access-control'
import { useBlockchainStore } from '@/stores/blockchain'
import { useSmartCridStore } from '@/stores/smart-crid'

export default {
  name: 'AddStudent',
  components: {
    BrutalistButton,
    BrutalistCard,
  },
  data: () => ({
    // Define any data properties needed for the component
    selectedAddressesIndices: [],
    loading: false,
    accessControlStore: useAccessControlStore(),
    blockchainStore: useBlockchainStore(),
    smartCridStore: useSmartCridStore(),
  }),
  async mounted() {
    // Initialize the student store when the component is mounted
  },
  computed: {
    // Define computed properties if needed
    canAccess() {
      return (
        this.accessControlStore.isAdmin(this.smartCridStore.loggedAccount) ||
        this.accessControlStore.isCoordinator(this.smartCridStore.loggedAccount)
      )
    },
  },
  methods: {
    // Define methods for handling form submission, etc.
    submit() {
      console.log('Selected addresses indices:', this.selectedAddressesIndices)
      const promises = this.selectedAddressesIndices.map((index) =>
        this.accessControlStore.addStudent(this.blockchainStore.getStudentsAccounts[index]),
      )

      this.loading = true
      Promise.all(promises)
        .then(() => {
          console.log('Students added successfully')
          this.selectedAddressesIndices = []
        })
        .catch((error) => {
          console.error('Error adding students:', error)
          this.$toast.error('Failed to add students. Please try again.')
        })
        .finally(() => {
          this.loading = false
        })
    },
    getRole(address) {
      const isAdmin = this.accessControlStore.isAdmin(address)
      const isCoordinator = this.accessControlStore.isCoordinator(address)
      const isStudent = this.accessControlStore.isStudent(address)

      if (isAdmin) return 'Admin'
      if (isCoordinator) return 'Coordinator'
      if (isStudent) return 'Student'
      return 'Guest'
    },
    getColorString(address) {
      return '#' + address.slice(2, 8)
    },
    toggleSelectedAddressesIndices(index) {
      const selectedIndex = this.selectedAddressesIndices.indexOf(index)
      if (selectedIndex > -1) {
        this.selectedAddressesIndices.splice(selectedIndex, 1)
      } else {
        this.selectedAddressesIndices.push(index)
      }
    },
    isSelected(index) {
      return this.selectedAddressesIndices.includes(index)
    },
  },
}
</script>
