<template>
  <VContainer fluid>
    <VRow>
      <VCol cols="3">
        <!-- Left space  --->
      </VCol>
      <VCol>
        <VIcon size="100" icon="mdi-school" color="primary"></VIcon>
        <div class="d-flex flex-column align-left justify-center">
          <p class="text-h2 brutalist-font">
            Welcome to the Smart CRID <br />
            User Interface
          </p>
          <p>
            This interface allows you to manage student records, enrollments, and course listings
            efficiently.
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
      <VCol cols="12" sm="8" md="6"> </VCol>
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
    <VRow>
      <VCol cols="12" sm="8" md="6">
        <BrutalistCard>
          <template #title>
            <span class="ml-2">Smart CRID Statistics</span>
          </template>
          <template #text>
            <p class="text-body-1">
              The Smart CRID system is designed to streamline the management of student records and
              course enrollments. Here you can view the total number of students, courses, and
              enrollments in the system.
            </p>
            <VList
              class="mt-2"
              style="
                background-color: transparent;
                border: 1px solid rgb(var(--v-theme-primary));
                border-radius: 8px;
                box-shadow: 8px 8px rgb(var(--v-theme-primary));
              "
            >
              <VContainer>
                <VRow>
                  <VCol>
                    <VListItem>
                      <VListItemIcon>
                        <VIcon icon="mdi-account" />
                      </VListItemIcon>
                      <VListItemContent>
                        <VListItemTitle>Total Students</VListItemTitle>
                        <VListItemSubtitle>{{ studentStore.students.length }}</VListItemSubtitle>
                      </VListItemContent>
                    </VListItem>
                  </VCol>
                  <VCol>
                    <VListItem>
                      <VListItemIcon>
                        <VIcon icon="mdi-book" />
                      </VListItemIcon>
                      <VListItemContent>
                        <VListItemTitle>Total Courses</VListItemTitle>
                        <VListItemSubtitle>{{ coordinatorStore.courses.length }}</VListItemSubtitle>
                      </VListItemContent>
                    </VListItem>
                  </VCol>
                  <VCol>
                    <VListItem>
                      <VListItemIcon>
                        <VIcon icon="mdi-school" />
                      </VListItemIcon>
                      <VListItemContent>
                        <VListItemTitle>Total Enrollments</VListItemTitle>
                        <VListItemSubtitle>{{
                          coordinatorStore.enrollments.length
                        }}</VListItemSubtitle>
                      </VListItemContent>
                    </VListItem>
                  </VCol>
                </VRow>
              </VContainer>
            </VList>
          </template>
        </BrutalistCard>
      </VCol>
    </VRow>
  </VContainer>
</template>

<script>
import BrutalistCard from "@/components/BrutalistCard.vue";
import BrutalistButton from "@/components/BrutalistButton.vue";
import { useBlockchainStore } from "@/stores/blockchain";
import { useStudentStore } from "@/stores/student";
import { useCoordinatorStore } from "@/stores/coordinator";

export default {
  name: "HomePage",
  components: {
    BrutalistCard,
    BrutalistButton,
  },
  data: () => ({
    blockchainStore: useBlockchainStore(),
    studentStore: useStudentStore(),
    coordinatorStore: useCoordinatorStore(),
  }),
  async mounted() {
    // Initialize the blockchain store when the component is mounted
    await this.blockchainStore.connect();
    await this.studentStore.connect();
    await this.studentStore.fetchStudents();

    await this.coordinatorStore.connect();
    await this.coordinatorStore.fetchCourses();
    await this.coordinatorStore.fetchEnrollments();
  },
  methods: {
    // Add any methods needed for the component here
  },
  computed: {
    // Add any computed properties needed for the component here
    allAccounts() {
      if (!this.blockchainStore.isConnected) {
        return [];
      }
      return this.blockchainStore.getAccounts;
    },
    navigationLinks() {
      return [
        {
          name: "List of Students",
          path: "/students/list",
          icon: "mdi-account-group",
        },
        {
          name: "List of Courses",
          path: "/coordinators/courses/list",
          icon: "mdi-book-open",
        },
      ];
    },
  },
};
</script>
