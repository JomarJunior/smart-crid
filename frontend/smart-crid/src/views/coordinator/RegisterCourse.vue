<template>
  <VContainer v-if="canAccess" fluid>
    <VRow>
      <VCol cols="3"></VCol>
      <VCol>
        <BrutalistCard max-width="600" icon="mdi-account-plus" class="ma-4">
          <template #title>
            <VIcon icon="mdi-book-plus" class="mr-6" />
            Register Course
          </template>
          <template #text>
            <p>
              Use the form below to register a new course in the system. Ensure all fields are
              filled out correctly.
              <RegisterCourseForm @cancel="handleCancel" />
            </p>
          </template>
        </BrutalistCard>
      </VCol>
      <VCol cols="3"></VCol>
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
import BrutalistButton from "@/components/BrutalistButton.vue";
import BrutalistCard from "@/components/BrutalistCard.vue";
import RegisterCourseForm from "@/components/RegisterCourseForm.vue";
import { useAccessControlStore } from "@/stores/access-control";
import { useSmartCridStore } from "@/stores/smart-crid";

export default {
  name: "RegisterCourse",
  data: () => ({
    // Define any data properties needed for the component
    accessControlStore: useAccessControlStore(),
    smartCridStore: useSmartCridStore(),
  }),
  components: {
    BrutalistButton,
    BrutalistCard,
    RegisterCourseForm,
  },
  methods: {
    handleCancel() {
      // Logic to handle cancellation, e.g., reset the form or navigate away
      // Route to the course list or home page
      this.$router.push({ name: "courses" });
    },
  },
  mounted() {
    // Code to run when the component is mounted
  },
  computed: {
    // Define computed properties if needed
    canAccess() {
      const isAdmin = this.accessControlStore.isAdmin(this.smartCridStore.loggedAccount);
      const isCoordinator = this.accessControlStore.isCoordinator(
        this.smartCridStore.loggedAccount,
      );
      return isAdmin || isCoordinator;
    },
  },
};
</script>
