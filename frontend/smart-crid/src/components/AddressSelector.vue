<template>
  <VSelect
    v-model="selectedAddress"
    :items="allAccounts"
    :label="compact ? '' : 'Select Address'"
    variant="outlined"
    required
  >
    <template v-slot:selection="{ item }">
      <span v-if="compact">{{ getFullName(item.value) }}</span>
      <span v-else>{{ item.title }}</span>
    </template>
    <template v-slot:item="{ props: itemProps, item }">
      <VListItem v-bind="itemProps" title="">
        <VChip
          v-if="item.value"
          class="ma-1"
          variant="outlined"
          size="x-large"
          :color="reduceAddressDisplay(item.value).slice(0, 7)"
        >
          {{ getFullName(item.value) + roleLabel(item.value) }}
        </VChip>
      </VListItem>
    </template>
  </VSelect>
</template>

<script>
import { useBlockchainStore } from '@/stores/blockchain'
import { useAccessControlStore } from '@/stores/access-control'
import { useStudentStore } from '@/stores/student'

export default {
  name: 'AddressSelector',
  props: {
    modelValue: {
      type: String,
      default: null,
    },
    compact: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['update:modelValue'],
  data: () => ({
    blockchainStore: useBlockchainStore(),
    accessControlStore: useAccessControlStore(),
    studentStore: useStudentStore(),
    studentsIdByAddress: [],
  }),
  methods: {
    reduceAddressDisplay(address) {
      // Function to reduce the address display for better readability
      const reducedAddress = address ? `#${address.slice(2, 8)}` : ''
      if (!this.compact) {
        return reducedAddress
      }
      return reducedAddress + this.roleLabel(address)
    },
    roleLabel(address) {
      // Function to return the role label based on the address
      if (this.accessControlStore.isAdmin(address)) {
        return ' ( Coordinator )'
      } else if (this.accessControlStore.isCoordinator(address)) {
        return ' ( Professor )'
      } else if (this.accessControlStore.isStudent(address)) {
        return ' ( Student )'
      }
      return ' ( Guest )'
    },
    getFullName(account) {
      // Get the full name of the student based on the selected account
      return this.studentStore.isRegistered(account)
        ? this.studentStore.getFullNameByAddress(account)
        : '#' + account.slice(2, 8)
    },
  },
  async mounted() {
    await this.blockchainStore.connect()
    await this.accessControlStore.connect()
    this.studentStore.connect()
    this.studentStore.fetchStudents()
    const promises = this.blockchainStore.getStudentsAccounts.map((student) => {
      return this.studentStore.fetchStudentByAddress(student)
    })
    Promise.all(promises)
  },
  computed: {
    selectedAddress: {
      get() {
        return this.modelValue
      },
      set(value) {
        this.$emit('update:modelValue', value)
      },
    },
    allAccounts() {
      if (!this.blockchainStore.isConnected) {
        return []
      }
      return [this.blockchainStore.getAdminAccount].concat(
        this.blockchainStore.getCoordinatorsAccounts,
        this.blockchainStore.getStudentsAccounts,
      )
    },
  },
}
</script>
