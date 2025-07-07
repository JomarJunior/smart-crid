<template>
  <VContainer v-if="canAccess" fluid>
    <VRow>
      <VCol cols="3">
        <!-- Left space  --->
      </VCol>
      <VCol>
        <VIcon size="100" icon="mdi-account-tie-hat" color="primary"></VIcon>
        <div class="d-flex flex-column align-left justify-center">
          <p class="text-h2 brutalist-font">Professors Home</p>
          <p>
            Welcome to the Professors Home page. Here you can view and manage courses and enrollment
            requests.
          </p>
          <!-- Add any additional content or components related to coordinator management here -->
        </div>
      </VCol>
      <VCol cols="3">
        <!-- Right space  --->
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
import { useSmartCridStore } from '@/stores/smart-crid'

export default {
  name: 'CoordinatorsHome',
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
  async mounted() {
    // Initialize the coordinator store when the component is mounted
  },
  computed: {
    canAccess() {
      const isAdmin = this.accessControlStore.isAdmin(this.smartCridStore.loggedAccount)
      const isCoordinator = this.accessControlStore.isCoordinator(this.smartCridStore.loggedAccount)
      return isAdmin || isCoordinator
    },
    navigationLinks() {
      return [
        {
          name: 'List Courses',
          path: '/coordinators/courses/list',
          icon: 'mdi-book-open-page-variant',
        },
        {
          name: 'Register Course',
          path: '/coordinators/courses/register',
          icon: 'mdi-book-plus',
        },
      ]
    },
  },
}
</script>
