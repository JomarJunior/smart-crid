<template>
  <div>
    <BrutalistCard v-bind="$attrs">
      <template #title>
        <div class="d-flex">
          {{ student.fullName }}
          <VSpacer />
          <VChip class="mt-2" size="x-large" :color="student.isActive ? 'success' : 'error'">
            {{ student.isActive ? 'Active' : 'Former' }}
          </VChip>
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
          <p class="ml-5">Personal Information</p>
          <VListItem>
            <VListItemTitle>Student ID</VListItemTitle>
            <VListItemSubtitle>{{ student.id }}</VListItemSubtitle>
            <template #prepend>
              <VIcon>mdi-account</VIcon>
            </template>
          </VListItem>
          <VListItem>
            <VListItemTitle>Email</VListItemTitle>
            <VListItemSubtitle
              ><a :href="'mailto:' + student.email">{{ student.email }}</a></VListItemSubtitle
            >
            <template #prepend>
              <VIcon>mdi-email</VIcon>
            </template>
          </VListItem>
          <VListItem>
            <VListItemTitle>Program</VListItemTitle>
            <VListItemSubtitle>{{ student.program }}</VListItemSubtitle>
            <template #prepend>
              <VIcon>mdi-book</VIcon>
            </template>
          </VListItem>
          <VListItem>
            <VListItemTitle>Enrollment Year</VListItemTitle>
            <VListItemSubtitle>{{ student.enrollmentYear }}</VListItemSubtitle>
            <template #prepend>
              <VIcon>mdi-calendar</VIcon>
            </template>
          </VListItem>
        </VList>
      </template>
    </BrutalistCard>
  </div>
</template>

<script>
import BrutalistCard from './BrutalistCard.vue'

export default {
  name: 'StudentCard',
  inheritAttrs: false,
  components: {
    BrutalistCard,
  },
  props: {
    student: {
      type: Object,
      required: true,
    },
  },
  computed: {},
}
</script>
