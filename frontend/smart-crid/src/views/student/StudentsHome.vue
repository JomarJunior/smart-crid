<template>
  <VContainer fluid>
    <VRow>
      <VCol cols="3">
        <!-- Left space  --->
      </VCol>
      <VCol>
        <VIcon size="100" icon="mdi-school" color="primary"></VIcon>
        <div class="d-flex flex-column align-left justify-center">
          <p class="text-h2 brutalist-font">Students Home</p>
          <p>
            Welcome to the Students Home page. Here you can manage student records and enrollments.
          </p>
          <!-- Add any additional content or components related to student management here -->
        </div>
      </VCol>
      <VCol cols="3">
        <!-- Right space  --->
      </VCol>
    </VRow>
    <VDivider class="my-4"></VDivider>
    <VRow class="justify-center">
      <VCol cols="12" sm="8" md="6">
        <VAutocomplete
          v-model="searchQuery"
          :items="[]"
          label="Search for a student"
          class="mb-4"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
        ></VAutocomplete>
      </VCol>
    </VRow>
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
</template>

<script>
import BrutalistButton from '@/components/BrutalistButton.vue'

export default {
  name: 'StudentsHome',
  components: {
    BrutalistButton,
  },
  data: () => ({
    // Define any data properties needed for the component
    searchQuery: '',
  }),
  mounted() {
    // Initialize the student store when the component is mounted
  },
  computed: {
    navigationLinks() {
      return [
        {
          name: 'List',
          path: '/students/list',
          icon: 'mdi-account-group',
        },
        {
          name: 'Register',
          path: '/students/register',
          icon: 'mdi-account-plus',
        },
      ]
    },
  },
}
</script>
