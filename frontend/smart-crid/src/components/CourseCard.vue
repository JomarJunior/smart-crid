<template>
  <div>
    <BrutalistCard v-bind="$attrs">
      <template #title>
        <div class="d-flex">
          {{ course.name }}
        </div>
      </template>
      <template #text>
        <VList
          style="
            background-color: transparent;
            border: 1px solid rgb(var(--v-theme-primary));
            border-radius: 8px;
            box-shadow: 8px 8px rgb(var(--v-theme-primary));
          "
        >
          <p class="ml-5">General Information</p>
          <VListItem>
            <VListItemTitle>Description</VListItemTitle>
            <VListItemSubtitle>{{ course.description }}</VListItemSubtitle>
            <template #prepend>
              <VIcon>mdi-book-open-page-variant</VIcon>
            </template>
          </VListItem>
          <VListItem>
            <VListItemTitle>Credits</VListItemTitle>
            <VListItemSubtitle>{{ course.credits }}</VListItemSubtitle>
            <template #prepend>
              <VIcon>mdi-numeric</VIcon>
            </template>
          </VListItem>
          <VListItem>
            <VListItemTitle>Enrolled Students</VListItemTitle>
            <VListItemSubtitle
              >{{
                coordinatorStore
                  .getCourseEnrollmentsByCourseId(course.id)
                  .filter((enrollment) => enrollment.status == 1).length
              }}
              / {{ course.maxStudents }} (
              {{
                coordinatorStore
                  .getCourseEnrollmentsByCourseId(course.id)
                  .filter((enrollment) => enrollment.status == 0).length
              }}
              )
            </VListItemSubtitle>
            <template #prepend>
              <VIcon>mdi-account-multiple</VIcon>
            </template>
          </VListItem>
        </VList>
        <div class="d-flex">
          <VSpacer />
          <BrutalistButton
            color="primary"
            class="mt-4"
            @click="requestEnrollment()"
            :loading="loadingEnrollment"
          >
            Request Enrollment
          </BrutalistButton>
        </div>
        <VList
          v-if="haveCoordinatorPermission"
          style="
            background-color: transparent;
            border: 1px solid rgb(var(--v-theme-primary));
            border-radius: 8px;
            box-shadow: 8px 8px rgb(var(--v-theme-primary));
          "
          class="mt-4"
        >
          <p class="ml-5">Enrollments Sent</p>
          <VRow
            v-for="enrollment in coordinatorStore.getCourseEnrollmentsByCourseId(course.id)"
            :key="enrollment.id"
          >
            <VCol cols="12">
              <VListItem>
                <VListItemTitle>{{
                  studentStore.getFullNameByAddress(enrollment.student)
                }}</VListItemTitle>
                <VListItemSubtitle>
                  <VChip :color="enrollmentStatusColor(enrollment.status)">
                    <VIcon class="mr-4">{{
                      enrollment.status == 0
                        ? "mdi-clock"
                        : enrollment.status == 1
                          ? "mdi-check"
                          : "mdi-close"
                    }}</VIcon>
                    {{ enrollmentStatusMap(enrollment.status) }}
                  </VChip>
                  <VChip v-if="alreadyHasGrade(enrollment)" color="primary" size="x-large">
                    <VIcon class="mr-2">mdi-star-four-points</VIcon>
                    {{ coordinatorStore.getStudentGradeByCourseId(enrollment.student, course.id) }}
                  </VChip>
                </VListItemSubtitle>
                <template #prepend>
                  <VIcon>mdi-account</VIcon>
                </template>
              </VListItem>
            </VCol>
            <VCol v-if="enrollment.status == 0" class="d-flex justify-center">
              <BrutalistButton
                class="ml-3"
                prepend-icon="mdi-close"
                color="error"
                @click="coordinatorStore.rejectEnrollment(enrollment)"
              >
                Reject
              </BrutalistButton>
              <VSpacer />
              <BrutalistButton
                class="mr-5"
                prepend-icon="mdi-check"
                color="success"
                @click="coordinatorStore.approveEnrollment(enrollment)"
              >
                Approve
              </BrutalistButton>
            </VCol>
            <VCol v-if="enrollment.status == 1" class="d-flex justify-center">
              <BrutalistButton
                v-if="!alreadyHasGrade(enrollment)"
                class="ml-3"
                color="info"
                prepend-icon="mdi-star-four-points-outline"
                @click="openGradeDialog(enrollment)"
              >
                Add Grade
              </BrutalistButton>
            </VCol>
          </VRow>
        </VList>
      </template>
    </BrutalistCard>
    <VDialog v-model="displayGradeDialog" width="700">
      <BrutalistCard>
        <template #title>
          <div class="d-flex">
            Add Grade for {{ selectedGradeInfo.student }}
            <VSpacer />
            <VBtn icon="mdi-close" variant="text" @click="displayGradeDialog = false" />
          </div>
        </template>
        <template #text>
          <h1>Course: {{ course.name }}</h1>
          <p class="ml-5">Please enter the grade for the student.</p>
          <p class="ml-5">This grade will be recorded on the blockchain.</p>
          <p class="ml-5">Ensure the grade is within the valid range.</p>
          <p class="ml-5">Grade must be between 0 and 100.</p>
          <VForm @submit.prevent="submitGrade">
            <VOtpInput v-model="selectedGradeInfo.grade" label="Grade" :length="3" />
            <div class="d-flex justify-end mt-9">
              <BrutalistButton type="submit" color="primary" :disabled="disableGradeButton">
                Submit
              </BrutalistButton>
            </div>
          </VForm>
        </template>
      </BrutalistCard>
    </VDialog>
  </div>
</template>

<script>
import BrutalistCard from "./BrutalistCard.vue";
import BrutalistButton from "./BrutalistButton.vue";
import { useCoordinatorStore } from "@/stores/coordinator";
import { useStudentStore } from "@/stores/student";
import { useSmartCridStore } from "@/stores/smart-crid";
import { useAccessControlStore } from "@/stores/access-control";

export default {
  name: "CourseCard",
  inheritAttrs: false,
  components: {
    BrutalistCard,
    BrutalistButton,
  },
  props: {
    course: {
      type: Object,
      required: true,
    },
  },
  data: () => ({
    coordinatorStore: useCoordinatorStore(),
    studentStore: useStudentStore(),
    smartCridStore: useSmartCridStore(),
    accessControlStore: useAccessControlStore(),
    loadingEnrollment: false,
    displayGradeDialog: false,
    selectedGradeInfo: {
      student: null,
      enrollment: null,
      course: null,
      grade: null,
    },
  }),
  computed: {},
  methods: {
    requestEnrollment() {
      this.loadingEnrollment = true;
      this.coordinatorStore
        .requestEnrollment({ courseId: this.course.id })
        .then(() => {
          console.log("Enrollment request sent successfully");
        })
        .catch((error) => {
          console.error("Error requesting enrollment:", error);
        })
        .finally(() => {
          this.loadingEnrollment = false;
        });
    },
    submitGrade() {
      const parsedGrade = this.stringToInteger(this.selectedGradeInfo.grade);
      if (parsedGrade === null || parsedGrade < 0 || parsedGrade > 100) {
        console.error("Invalid grade input. Please enter a number between 0 and 100.");
        return;
      }
      this.coordinatorStore
        .addGrade({ ...this.selectedGradeInfo, grade: parsedGrade })
        .then(() => {
          console.log("Grade submitted successfully");
          this.displayGradeDialog = false;
        })
        .catch((error) => {
          console.error("Error submitting grade:", error);
        });
    },
    enrollmentStatusMap(status) {
      // Map the enrollment status to a human-readable string
      const statusMap = {
        0: "Pending",
        1: "Enrolled",
        2: "Rejected",
        3: "Withdrawn",
      };
      return statusMap[status] || "Unknown";
    },
    enrollmentStatusColor(status) {
      // Map the enrollment status to a color
      const colorMap = {
        0: "warning",
        1: "success",
        2: "error",
        3: "error",
      };
      return colorMap[status] || "default";
    },
    openGradeDialog(enrollment) {
      this.selectedGradeInfo = {
        student: this.studentStore.getFullNameByAddress(enrollment.student),
        studentAddress: enrollment.student,
        enrollment,
        course: this.course.id,
        grade: null,
      };
      this.displayGradeDialog = true;
    },
    stringToInteger(str) {
      // Convert a string to an integer
      const parsed = parseInt(str, 10);
      return isNaN(parsed) ? null : parsed;
    },
    alreadyHasGrade(enrollment) {
      const studentAddress = enrollment.student;
      const courseId = this.course.id;
      return this.coordinatorStore.getStudentGradeByCourseId(studentAddress, courseId) !== null;
    },
  },
  async mounted() {
    await this.coordinatorStore.fetchEnrollments();
    await this.studentStore.fetchStudents();
    const promises = this.coordinatorStore
      .getCourseEnrollmentsByCourseId(this.course.id)
      .map((enrollment) => {
        return this.studentStore.fetchStudentByAddress(enrollment.student);
      });
    await Promise.all(promises);
    await this.coordinatorStore.fetchGradesByCourseId(this.course.id);
  },
  computed: {
    haveCoordinatorPermission() {
      const isAdmin = this.accessControlStore.isAdmin(this.smartCridStore.loggedAccount);
      const isCoordinator = this.accessControlStore.isCoordinator(
        this.smartCridStore.loggedAccount,
      );
      return isAdmin || isCoordinator;
    },
    disableGradeButton() {
      return (
        this.selectedGradeInfo.grade === null ||
        this.selectedGradeInfo.grade === "" ||
        this.selectedGradeInfo.grade < 0 ||
        this.selectedGradeInfo.grade > 100
      );
    },
  },
};
</script>
