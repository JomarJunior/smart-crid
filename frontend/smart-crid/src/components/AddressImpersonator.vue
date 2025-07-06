<template>
  <AddressSelector v-model="selectedAccount" compact max-width="200px" class="mt-5 mr-2"/>
</template>

<script>
import { useSmartCridStore } from '@/stores/smart-crid'
import { useBlockchainStore } from '@/stores/blockchain'
import AddressSelector from './AddressSelector.vue'

export default {
  name: 'AddressImpersonator',
  components: {
    AddressSelector,
  },
  data: () => ({
    smartCridStore: useSmartCridStore(),
    blockchainStore: useBlockchainStore(),
    selectedAccount: null,
  }),
  methods: {},
  async mounted() {
    // Initialize the selected account with the logged-in account from the store
    await this.blockchainStore.connect()
    await this.smartCridStore.initialize()
    this.selectedAccount = this.blockchainStore.loggedAccount || this.smartCridStore.loggedAccount || this.blockchainStore.getAdminAccount
  },
  computed: {
    adminAccounts() {
      if (!this.blockchainStore.isConnected) {
        return []
      }
      return [this.blockchainStore.getAdminAccount]
    },
    coordinatorAccounts() {
      if (!this.blockchainStore.isConnected) {
        return []
      }
      return this.blockchainStore.getCoordinatorsAccounts
    },
    studentAccounts() {
      if (!this.blockchainStore.isConnected) {
        return []
      }
      return this.blockchainStore.getStudentsAccounts
    },
  },
  watch: {
    selectedAccount(newValue) {
      // Update the logged account in the store when the selected account changes
      this.smartCridStore.setLoggedAccount(newValue)
    },
  },
}
</script>
