<template>
  <VApp>
    <AppBar :title="appTitle" :items="navigationItems" />
    <VMain>
      <RouterView />
    </VMain>
  </VApp>
</template>

<script>
import { RouterLink, RouterView } from "vue-router";
import { useBlockchainStore } from "./stores/blockchain";
import { useStudentStore } from "./stores/student";
import { useAccessControlStore } from "./stores/access-control";
import { useSmartCridStore } from "./stores/smart-crid";
import AppBar from "./components/AppBar.vue";

export default {
  name: "App",
  components: {
    RouterLink,
    RouterView,
    AppBar,
  },
  data: () => ({
    blockchain: useBlockchainStore(),
    student: useStudentStore(),
    accessControl: useAccessControlStore(),
    smartCRID: useSmartCridStore(),
  }),
  computed: {
    appTitle() {
      // If development, return a different title
      return "Smart CRID";
    },
    navigationItems() {
      const items = [
        { name: "Home", path: "/" },
        { name: "Students", path: "/students" },
      ];

      if (this.accessControl.isAdmin(this.smartCRID.loggedAccount)) {
        items.push({ name: "Professors", path: "/coordinators" });
        items.push({ name: "Roles", path: "/roles" });
      } else if (this.accessControl.isCoordinator(this.smartCRID.loggedAccount)) {
        items.push({ name: "Professors", path: "/coordinators" });
      }

      return items;
    },
  },
  mounted() {
    // Initialize the blockchain store
    console.log("Initializing blockchain store...");
    this.blockchain.connect().then(() => {
      this.student
        .connect()
        .then(() => {
          console.log("Student store connected successfully.");
          this.student.fetchStudents();
        })
        .catch((error) => {
          console.error("Error connecting student store:", error);
        });
    });
  },
};
</script>
