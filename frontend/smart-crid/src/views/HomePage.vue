<template>
  <VContainer fluid>
    <BrutalistCard max-width="600">
      <template #title>
        <span>Welcome to Smart CRID</span>
      </template>
      <template #text>
        <VList>
          <VListItem v-for="account in allAccounts" :key="account">
            {{ account }}
          </VListItem>
        </VList>
      </template>
      <template #actions>
        <BrutalistButton prependIcon="mdi-hand-pointing-right" to="/enrollment">
          Start Enrollment
        </BrutalistButton>
        <BrutalistButton prependIcon="mdi-information" to="/about">
          About Smart CRID
        </BrutalistButton>
      </template>
    </BrutalistCard>
  </VContainer>
</template>

<script>
import BrutalistCard from '@/components/BrutalistCard.vue'
import BrutalistButton from '@/components/BrutalistButton.vue'
import { useBlockchainStore } from '@/stores/blockchain'

export default {
  name: 'HomePage',
  components: {
    BrutalistCard,
    BrutalistButton,
  },
  data: () => ({
    blockchainStore: useBlockchainStore(),
  }),
  mounted() {
    // Initialize the blockchain store when the component is mounted
    this.blockchainStore.connect()
  },
  methods: {
    // Add any methods needed for the component here
  },
  computed: {
    // Add any computed properties needed for the component here
    allAccounts() {
      if (!this.blockchainStore.isConnected) {
        return []
      }
      return this.blockchainStore.getAccounts
    },
  },
}
</script>
