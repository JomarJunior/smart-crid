<template>
  <VContainer v-if="canAccess" fluid>
    <VRow>
      <VCol cols="3">
        <!--left space-->
      </VCol>
      <VCol>
        <VIcon size="100" icon="mdi-shield-account" color="primary"></VIcon>
        <div class="d-flex flex-column align-left justify-center">
          <p class="text-h2 brutalist-font">Roles Home</p>
          <p>Welcome to the Roles Home page. Here you can manage roles and permissions.</p>
          <!-- Add any additional content or components related to role management here -->
        </div>
      </VCol>
      <VCol cols="3">
        <!--right space-->
      </VCol>
    </VRow>
    <VDivider class="my-4"></VDivider>
    <VRow>
      <VCol>
        <!-- left space  --->
      </VCol>
      <VCol class="d-flex justify-center">
        <BrutalistButton
          v-for="link in navigationLinks"
          :key="link.name"
          :to="link.path"
          class="ma-2"
          prepend-icon=""
          color="primary"
        >
          <VIcon :icon="link.icon" class="mr-6"></VIcon>
          {{ link.name }}
        </BrutalistButton>
      </VCol>
      <VCol>
        <!-- right space  --->
      </VCol>
    </VRow>
  </VContainer>
  <VContainer v-else>
    <BrutalistCard>
      <template #title>
        <span class="ml-2">!!!!!!!!!!!!!! Access Denied !!!!!!!!!!!!!!</span>
      </template>
      <template #text>
        <p class="text-body-1">You do not have permission to access this page.</p>
      </template>
      <BrutalistButton :to="'/'" color="secondary">Go to Home</BrutalistButton>
    </BrutalistCard>
  </VContainer>
</template>

<script>
import BrutalistButton from '@/components/BrutalistButton.vue'
import BrutalistCard from '@/components/BrutalistCard.vue'
import { useAccessControlStore } from '@/stores/access-control'
import { useSmartCridStore } from '@/stores/smart-crid'

export default {
  name: 'StudentsHome',
  components: {
    BrutalistButton,
    BrutalistCard,
  },
  data: () => ({
    // Define any data properties needed for the component
    searchQuery: '',
    accessControlStore: useAccessControlStore(),
    smartCridStore: useSmartCridStore(),
  }),
  mounted() {
    // Initialize the student store when the component is mounted
  },
  computed: {
    canAccess() {
      return (
        this.accessControlStore.isAdmin(this.smartCridStore.loggedAccount) ||
        this.accessControlStore.isCoordinator(this.smartCridStore.loggedAccount)
      )
    },
    navigationLinks() {
      return [
        {
          name: 'Add Coordinator',
          path: '/roles/add-coordinator',
          icon: 'mdi-shield-crown-outline',
        },
        {
          name: 'Add Student',
          path: '/roles/add-student',
          icon: 'mdi-shield-account-outline',
        },
      ]
    },
  },
}
</script>
